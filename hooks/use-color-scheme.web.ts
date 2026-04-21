import { useColorScheme as useSystemColorScheme } from "react-native";
import { useAppStore } from "@/stores/appStore";
import type { ColorScheme } from "@/constants/theme";

export function useColorScheme(): ColorScheme {
  const system = useSystemColorScheme();
  const { darkMode } = useAppStore();

  if (darkMode) return "dark";
  return system === "dark" ? "dark" : "light";
}

