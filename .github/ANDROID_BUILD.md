# Android Build Reference

All commands run from `android/` unless noted.

---

## Quick Commands

```bash
# From project root
cd android

./gradlew assembleDebug      # Debug APK
./gradlew assembleRelease    # Release APK
./gradlew installDebug       # Build + install debug on connected device
./gradlew installRelease     # Build + install release on connected device
./gradlew clean              # Wipe all build outputs
./gradlew tasks              # List all available tasks
```

---

## TypeScript Type Check

Run this from the **project root** (not `android/`) to catch type errors without building:

```bash
npx tsc --noEmit
```

This validates all `.ts` / `.tsx` files against `tsconfig.json` in strict mode. No output = no errors.

---

## Local Development & Debugging

For rapid iteration **without rebuilding the APK**, use Expo's dev server:

```bash
# From project root

# Option 1: Run directly on connected device (builds + installs)
npx expo run:android --device
npm run android          # Equivalent shorthand

# Option 2: Start dev server, press 'a' for Android (requires app already installed)
npm start
# → Press 'a' in terminal to connect to running app
```

**What this does:**

- Starts Metro bundler on your machine
- Connects to a **running app instance** (debug or release APK already installed)
- Instant reload when you save a file (Fast Refresh)
- No rebuild cycle → 2–5 second reload vs. 2–5 minute gradlew build

**When to use:**

- ✅ Feature development & UI iteration
- ✅ Bug fixes and quick testing
- ✅ Testing on real device with live debugging

**When to use `./gradlew assemble*` instead:**

- ✅ Final release builds
- ✅ Testing without Metro running
- ✅ Deploying to Google Play Store
- ✅ Checking bundle size & performance

**Device setup:**

1. Install debug APK first: `./gradlew installDebug` (one-time)
2. Ensure device/emulator is connected: `adb devices`
3. Run `npm expo start --device` from project root
4. Press `a` in the terminal to open on Android

---

## Running Release + Dev Builds on Same Device

Both the release build (`assembleRelease`) and the dev server (`npx expo run:android --device`) produce the same package ID (`com.advir.gostrich`). **Only one can be installed at a time.**

**Option 1: Uninstall Before Switching (Simplest)**

```bash
# Test release build
cd android
./gradlew assembleRelease
# Install manually via ADB or Android Studio

# Later, when you want to run dev server
adb uninstall com.advir.gostrich
npx expo run:android --device
```

**Option 2: Use Two Devices/Emulators**

Keep the release build on your phone and run the dev server on an emulator (or vice versa):

```bash
# Terminal 1: Install release on device
cd android
./gradlew installRelease

# Terminal 2: Run dev server on emulator
npx expo run:android --device      # Select emulator when prompted
```

**Option 3: Test Release Without Installing**

Just build the APK without installing, then install it manually when needed:

```bash
cd android
./gradlew assembleRelease           # Creates APK file only
# APK at: app/build/outputs/apk/release/app-release.apk

# Install when ready (doesn't need to be connected during build)
adb install app/build/outputs/apk/release/app-release.apk
```

---

## Build Variants

| Command           | Output             | Signed With      | Metro Required?         |
| ----------------- | ------------------ | ---------------- | ----------------------- |
| `assembleDebug`   | `app-debug.apk`    | debug.keystore   | No (JS bundled by Expo) |
| `assembleRelease` | `app-release.apk`  | debug.keystore\* | No                      |
| `installDebug`    | Installs on device | debug.keystore   | No                      |

> \*Release build currently uses the **debug keystore** (`app/debug.keystore`). For a production release, generate a proper keystore — see [React Native signed APK docs](https://reactnative.dev/docs/signed-apk-android).

APK output path: `android/app/build/outputs/apk/<variant>/app-<variant>.apk`

---

## Cleaning Builds

```bash
# Standard clean (removes build/ folders)
./gradlew clean

# Full clean including autolinking cache (required after renaming the project folder)
Remove-Item ..\android\build\generated\autolinking\autolinking.json   # PowerShell
rm ../android/build/generated/autolinking/autolinking.json            # bash
./gradlew clean

# Nuke everything and reinstall (last resort)
cd ..
Remove-Item -Recurse -Force android\.gradle
npm install
cd android
./gradlew clean
./gradlew assembleRelease
```

---

## Troubleshooting

| Symptom                                                                    | Cause                                                                  | Fix                                                                                                 |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `./gradlew clean` fails with CMake GLOB mismatch / ninja subcommand failed | Stale `.cxx` CMake cache referencing codegen dirs that don't exist yet | `Remove-Item -Recurse -Force android\app\.cxx` then re-run `./gradlew clean`                        |
| "No matching variant of project :some-module"                              | Stale autolinking JSON (paths point to old folder)                     | Delete `android/build/generated/autolinking/autolinking.json` → `./gradlew clean`                   |
| "Secrets detected" warning from GitHub                                     | Google Maps API key hardcoded in `AndroidManifest.xml`                 | Move the key to a local properties file or CI secret; rotate the leaked key in Google Cloud Console |
| Build fails after `npm install` of new native module                       | Autolinking not updated                                                | `./gradlew clean` then rebuild                                                                      |
| APK installs but map is blank                                              | Google Maps API key not set or SHA-1 fingerprint not registered        | Register debug SHA-1 in Google Cloud Console                                                        |
| `./gradlew` permission denied (Mac/Linux)                                  | File not executable                                                    | `chmod +x gradlew`                                                                                  |

---

## Inspecting the APK

```bash
# List APK contents
./gradlew assembleRelease
unzip -l app/build/outputs/apk/release/app-release.apk | grep -E "classes|assets"

# Check APK size
ls -lh app/build/outputs/apk/release/app-release.apk
```

---

## Keeping Secrets Out of VCS

The `AndroidManifest.xml` Google Maps API key **must not** be hardcoded in source.

**Recommended approach:**

1. Add to `android/local.properties` (already git-ignored):
   ```
   MAPS_API_KEY=AIza...
   ```
2. Read in `android/app/build.gradle`:

   ```groovy
   def localProperties = new Properties()
   localProperties.load(new FileInputStream(rootProject.file("local.properties")))

   android {
       defaultConfig {
           manifestPlaceholders = [mapsApiKey: localProperties['MAPS_API_KEY'] ?: ""]
       }
   }
   ```

3. Reference in `AndroidManifest.xml`:
   ```xml
   <meta-data android:name="com.google.android.geo.API_KEY"
              android:value="${mapsApiKey}" />
   ```
4. For CI, set `MAPS_API_KEY` as a repository secret and write it to `local.properties` in the workflow.
