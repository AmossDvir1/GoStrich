import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const LAST_BACKUP_KEY = "gostrich-last-backup-at";

export type BackupStatus = "idle" | "uploading" | "success" | "error";

interface BackupState {
  lastBackupAt: number | null;
  status: BackupStatus;
  errorMessage: string | null;
  pendingBackup: boolean;

  setStatus: (status: BackupStatus, errorMessage?: string | null) => void;
  setLastBackupAt: (ts: number) => void;
  setPendingBackup: (pending: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useBackupStore = create<BackupState>((set) => ({
  lastBackupAt: null,
  status: "idle",
  errorMessage: null,
  pendingBackup: false,

  setStatus: (status, errorMessage = null) => set({ status, errorMessage }),

  setLastBackupAt: (ts) => {
    set({ lastBackupAt: ts });
    void AsyncStorage.setItem(LAST_BACKUP_KEY, String(ts));
  },

  setPendingBackup: (pending) => set({ pendingBackup: pending }),

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(LAST_BACKUP_KEY);
      if (raw) set({ lastBackupAt: parseInt(raw, 10) });
    } catch {
      // Ignore — lastBackupAt stays null
    }
  },
}));
