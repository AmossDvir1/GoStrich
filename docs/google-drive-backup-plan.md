# GoStrich Backup — Implementation Plan

**Objective:** Persist user workout history across app deletions and reinstalls — same model as WhatsApp.

---

## Strategy: Two Complementary Layers

| Layer                  | Mechanism                               | User control                               | When it runs     |
| ---------------------- | --------------------------------------- | ------------------------------------------ | ---------------- |
| **Primary**            | Google Drive REST API (`appDataFolder`) | Explicit — in-app button + auto on run end | On demand        |
| **Passive safety net** | Android Auto Backup                     | None (OS-managed)                          | Nightly, on WiFi |

They are independent. The primary layer is what the user consciously relies on. The passive layer is a free bonus that requires minimal configuration.

---

## Why Not Android Auto Backup Alone?

After reviewing [developer.android.com/identity/data/autobackup](https://developer.android.com/identity/data/autobackup):

- Auto Backup **is already enabled** in the manifest (`android:allowBackup="true"`), but the Expo-generated backup rules (`secure_store_backup_rules`, `secure_store_data_extraction_rules`) are created at **build time** by the `expo-secure-store` plugin and intentionally **exclude AsyncStorage data** to protect encrypted keys.
- Even if we include AsyncStorage: backups are OS-scheduled (nightly, WiFi only, device idle), not user-triggered.
- No in-app restore flow — data only restores on fresh install via Android setup wizard.
- 25 MB limit per app (fine for our data, but not user-visible).

**Conclusion:** Auto Backup is a passive safety net, not the WhatsApp model. We use the Drive REST API for the primary flow, and fix the Auto Backup rules as a bonus.

---

## How WhatsApp Does It (Reference Model)

WhatsApp uses Google Drive's **App Data folder** (`appDataFolder`) — a hidden, private directory per app per Google account. It is:

- **Not visible** in the user's Drive UI
- **Only accessible** by the app that created it
- **Wiped** if the user explicitly revokes the app's Drive access
- **Survives** app uninstall/reinstall (as long as the user re-signs in with the same account)

We follow the same pattern.

---

## Architecture Overview

```
Phone (AsyncStorage)
  └── gostrich-workouts  →  [WorkoutSummary[]]
            │
            ▼ (on run end / manual trigger)
  BackupService.upload()
            │
            ▼
  Google Drive API — appDataFolder
            └── gostrich-backup-v1.json
                  { version, userId, exportedAt, workouts: WorkoutSummary[] }

Fresh Install
  └── App launch → user signs in
            │
            ▼
  BackupService.restore()
            │
            ▼
  Download gostrich-backup-v1.json
            │
            ▼
  Merge into workoutStore (no duplicates by id)
```

---

## Required OAuth Scopes

The current Google Sign-In only requests `profile` and `email`. We need to add:

```
https://www.googleapis.com/auth/drive.appdata
```

This is a restricted scope but does not require Google verification for personal/small-scale apps. If publishing to the Play Store, Google requires a privacy policy and may require verification.

**Changes to `@react-native-google-signin/google-signin` config:**

```typescript
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: ["https://www.googleapis.com/auth/drive.appdata"],
  offlineAccess: true, // required to get a refresh token for background backup
});
```

---

## Phases

---

### Phase 1 — Google Drive Auth & Token Management

**Goal:** Obtain and store a valid access token with Drive scope.

**Work:**

1. Update `GoogleSignin.configure()` in `auth.tsx` to add the `drive.appdata` scope.
2. After login, call `GoogleSignin.getTokens()` to retrieve `accessToken`.
3. Store the access token in-memory (do not persist to SecureStore — tokens are short-lived and refreshable).
4. Create `services/backup/auth.ts`:
   - `getValidAccessToken(): Promise<string>` — calls `GoogleSignin.getTokens()`, handles silent refresh via `GoogleSignin.signInSilently()`.

**Verify:** After sign-in, `getTokens().accessToken` decoded at jwt.io shows `https://www.googleapis.com/auth/drive.appdata` in the `scope` field.

---

### Phase 2 — Backup Service (Upload)

**Goal:** Serialize all `WorkoutSummary[]` to Drive's appDataFolder.

**File:** `services/backup/index.ts`

**Backup file schema:**

```typescript
interface BackupFile {
  version: 1;
  userId: string; // Google user email — sanity check on restore
  exportedAt: number; // Unix ms timestamp
  workouts: WorkoutSummary[];
}
```

**Upload logic (Drive REST API — no new npm packages):**

```
1. GET https://www.googleapis.com/drive/v3/files
     ?spaces=appDataFolder
     &fields=files(id,name)
   → find existing backup file id (if any)

2a. If file exists → PATCH (update)
    PATCH https://www.googleapis.com/upload/drive/v3/files/{fileId}
          ?uploadType=media
    Body: JSON.stringify(backupPayload)

2b. If no file → POST (create)
    POST https://www.googleapis.com/upload/drive/v3/files
         ?uploadType=multipart
    Body: multipart with metadata { name: 'gostrich-backup-v1.json', parents: ['appDataFolder'] }
          + JSON content
```

All requests use `Authorization: Bearer {accessToken}` header.

**Trigger points:**

- **Automatic:** called inside `workoutStore.addWorkout()` after saving the summary.
- **Manual:** "Back Up Now" button in Profile screen.

**Error handling:**

- Network failure → silently retry once; if it still fails, set a `backupStore.pendingBackup = true` flag and retry on next app foreground.
- Token expired → call `getValidAccessToken()` which silently refreshes before retrying.
- Never block the run-end flow — backup runs in the background after navigation to `/session/[id]`.

---

### Phase 3 — Restore Service (Download + Merge)

**Goal:** On first launch after fresh install, detect backup and offer restore.

**Restore logic:**

```
1. App launches → workoutStore.workouts.length === 0 AND isLoggedIn === true
2. Call BackupService.checkBackupExists() → returns { exists, exportedAt, count }
3. Show RestorePrompt modal: "We found a backup from {date} with {N} runs. Restore?"
4. On confirm → BackupService.restore():
   a. Download file content
   b. Validate { version, userId === currentUser.email }
   c. Merge: add any workout whose id is not already in the local store
   d. Show success toast with count restored
```

**Merge strategy — always by `id` (no duplicates):**

```typescript
const existing = new Set(localWorkouts.map((w) => w.id));
const toRestore = backup.workouts.filter((w) => !existing.has(w.id));
// prepend to local array, then re-sort by createdAt desc
```

---

### Phase 4 — Backup State Store

**Goal:** Track backup status for UI feedback.

**New store:** `stores/backupStore.ts` (in-memory, not persisted)

```typescript
interface BackupState {
  lastBackupAt: number | null; // persisted to AsyncStorage for display
  status: "idle" | "uploading" | "success" | "error";
  errorMessage: string | null;
  pendingBackup: boolean; // retry flag
}
```

`lastBackupAt` is the only value persisted (separately, via AsyncStorage, not Zustand persist) so the Profile screen can show "Last backed up: 2 hours ago".

---

### Phase 5 — UI Integration

**Profile Screen additions:**

- Row: "Google Drive Backup" → shows `lastBackupAt` as relative time ("Backed up 2h ago")
- Tap → opens a small sheet:
  - "Back Up Now" button (with spinner while uploading)
  - "Restore from Backup" button (only if backup exists)
  - "Last backup: {date/time}"

**Onboarding restore prompt:**

- Modal shown once on launch when `workouts.length === 0 && isLoggedIn` and a Drive backup is detected.
- "Restore {N} runs from backup?" — Yes / Skip
- Use `confirm-modal.tsx` (already exists).

---

## File Structure (New Files)

```
services/
  backup/
    index.ts       ← main BackupService (upload + restore + check)
    auth.ts        ← getValidAccessToken()
    types.ts       ← BackupFile interface

stores/
  backupStore.ts   ← status + lastBackupAt + pendingBackup

hooks/
  use-backup.ts    ← useBackup() hook for UI — wraps BackupService, manages status state
```

---

## Security Considerations

- Access tokens are **never** persisted to disk — always fetched fresh via `GoogleSignin.getTokens()` before each Drive call.
- The backup file is stored in `appDataFolder` which is **private to the app** — other apps and the user's Drive UI cannot read it.
- Validate `userId` field on restore to prevent cross-account data loading.
- No GPS points are included in the backup (they are already stripped from `WorkoutSummary` per current architecture).

---

## Limitations & Out of Scope

| Topic               | Decision                                                                               |
| ------------------- | -------------------------------------------------------------------------------------- |
| iOS iCloud Drive    | Out of scope for now — implement after Android is stable                               |
| Multiple devices    | Merge by id handles it — last backup wins for metadata                                 |
| Quota               | Each backup JSON is < 1 MB for realistic history; Drive appDataFolder has 100 MB quota |
| Conflict resolution | Simple merge by id — no complex CRDT needed at current data model                      |
| Background sync     | No background fetch needed — trigger on run end and app foreground                     |

---

## Implementation Order

1. **Phase 1** — Auth scope + token helper
2. **Phase 4** — backupStore (needed by phases 2 & 3)
3. **Phase 2** — upload service + auto-trigger on `addWorkout`
4. **Phase 3** — restore service + onboarding prompt
5. **Phase 5** — Profile UI

---

## Dependencies

No new npm packages are required. Everything is done via:

- `fetch` (Drive REST API)
- `@react-native-google-signin/google-signin` (already installed — token refresh)
- `@react-native-async-storage/async-storage` (already installed — persist `lastBackupAt`)

---

## Passive Safety Net — Android Auto Backup Fix

The current backup rules (generated by `expo-secure-store`) exclude AsyncStorage data. We need to create a custom rules file that **includes** the AsyncStorage SQLite database while keeping SecureStore excluded.

**New file: `android/app/src/main/res/xml/backup_rules.xml`** (Android 11 and below):

```xml
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
  <!-- Include AsyncStorage database (workout history) -->
  <include domain="database" path="RKStorage"/>
  <!-- Exclude SecureStore (auth tokens, profile — encrypted, device-specific) -->
  <exclude domain="sharedpref" path="expo_secure_store"/>
</full-backup-content>
```

**New file: `android/app/src/main/res/xml/data_extraction_rules.xml`** (Android 12+):

```xml
<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup disableIfNoEncryptionCapabilities="true">
    <include domain="database" path="RKStorage"/>
    <exclude domain="sharedpref" path="expo_secure_store"/>
  </cloud-backup>
  <device-transfer>
    <include domain="database" path="RKStorage"/>
  </device-transfer>
</data-extraction-rules>
```

Then update `AndroidManifest.xml`:

```xml
android:fullBackupContent="@xml/backup_rules"
android:dataExtractionRules="@xml/data_extraction_rules"
```

> **Note:** This is a bonus, low-priority step. The Drive API (Phase 1–5) is the primary backup and should be implemented first.

---

## iOS Backup

iOS users get **two layers of protection automatically** — no code changes required for the passive layer:

### Passive: iCloud Backup (Zero Code)

React Native AsyncStorage on iOS stores data in `Library/RCTAsyncLocalStorage_V1/` which is **included in iCloud Backup by default**. When an iOS user:

- Backs up their phone to iCloud
- Restores from an iCloud backup on a new device

Their workout history is automatically restored before the app even launches.

**This works today with no changes.**

### Active: Google Drive API (Same Code as Android)

Since GoStrich already uses Google Sign-In on iOS, the **exact same Drive API backup service** (Phases 1–5 below) works on iOS too — no platform-specific code needed. The `@react-native-google-signin/google-signin` package supports both platforms.

iOS users who sign in with Google get the same explicit backup/restore flow as Android users.

### What About iCloud Drive (CloudKit)?

For users who prefer Apple's ecosystem over Google:

- CloudKit / iCloud Drive integration is more complex and requires Apple Developer entitlements
- Out of scope for this phase — implement after the Google Drive approach is stable
- If added later, it should be offered as an alternative to Google Drive backup, switchable in Settings
