import { useColorScheme as useSystemColorScheme } from "react-native";
import { useAppStore } from "@/stores/appStore";
import type { ColorScheme } from "@/constants/theme";

/**
 * Returns the active color scheme, respecting the user's manual dark-mode
 * override from the app store. Falls back to the system preference.
 */
export function useColorScheme(): ColorScheme {
  const system = useSystemColorScheme();
  const { darkMode } = useAppStore();

  if (darkMode) return "dark";
  return system === "dark" ? "dark" : "light";
}

/**
 * Returns the active theme colors object for the current scheme.
 */
export { useThemeColor } from "@/hooks/use-theme-color";

