import { Platform } from "react-native";

export const Colors = {
  light: {
    // Navigation / legacy
    text: "#0F172A",
    background: "#F8FAFC",
    tint: "#10B981",
    icon: "#64748B",
    tabIconDefault: "#64748B",
    tabIconSelected: "#10B981",
    // Design system
    surface: "#FFFFFF",
    primary: "#10B981",
    danger: "#EF4444",
    warning: "#F59E0B",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    mapPath: "#3B82F6",
    illustration: {
      skin: "#FCD34D",
      shirt: "#0F172A",
      pants: "#94A3B8",
      accent: "#10B981",
    },
    shadows: {
      widget: "0px 4px 10px rgba(0, 0, 0, 0.08)",
      card: "0px -10px 25px rgba(0, 0, 0, 0.05)",
      button: "0px 8px 15px rgba(16, 185, 129, 0.3)",
    },
  },
  dark: {
    // Navigation / legacy
    text: "#F8FAFC",
    background: "#0B1120",
    tint: "#059669",
    icon: "#94A3B8",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#059669",
    // Design system
    surface: "#1E293B",
    primary: "#059669",
    danger: "#DC2626",
    warning: "#D97706",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    border: "#334155",
    mapPath: "#06B6D4",
    illustration: {
      skin: "#FDE68A",
      shirt: "#06B6D4",
      pants: "#0F172A",
      accent: "#059669",
    },
    shadows: {
      widget: "0px 4px 10px rgba(0, 0, 0, 0.4)",
      card: "0px -10px 25px rgba(0, 0, 0, 0.3)",
      button: "0px 8px 15px rgba(5, 150, 105, 0.2)",
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
});

export type ColorScheme = "light" | "dark";
export type ThemeColors = (typeof Colors)["light"];
