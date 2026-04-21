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

/**
 * Map styles for react-native-maps customMapStyle prop.
 * Light style uses default Google Maps appearance.
 * Dark style darkens elements and text for OLED screens.
 */
export const MapStyles = {
  light: [] as any[],
  dark: [
    // Base: geometry and labels setup
    { elementType: "geometry", stylers: [{ color: "#1a202c" }] },
    // Labels with fill + stroke for readability (light text + dark outline)
    { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#1a202c", weight: 3 }],
    },
    // Hide POI icons to reduce clutter
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },

    // Administrative areas
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

    // POIs - simplified visibility to reduce clutter
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

    // Roads - major roads have labels, local roads hidden
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

    // Transit - simplified
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

    // Water
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

export type ThemeColors = (typeof Colors)["light"];
