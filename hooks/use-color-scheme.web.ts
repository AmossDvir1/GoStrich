import type { ColorScheme } from "@/constants/theme";
import { useAppStore } from "@/stores/appStore";
import { useColorScheme as useSystemColorScheme } from "react-native";

export function useColorScheme(): ColorScheme {
  const system = useSystemColorScheme();
  const darkMode = useAppStore((s) => s.darkMode);
  useAppStore((s) => s.themeVariant);

  if (darkMode) return "dark";
  return system === "dark" ? "dark" : "light";
}
