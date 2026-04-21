import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "gostrich_session";

export interface UserInfo {
  email: string;
  name: string | null;
  photoUrl: string | null;
}

interface AuthState {
  isLoggedIn: boolean;
  /** true while reading from SecureStore on startup — show splash until it resolves */
  isHydrating: boolean;
  user: UserInfo | null;
  /** convenience alias kept for backward compatibility */
  userEmail: string | null;
  hydrate: () => Promise<void>;
  loginWithGoogle: (user: UserInfo) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isHydrating: true,
  user: null,
  userEmail: null,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (raw) {
        const user: UserInfo = JSON.parse(raw) as UserInfo;
        set({ isLoggedIn: true, user, userEmail: user.email });
      }
    } catch {
      // Corrupted data — wipe and start fresh
      await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => null);
    } finally {
      set({ isHydrating: false });
    }
  },

  loginWithGoogle: async (user) => {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
    set({ isLoggedIn: true, user, userEmail: user.email });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => null);
    set({ isLoggedIn: false, user: null, userEmail: null });
  },
}));
