import { createAnimations } from "@tamagui/animations-react-native";
import { defaultConfig } from "@tamagui/config/v5";
import { createFont, createTamagui, createTokens } from "tamagui";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const montserratFont = createFont({
  family: "Montserrat-Regular",
  size: {
    1: 12,
    2: 14,
    3: 15,
    4: 16,
    true: 16,
    5: 18,
    6: 20,
    7: 24,
    8: 28,
    9: 32,
  },
  lineHeight: { 1: 17, 2: 19, 4: 22, 6: 26, 9: 38 },
  weight: {
    1: "100",
    2: "200",
    3: "300",
    4: "400",
    5: "500",
    6: "600",
    7: "700",
    8: "800",
    9: "900",
  },
  letterSpacing: { 4: 0, 8: -1 },
  face: {
    100: { normal: "Montserrat-Thin" },
    200: { normal: "Montserrat-ExtraLight" },
    300: { normal: "Montserrat-Light" },
    400: { normal: "Montserrat-Regular", italic: "Montserrat-Italic" },
    500: { normal: "Montserrat-Medium" },
    600: { normal: "Montserrat-SemiBold" },
    700: { normal: "Montserrat-Bold" },
    800: { normal: "Montserrat-ExtraBold" },
    900: { normal: "Montserrat-Black" },
  },
});

const kohoFont = createFont({
  family: "KoHo-Regular",
  size: {
    1: 12,
    2: 14,
    3: 15,
    4: 16,
    true: 16,
    5: 18,
    6: 20,
    7: 24,
    8: 28,
    9: 32,
  },
  lineHeight: { 1: 17, 2: 19, 4: 22, 6: 26, 9: 38 },
  weight: {
    1: "300",
    2: "300",
    3: "300",
    4: "400",
    5: "500",
    6: "600",
    7: "700",
    8: "700",
    9: "700",
  },
  letterSpacing: { 4: 0, 8: -1 },
  face: {
    300: { normal: "KoHo-Light", italic: "KoHo-LightItalic" },
    400: { normal: "KoHo-Regular", italic: "KoHo-Italic" },
    500: { normal: "KoHo-Medium", italic: "KoHo-MediumItalic" },
    600: { normal: "KoHo-SemiBold", italic: "KoHo-SemiBoldItalic" },
    700: { normal: "KoHo-Bold", italic: "KoHo-BoldItalic" },
  },
});

// Select active font based on environment variable (default: Montserrat)
const activeFont =
  process.env.EXPO_PUBLIC_ACTIVE_FONT === "koho" ? kohoFont : montserratFont;

// ─── Animations ───────────────────────────────────────────────────────────────
// "snap" mirrors the SNAP_SPRING constant removed from HomeScreen
const animations = createAnimations({
  bouncy: { type: "spring", damping: 10, mass: 0.9, stiffness: 100 },
  lazy: { type: "spring", damping: 20, stiffness: 60 },
  quick: { type: "spring", damping: 20, mass: 1.2, stiffness: 250 },
  snap: {
    type: "spring",
    damping: 50,
    mass: 0.8,
    stiffness: 300,
    overshootClamping: true,
  },
});

// ─── Tokens ───────────────────────────────────────────────────────────────────
// Raw color values lifted directly from constants/theme.ts
const tokens = createTokens({
  color: {
    // Light palette
    backgroundLight: "#F5F3EC",
    surfaceLight: "#FFFFFF",
    textPrimaryLight: "#38384E",
    textSecondaryLight: "#64647C",
    primaryLight: "#F38D88",
    dangerLight: "#EF4444",
    warningLight: "#FDB32B",
    borderLight: "#E2DFD8",
    mapPathLight: "#F38D88",
    illustrationSkinLight: "#FDB32B",
    illustrationShirtLight: "#38384E",
    illustrationPantsLight: "#64647C",
    illustrationAccentLight: "#F38D88",

    // Dark palette
    backgroundDark: "#1C1C28",
    surfaceDark: "#2A2A3A",
    textPrimaryDark: "#F5F3EC",
    textSecondaryDark: "#BCBCD0",
    primaryDark: "#F38D88",
    dangerDark: "#F87171",
    warningDark: "#FDB32B",
    borderDark: "#595972",
    mapPathDark: "#F38D88",
    illustrationSkinDark: "#FDB32B",
    illustrationShirtDark: "#F5F3EC",
    illustrationPantsDark: "#38384E",
    illustrationAccentDark: "#F38D88",

    // Common colors
    black: "#000000",
    white: "#FFFFFF",
    transparent: "rgba(0,0,0,0)",
  },
  space: {
    $0: 0,
    $0_5: 2,
    $1: 4,
    $1_5: 6,
    $2: 8,
    $2_5: 10,
    $3: 12,
    $3_5: 14,
    $4: 16,
    $5: 20,
    $6: 24,
    $7: 28,
    $8: 32,
    $9: 36,
    $10: 40,
    $true: 16,
  },
  size: {
    $0: 0,
    $0_5: 2,
    $1: 4,
    $1_5: 6,
    $2: 8,
    $2_5: 10,
    $3: 12,
    $3_5: 14,
    $4: 16,
    $5: 20,
    $6: 24,
    $7: 28,
    $8: 32,
    $9: 36,
    $10: 40,
    $true: 40,
  },
  radius: {
    $0: 0,
    $0_5: 2,
    $1: 4,
    $1_5: 6,
    $2: 8,
    $2_5: 10,
    $3: 12,
    $3_5: 14,
    $4: 16,
    $true: 12,
    $full: 9999,
  },
  zIndex: {
    $0: 0,
    $1: 10,
    $2: 20,
    $3: 30,
    $4: 40,
    $5: 50,
    $true: 100,
  },
});

// ─── Semantic Themes ──────────────────────────────────────────────────────────
// These map to CSS-variable-style token references — accessed via `$background`
// etc. in JSX props.
const ostrichLightTheme = {
  background: "#F5F3EC",
  backgroundStrong: "#FFFFFF",
  color: "#38384E",
  colorSecondary: "#64647C",
  primary: "#F38D88",
  success: "#3FAF78",
  danger: "#EF4444",
  warning: "#FDB32B",
  borderColor: "#E2DFD8",
  mapPath: "#F38D88",
  shadowColor: "#000000",
  placeholderColor: "#64647C",
};

const ostrichDarkTheme: typeof ostrichLightTheme = {
  background: "#1C1C28",
  backgroundStrong: "#2A2A3A",
  color: "#F5F3EC",
  colorSecondary: "#BCBCD0",
  primary: "#F38D88",
  success: "#57C98D",
  danger: "#F87171",
  warning: "#FDB32B",
  borderColor: "#595972",
  mapPath: "#F38D88",
  shadowColor: "#000000",
  placeholderColor: "#BCBCD0",
};

const classicLightTheme: typeof ostrichLightTheme = {
  background: "#F8FAFC",
  backgroundStrong: "#FFFFFF",
  color: "#0F172A",
  colorSecondary: "#64748B",
  primary: "#10B981",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  borderColor: "#E2E8F0",
  mapPath: "#3B82F6",
  shadowColor: "#000000",
  placeholderColor: "#64748B",
};

const classicDarkTheme: typeof ostrichLightTheme = {
  background: "#0B1120",
  backgroundStrong: "#1E293B",
  color: "#F8FAFC",
  colorSecondary: "#94A3B8",
  primary: "#059669",
  success: "#34D399",
  danger: "#DC2626",
  warning: "#D97706",
  borderColor: "#334155",
  mapPath: "#06B6D4",
  shadowColor: "#000000",
  placeholderColor: "#94A3B8",
};

// ─── Config ───────────────────────────────────────────────────────────────────
export const tamaguiConfig = createTamagui({
  animations,
  defaultTheme: "light",
  shouldAddPrefersColorTheme: false, // We manage theme via colorScheme hook
  themeClassNameOnRoot: false, // Not a web app
  tokens,
  themes: {
    // Backward-compatible defaults
    light: ostrichLightTheme,
    dark: ostrichDarkTheme,
    // Variant-specific themes selected at runtime in app/_layout.tsx
    ostrich_light: ostrichLightTheme,
    ostrich_dark: ostrichDarkTheme,
    classic_light: classicLightTheme,
    classic_dark: classicDarkTheme,
  },
  fonts: {
    heading: activeFont,
    body: activeFont,
  },
  media: defaultConfig.media,
  shorthands: defaultConfig.shorthands,
  settings: {
    fastSchemeChange: true,
    allowedStyleValues: false,
  },
});

// ─── Type Augmentation ───────────────────────────────────────────────────────
export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
