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
    backgroundLight: "#F8FAFC",
    surfaceLight: "#FFFFFF",
    textPrimaryLight: "#0F172A",
    textSecondaryLight: "#64748B",
    primaryLight: "#10B981",
    dangerLight: "#EF4444",
    warningLight: "#F59E0B",
    borderLight: "#E2E8F0",
    mapPathLight: "#3B82F6",
    illustrationSkinLight: "#FCD34D",
    illustrationShirtLight: "#0F172A",
    illustrationPantsLight: "#94A3B8",
    illustrationAccentLight: "#10B981",

    // Dark palette
    backgroundDark: "#0B1120",
    surfaceDark: "#1E293B",
    textPrimaryDark: "#F8FAFC",
    textSecondaryDark: "#94A3B8",
    primaryDark: "#059669",
    dangerDark: "#DC2626",
    warningDark: "#D97706",
    borderDark: "#334155",
    mapPathDark: "#06B6D4",
    illustrationSkinDark: "#FDE68A",
    illustrationShirtDark: "#06B6D4",
    illustrationPantsDark: "#0F172A",
    illustrationAccentDark: "#059669",

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
const lightTheme = {
  background: tokens.color.backgroundLight,
  backgroundStrong: tokens.color.surfaceLight,
  color: tokens.color.textPrimaryLight,
  colorSecondary: tokens.color.textSecondaryLight,
  primary: tokens.color.primaryLight,
  danger: tokens.color.dangerLight,
  warning: tokens.color.warningLight,
  borderColor: tokens.color.borderLight,
  mapPath: tokens.color.mapPathLight,
  shadowColor: tokens.color.black,
  placeholderColor: tokens.color.textSecondaryLight,
};

const darkTheme: typeof lightTheme = {
  background: tokens.color.backgroundDark,
  backgroundStrong: tokens.color.surfaceDark,
  color: tokens.color.textPrimaryDark,
  colorSecondary: tokens.color.textSecondaryDark,
  primary: tokens.color.primaryDark,
  danger: tokens.color.dangerDark,
  warning: tokens.color.warningDark,
  borderColor: tokens.color.borderDark,
  mapPath: tokens.color.mapPathDark,
  shadowColor: tokens.color.black,
  placeholderColor: tokens.color.textSecondaryDark,
};

// ─── Config ───────────────────────────────────────────────────────────────────
export const tamaguiConfig = createTamagui({
  animations,
  defaultTheme: "light",
  shouldAddPrefersColorTheme: false, // We manage theme via colorScheme hook
  themeClassNameOnRoot: false, // Not a web app
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  fonts: {
    heading: montserratFont,
    body: montserratFont,
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
