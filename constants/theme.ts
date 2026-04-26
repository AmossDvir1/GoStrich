import { useAppStore } from "@/stores/appStore";
import { Platform } from "react-native";

const OSTRICH = {
  legs: "#F38D88",
  legsDark: "#E57570",
  body: "#38384E",
  wing: "#64647C",
  beak: "#FDB32B",
  bgLight: "#F5F3EC",
  bgDark: "#1C1C28",
  surfaceDark: "#2A2A3A",
  textSecondaryDark: "#BCBCD0",
  borderDark: "#595972",
  tabIconDark: "#A9A9C0",
  success: "#3FAF78",
  successDark: "#57C98D",
};

const OSTRICH_COLORS = {
  light: {
    // Navigation / legacy
    text: OSTRICH.body,
    background: OSTRICH.bgLight,
    tint: OSTRICH.legs,
    icon: OSTRICH.wing,
    tabIconDefault: OSTRICH.wing,
    tabIconSelected: OSTRICH.legs,
    // Design system
    surface: "#FFFFFF",
    primary: OSTRICH.legs,
    danger: "#EF4444",
    warning: OSTRICH.beak,
    success: OSTRICH.success,
    textPrimary: OSTRICH.body,
    textSecondary: OSTRICH.wing,
    border: "#E2DFD8",
    mapPath: OSTRICH.legs,
    illustration: {
      skin: OSTRICH.beak,
      shirt: OSTRICH.body,
      pants: OSTRICH.wing,
      accent: OSTRICH.legs,
    },
    shadows: {
      widget: "0px 4px 10px rgba(0, 0, 0, 0.08)",
      card: "0px -10px 25px rgba(0, 0, 0, 0.05)",
      button: "0px 8px 15px rgba(243, 141, 136, 0.3)",
    },
  },
  dark: {
    // Navigation / legacy
    text: OSTRICH.bgLight,
    background: OSTRICH.bgDark,
    tint: OSTRICH.legs,
    icon: OSTRICH.textSecondaryDark,
    tabIconDefault: OSTRICH.tabIconDark,
    tabIconSelected: OSTRICH.legs,
    // Design system
    surface: OSTRICH.surfaceDark,
    primary: OSTRICH.legs,
    danger: "#F87171",
    warning: OSTRICH.beak,
    success: OSTRICH.successDark,
    textPrimary: OSTRICH.bgLight,
    textSecondary: OSTRICH.textSecondaryDark,
    border: OSTRICH.borderDark,
    mapPath: OSTRICH.legs,
    illustration: {
      skin: OSTRICH.beak,
      shirt: OSTRICH.bgLight,
      pants: OSTRICH.body,
      accent: OSTRICH.legs,
    },
    shadows: {
      widget: "0px 4px 10px rgba(0, 0, 0, 0.4)",
      card: "0px -10px 25px rgba(0, 0, 0, 0.3)",
      button: "0px 8px 15px rgba(243, 141, 136, 0.2)",
    },
  },
} as const;

const CLASSIC_COLORS = {
  light: {
    text: "#0F172A",
    background: "#F8FAFC",
    tint: "#10B981",
    icon: "#64748B",
    tabIconDefault: "#64748B",
    tabIconSelected: "#10B981",
    surface: "#FFFFFF",
    primary: "#10B981",
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
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
    text: "#F8FAFC",
    background: "#0B1120",
    tint: "#059669",
    icon: "#94A3B8",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#059669",
    surface: "#1E293B",
    primary: "#059669",
    danger: "#DC2626",
    warning: "#D97706",
    success: "#34D399",
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
} as const;

export type ThemeVariant = "ostrich" | "classic";
export type ColorScheme = "light" | "dark";
export type ThemeColors =
  | typeof OSTRICH_COLORS.light
  | typeof OSTRICH_COLORS.dark;

export const ThemePalettes = {
  ostrich: OSTRICH_COLORS,
  classic: CLASSIC_COLORS,
} as const;

function getActiveThemeVariant(): ThemeVariant {
  const variant = useAppStore.getState().themeVariant;
  return variant === "classic" ? "classic" : "ostrich";
}

export const Colors = new Proxy({} as Record<ColorScheme, ThemeColors>, {
  get(_target, prop: string | symbol): ThemeColors | undefined {
    if (prop !== "light" && prop !== "dark") return undefined;
    const scheme = prop as ColorScheme;
    const variant = getActiveThemeVariant();
    return ThemePalettes[variant][scheme] as ThemeColors;
  },
});

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

const CLASSIC_MAP_STYLES = {
  light: [] as any[],
  dark: [
    { elementType: "geometry", stylers: [{ color: "#1a202c" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#1a202c", weight: 3 }],
    },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ color: "#2d3748" }],
    },
    {
      featureType: "administrative.country",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f1f5f9" }],
    },
    {
      featureType: "administrative.province",
      elementType: "labels.text.fill",
      stylers: [{ color: "#e2e8f0" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#cbd5e1" }],
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.neighborhood",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#2d3748" }],
    },
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "simplified" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#1e3a1f" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#2d3748" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#374151", weight: 2 }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f1f5f9" }],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: "#3d4556" }],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.text.fill",
      stylers: [{ color: "#e2e8f0" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2d3748" }],
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "simplified" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0f1419" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#64748b" }],
    },
  ] as any[],
};

const OSTRICH_MAP_STYLES = {
  light: [] as any[],
  dark: [
    { elementType: "geometry", stylers: [{ color: OSTRICH.bgDark }] },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: OSTRICH.textSecondaryDark }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: OSTRICH.bgDark, weight: 3 }],
    },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ color: OSTRICH.surfaceDark }],
    },
    {
      featureType: "administrative.country",
      elementType: "labels.text.fill",
      stylers: [{ color: OSTRICH.bgLight }],
    },
    {
      featureType: "administrative.province",
      elementType: "labels.text.fill",
      stylers: [{ color: OSTRICH.bgLight }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: OSTRICH.bgLight }],
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.neighborhood",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: OSTRICH.surfaceDark }],
    },
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "simplified" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: OSTRICH.surfaceDark }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: OSTRICH.body }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: OSTRICH.wing, weight: 2 }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: OSTRICH.bgLight }],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: OSTRICH.body }],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.text.fill",
      stylers: [{ color: OSTRICH.textSecondaryDark }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: OSTRICH.surfaceDark }],
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "simplified" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0F0F17" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: OSTRICH.textSecondaryDark }],
    },
  ] as any[],
};

/**
 * Map styles for react-native-maps customMapStyle prop.
 * Light style uses default Google Maps appearance.
 * Dark style darkens elements and text for OLED screens.
 */
export const MapStyles = {
  get light(): any[] {
    const variant = getActiveThemeVariant();
    return variant === "classic"
      ? CLASSIC_MAP_STYLES.light
      : OSTRICH_MAP_STYLES.light;
  },
  get dark(): any[] {
    const variant = getActiveThemeVariant();
    return variant === "classic"
      ? CLASSIC_MAP_STYLES.dark
      : OSTRICH_MAP_STYLES.dark;
  },
};
