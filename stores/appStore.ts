import { create } from "zustand";

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

export const useAppStore = create<AppState>((set) => ({
  unitSystem: "metric",
  mapStyle: "standard",
  darkMode: false,

  setUnitSystem: (unitSystem) => set({ unitSystem }),
  setMapStyle: (mapStyle) => set({ mapStyle }),
  setDarkMode: (darkMode) => set({ darkMode }),
}));
