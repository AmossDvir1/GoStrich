import * as BackupService from "@/services/backup";
import type { BackupFile, BackupInfo } from "@/services/backup/types";
import { useAuthStore } from "@/stores/authStore";
import { useBackupStore } from "@/stores/backupStore";
import { useWorkoutStore } from "@/stores/workoutStore";
import type { WorkoutSummary } from "@/types/workout";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system/next";

/**
 * Fire-and-forget backup trigger. Safe to call from outside React components
 * (e.g. from use-run-session after saving a workout).
 */
export async function triggerSilentBackup(): Promise<void> {
  const { status, setStatus, setLastBackupAt, setPendingBackup } =
    useBackupStore.getState();
  if (status === "uploading") return;

  const user = useAuthStore.getState().user;
  if (!user) return;

  const workouts = useWorkoutStore.getState().workouts;
  setStatus("uploading");
  try {
    await BackupService.upload(workouts, user.email);
    setLastBackupAt(Date.now());
    setStatus("success");
    setPendingBackup(false);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setStatus("error", msg);
    setPendingBackup(true);
  }
}

/** React hook that exposes backup/restore actions and status for UI components. */
export function useBackup() {
  const user = useAuthStore((s) => s.user);
  const workouts = useWorkoutStore((s) => s.workouts);
  const addWorkoutsBulk = useWorkoutStore((s) => s.addWorkoutsBulk);
  const {
    status,
    errorMessage,
    lastBackupAt,
    setStatus,
    setLastBackupAt,
    setPendingBackup,
  } = useBackupStore();

  const backup = async (): Promise<void> => {
    if (!user) return;
    setStatus("uploading");
    try {
      await BackupService.upload(workouts, user.email);
      setLastBackupAt(Date.now());
      setStatus("success");
      setPendingBackup(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus("error", msg);
      setPendingBackup(true);
    }
  };

  const checkBackup = async (): Promise<BackupInfo> => {
    return BackupService.checkBackupExists();
  };

  const restore = async (): Promise<number> => {
    if (!user) return 0;
    const restored = await BackupService.restore(user.email);
    const existing = new Set(workouts.map((w) => w.id));
    const toAdd = restored.filter((w) => !existing.has(w.id));
    if (toAdd.length > 0) {
      addWorkoutsBulk(toAdd);
    }
    return toAdd.length;
  };

  /** Pick a GoStrich JSON export file and merge its workouts into the local store. */
  const importFromFile = async (): Promise<number> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/plain", "text/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return 0;

    const uri = result.assets[0]?.uri;
    if (!uri) return 0;

    const raw = await new File(uri).text();
    const json = JSON.parse(raw) as
      | BackupFile
      | { version: 1; workouts: WorkoutSummary[] };

    if (!Array.isArray(json.workouts)) throw new Error("Invalid backup file");

    const existing = new Set(workouts.map((w) => w.id));
    const toAdd = json.workouts.filter((w) => !existing.has(w.id));
    if (toAdd.length > 0) {
      addWorkoutsBulk(toAdd);
    }
    return toAdd.length;
  };

  return {
    backup,
    checkBackup,
    restore,
    importFromFile,
    status,
    errorMessage,
    lastBackupAt,
  };
}
