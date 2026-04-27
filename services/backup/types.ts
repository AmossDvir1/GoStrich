import type { WorkoutSummary } from "@/types/workout";

export interface BackupFile {
  version: 1;
  userId: string;
  exportedAt: number;
  workouts: WorkoutSummary[];
}

export interface BackupInfo {
  exists: boolean;
  fileId: string | null;
  exportedAt: number | null;
  count: number;
}
