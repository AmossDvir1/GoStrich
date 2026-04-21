import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const PROFILE_KEY = "gostrich_profile";

export interface UserProfile {
  firstName: string;
  lastName: string;
  /** Local file URI or remote URL for profile photo, null = not set */
  photoUrl: string | null;
  /** kg, null means not set */
  weightKg: number | null;
  /** cm, null means not set */
  heightCm: number | null;
}

interface ProfileState {
  profile: UserProfile;
  hydrate: () => Promise<void>;
  save: (updates: Partial<UserProfile>) => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  photoUrl: null,
  weightKg: null,
  heightCm: null,
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: DEFAULT_PROFILE,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(PROFILE_KEY);
      if (raw) {
        set({ profile: JSON.parse(raw) as UserProfile });
      }
    } catch {
      await SecureStore.deleteItemAsync(PROFILE_KEY).catch(() => null);
    }
  },

  save: async (updates) => {
    const next = { ...get().profile, ...updates };
    set({ profile: next });
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(next));
  },
}));
