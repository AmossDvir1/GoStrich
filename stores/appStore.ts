import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type UnitSystem = "metric" | "imperial";
type MapStyle = "standard" | "satellite" | "terrain";
export type ThemeVariant = "ostrich" | "classic";

interface AppState {
  unitSystem: UnitSystem;
  mapStyle: MapStyle;
  darkMode: boolean;
  countdownEnabled: boolean;
  themeVariant: ThemeVariant;

  setUnitSystem: (system: UnitSystem) => void;
  setMapStyle: (style: MapStyle) => void;
  setDarkMode: (enabled: boolean) => void;
  setCountdownEnabled: (enabled: boolean) => void;
  setThemeVariant: (variant: ThemeVariant) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      unitSystem: "metric",
      mapStyle: "standard",
      darkMode: false,
      countdownEnabled: true,
      themeVariant: "ostrich",

      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setMapStyle: (mapStyle) => set({ mapStyle }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setCountdownEnabled: (countdownEnabled) => set({ countdownEnabled }),
      setThemeVariant: (themeVariant) => set({ themeVariant }),
    }),
    {
      name: "gostrich-app",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
