import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type UnitSystem = "metric" | "imperial";
type MapStyle = "standard" | "satellite" | "terrain";

interface AppState {
  unitSystem: UnitSystem;
  mapStyle: MapStyle;
  darkMode: boolean;

  setUnitSystem: (system: UnitSystem) => void;
  setMapStyle: (style: MapStyle) => void;
  setDarkMode: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      unitSystem: "metric",
      mapStyle: "standard",
      darkMode: false,

      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setMapStyle: (mapStyle) => set({ mapStyle }),
      setDarkMode: (darkMode) => set({ darkMode }),
    }),
    {
      name: "gostrich-app",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
