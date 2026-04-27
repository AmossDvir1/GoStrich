import type { WorkoutSummary } from "@/types/workout";
import { getValidAccessToken } from "./auth";
import type { BackupFile, BackupInfo } from "./types";

const BACKUP_FILENAME = "gostrich-backup-v1.json";
const DRIVE_FILES = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  return { Authorization: `Bearer ${token}` };
}

async function driveError(res: Response, context: string): Promise<Error> {
  let reason = String(res.status);
  try {
    const json = JSON.parse(await res.text()) as {
      error?: { message?: string };
    };
    if (json.error?.message) reason = `${res.status}: ${json.error.message}`;
  } catch {
    // ignore — use status code only
  }
  return new Error(`${context} (${reason})`);
}

async function findFileId(): Promise<string | null> {
  const h = await authHeaders();
  const url = `${DRIVE_FILES}?spaces=appDataFolder&fields=files(id)&q=name%3D%27${BACKUP_FILENAME}%27`;
  const res = await fetch(url, { headers: h });
  if (!res.ok) return null;
  const data = (await res.json()) as { files: { id: string }[] };
  return data.files[0]?.id ?? null;
}

/** Upload all workouts to Drive appDataFolder. Creates or overwrites the backup file. */
export async function upload(
  workouts: WorkoutSummary[],
  userId: string,
): Promise<void> {
  const h = await authHeaders();
  const payload: BackupFile = {
    version: 1,
    userId,
    exportedAt: Date.now(),
    workouts,
  };
  const body = JSON.stringify(payload);
  const existingId = await findFileId();

  if (existingId) {
    const res = await fetch(`${DRIVE_UPLOAD}/${existingId}?uploadType=media`, {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) throw await driveError(res, "Drive update failed");
    return;
  }

  // No existing file — multipart POST to create
  const boundary = "gostrich_bnd";
  const metadata = JSON.stringify({
    name: BACKUP_FILENAME,
    parents: ["appDataFolder"],
  });
  const multipart = [
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    metadata,
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    body,
    `--${boundary}--`,
  ].join("\r\n");

  const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart`, {
    method: "POST",
    headers: {
      ...h,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipart,
  });
  if (!res.ok) throw await driveError(res, "Drive create failed");
}

/** Check whether a backup exists in Drive and return its metadata. */
export async function checkBackupExists(): Promise<BackupInfo> {
  try {
    const h = await authHeaders();
    const url = `${DRIVE_FILES}?spaces=appDataFolder&fields=files(id,modifiedTime)&q=name%3D%27${BACKUP_FILENAME}%27`;
    const res = await fetch(url, { headers: h });
    if (!res.ok)
      return { exists: false, fileId: null, exportedAt: null, count: 0 };

    const data = (await res.json()) as {
      files: { id: string; modifiedTime: string }[];
    };
    const file = data.files[0];
    if (!file)
      return { exists: false, fileId: null, exportedAt: null, count: 0 };

    // Download content to read the count and exact exportedAt
    const contentRes = await fetch(`${DRIVE_FILES}/${file.id}?alt=media`, {
      headers: h,
    });
    if (!contentRes.ok) {
      return {
        exists: true,
        fileId: file.id,
        exportedAt: new Date(file.modifiedTime).getTime(),
        count: 0,
      };
    }
    const backup = (await contentRes.json()) as BackupFile;
    return {
      exists: true,
      fileId: file.id,
      exportedAt: backup.exportedAt,
      count: backup.workouts.length,
    };
  } catch {
    return { exists: false, fileId: null, exportedAt: null, count: 0 };
  }
}

/** Download and return all workouts from the Drive backup. */
export async function restore(
  currentUserId: string,
): Promise<WorkoutSummary[]> {
  const h = await authHeaders();
  const fileId = await findFileId();
  if (!fileId) return [];

  const res = await fetch(`${DRIVE_FILES}/${fileId}?alt=media`, { headers: h });
  if (!res.ok) throw await driveError(res, "Drive download failed");

  const backup = (await res.json()) as BackupFile;
  if (backup.version !== 1) throw new Error("Unknown backup version");
  if (backup.userId !== currentUserId) {
    throw new Error("Backup belongs to a different account");
  }
  return backup.workouts;
}
