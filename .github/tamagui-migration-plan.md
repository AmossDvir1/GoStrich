# GoStrich — Tamagui Migration Plan

**From:** NativeWind v4 + Tailwind CSS  
**To:** Tamagui (full replacement — no hybrid)  
**Goal:** Eliminate manual Reanimated drawer math, improve type safety, leverage RN 0.81 New Architecture.

---

## Phase 1 — Environment & Foundation

### 1.1 Remove NativeWind / Tailwind

```bash
# Remove NativeWind and Tailwind packages
npm uninstall nativewind tailwindcss

# Remove NativeWind artefacts
rm tailwind.config.js global.css nativewind-env.d.ts
```

### 1.2 Install Tamagui

```bash
# Core + config preset + Reanimated-backed animations + Sheet
npm install @tamagui/core @tamagui/config @tamagui/animations-react-native @tamagui/sheet

# Babel optimizing compiler (dev dependency)
npm install --save-dev @tamagui/babel-plugin
```

> **Versions:** As of RN 0.81 / Expo 54 use `@tamagui/core@^1.114.0`.  
> All four packages share the same version — pin them together.

### 1.3 Create `tamagui.config.ts`

Maps every token in `constants/theme.ts` into Tamagui design tokens and semantic themes.

```typescript
// tamagui.config.ts  (project root)
import { createAnimations } from "@tamagui/animations-react-native";
import { config as defaultConfig } from "@tamagui/config/v4";
import { createTamagui, createTokens } from "@tamagui/core";

// ─── Animations ───────────────────────────────────────────────────────────────
// "snap" mirrors the SNAP_SPRING constant removed from HomeScreen
const animations = createAnimations({
  bouncy: { type: "spring", damping: 10, mass: 0.9, stiffness: 100 },
  lazy: { type: "spring", damping: 20, stiffness: 60 },
  quick: { type: "spring", damping: 20, mass: 1.2, stiffness: 250 },
  snap: {
    type: "spring",
    damping: 50,
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
    primaryLight: "#10B981",
    dangerLight: "#EF4444",
    warningLight: "#F59E0B",
    textPrimaryLight: "#0F172A",
    textSecondaryLight: "#64748B",
    borderLight: "#E2E8F0",
    mapPathLight: "#3B82F6",
    // Dark palette
    backgroundDark: "#0B1120",
    surfaceDark: "#1E293B",
    primaryDark: "#059669",
    dangerDark: "#DC2626",
    warningDark: "#D97706",
    textPrimaryDark: "#F8FAFC",
    textSecondaryDark: "#94A3B8",
    borderDark: "#334155",
    mapPathDark: "#06B6D4",
    // Neutral
    white: "#FFFFFF",
    black: "#000000",
    transparent: "rgba(0,0,0,0)",
  },
  space: {
    $0: 0,
    $1: 4,
    $2: 8,
    $3: 12,
    $4: 16,
    $5: 20,
    $6: 24,
    $7: 28,
    $8: 32,
    $10: 40,
    $true: 16,
  },
  size: {
    $0: 0,
    $1: 16,
    $2: 24,
    $3: 32,
    $4: 40,
    $5: 48,
    $6: 64,
    $7: 80,
    $true: 40,
  },
  radius: {
    $0: 0,
    $1: 4,
    $2: 8,
    $3: 12,
    $4: 16,
    $5: 20,
    $6: 28,
    $full: 9999,
    $true: 12,
  },
  zIndex: {
    $0: 0,
    $1: 100,
    $2: 200,
    $3: 300,
    $4: 400,
    $5: 500,
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
  themeClassNameOnRoot: false,       // Not a web app
  tokens,
  themes: { light: lightTheme, dark: darkTheme },
  fonts: defaultConfig.fonts,
  shorthands: defaultConfig.shorthands,
  settings: {
    fastSchemeChange: true,
    allowedStyleValues: "somewhat-strict",
  },
});

// ─── Type Augmentation (Phase 4) ─────────────────────────────────────────────
export type AppConfig = typeof tamaguiConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
```

### 1.4 Update `app/_layout.tsx`

**Diff — what changes:**
- Remove `import "../global.css"`
- Add `TamaguiProvider` wrapping the existing tree
- Pass `colorScheme` to `defaultTheme` so Tamagui reacts to OS dark/light

```typescript
// app/_layout.tsx
import { TamaguiProvider } from "@tamagui/core";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
// ↑ global.css import removed

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import tamaguiConfig from "../tamagui.config";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const hydrateProfile = useProfileStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
    void hydrateProfile();
  }, [hydrate, hydrateProfile]);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme ?? "light"}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {isHydrating ? (
          <View style={{ flex: 1, backgroundColor: "#FF6B35" }} />
        ) : (
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="profile"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="session/[id]"
                options={{ headerShown: false, animation: "slide_from_bottom" }}
              />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            {!isLoggedIn && <Redirect href="/auth" />}
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          </ThemeProvider>
        )}
      </GestureHandlerRootView>
    </TamaguiProvider>
  );
}
```

> `TamaguiProvider` is the outermost wrapper so all screens share the same token context. `GestureHandlerRootView` stays because `RunDrawer` still uses `react-native-gesture-handler` for its slide-to-start gesture. `ThemeProvider` from react-navigation stays so Stack/Tab headers adopt the correct navigation theme.

### 1.5 Delete NativeWind artefacts

```bash
# Files that become dead code after removing NativeWind
rm tailwind.config.js
rm global.css
rm nativewind-env.d.ts
```

---

## Phase 2 — Component Conversion Guide

### 2.1 Layout Primitives

| NativeWind pattern | Tamagui equivalent | Notes |
|---|---|---|
| `<View className="flex-1">` | `<YStack flex={1}>` | |
| `<View className="flex-row">` | `<XStack>` | `flexDirection: 'row'` is the default |
| `<View className="flex-row items-center gap-x-2">` | `<XStack alignItems="center" gap="$2">` | `gap` maps to `space` token |
| `<View className="flex-1 items-center justify-center">` | `<YStack flex={1} alignItems="center" justifyContent="center">` | |
| `<View className="px-5 pt-2">` | `<YStack paddingHorizontal="$5" paddingTop="$2">` | `$5 = 20px` from space tokens |
| `<View className="rounded-full overflow-hidden">` | `<XStack borderRadius="$full" overflow="hidden">` | |
| Absolute overlay | `<YStack position="absolute" top={0} left={0} right={0} bottom={0}>` | or use `ZStack` |
| Z-layered screens | `<ZStack flex={1}>` | children stack on top of each other |

### 2.2 Typography

| NativeWind pattern | Tamagui equivalent |
|---|---|
| `<Text className="text-sm font-bold" style={{color: c.textPrimary}}>` | `<SizableText size="$3" fontWeight="700" color="$color">` |
| `<Text className="text-[13px] font-semibold" style={{color: c.textSecondary}}>` | `<SizableText size="$3" fontWeight="600" color="$colorSecondary">` |
| `<Text className="text-3xl">` | `<SizableText size="$9">` |
| Large stat numbers (fontSize 22, fontWeight 800) | `<SizableText size="$8" fontWeight="800" color="$color">` |
| Caption labels (fontSize 11, fontWeight 600) | `<SizableText size="$1" fontWeight="600" color="$colorSecondary">` |

> **Theme variable binding:** `color="$color"` reads from the active theme automatically. No manual `c.textPrimary` lookup needed for semantic colors.

### 2.3 Shadow Constants → Tamagui Elevation

The two shadow objects in `app/(tabs)/index.tsx` become `elevate` props or inline `shadowColor` props on `XStack`/`YStack`:

```typescript
// BEFORE — constants/index.tsx
const PILL_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
} as const;

const DRAWER_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: -8 },
  elevation: 12,
} as const;
```

```typescript
// AFTER — inline Tamagui elevation props
// Pill  → elevation={3}  on the XStack/Pressable container
// Drawer → elevation={12} on Sheet.Frame
//
// For fine-grained control keep the raw style prop — Tamagui passes it through:
<Sheet.Frame
  shadowColor="$shadowColor"
  shadowOpacity={0.1}
  shadowRadius={20}
  shadowOffset={{ width: 0, height: -8 }}
  elevation={12}
>
```

---

## Phase 3 — HomeScreen Drawer Refactor

### 3.1 Code to Remove from `app/(tabs)/index.tsx`

Delete every line below — they are fully replaced by Tamagui `Sheet`:

```typescript
// ── Imports to remove ──────────────────────────────────────────────────────
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context"; // replace with useSafeAreaInsets

// ── Constants to remove ────────────────────────────────────────────────────
const DRAWER_EXTRA_HEIGHT = 96;
const SNAP_SPRING = { damping: 50, stiffness: 300, overshootClamping: true };

// ── State / shared values to remove ───────────────────────────────────────
const [isExpanded, setIsExpanded] = useState(false);
const drawerExpansion = useSharedValue(0);
const dragStart = useSharedValue(0);

// ── Derived animated style to remove ──────────────────────────────────────
const expandStyle = useAnimatedStyle(() => ({
  height: drawerExpansion.value,
  overflow: "hidden",
}));

// ── Callbacks to remove ────────────────────────────────────────────────────
const toggleExpanded = useCallback(() => { ... }, [drawerExpansion]);

// ── Gesture to remove ──────────────────────────────────────────────────────
const panGesture = useMemo(() => Gesture.Pan()..., [drawerExpansion, dragStart]);
```

Also remove the `<GestureDetector gesture={panGesture}>` wrapper, the `<Pressable onPress={toggleExpanded}>` handle pill, and the `<Animated.View style={expandStyle}>` stats container.

### 3.2 Refactored `app/(tabs)/index.tsx`

```typescript
import { XStack, YStack, SizableText } from "@tamagui/core";
import { Sheet } from "@tamagui/sheet";
import { Colors, MapStyles } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { useRunSession } from "@/hooks/use-run-session";
import { useAppStore } from "@/stores/appStore";
import { useProfileStore } from "@/stores/profileStore";
import { formatPace } from "@/utils/formatting";
import { RunDrawer } from "@/components/run-drawer";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Pill shadow — kept as a plain style object; passed via `style` prop on Pressable
const PILL_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
} as const;

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const { profile } = useProfileStore();
  const { unitSystem } = useAppStore();
  const insets = useSafeAreaInsets();

  const {
    permissionStatus,
    requestPermission,
    currentLocation,
    locationName,
    isLoadingLocation,
  } = useLocation();

  const {
    runState,
    elapsed,
    distanceKm,
    routeCoords,
    handleStart,
    handlePause,
    handleResume,
    handleEnd,
  } = useRunSession(locationName);

  const isRunning = runState === "running";

  // ── Sheet snap state ───────────────────────────────────────────────────────
  // snapPoints={[50, 15]} → position 0 = 50 % (expanded), position 1 = 15 % (collapsed)
  const [snapIndex, setSnapIndex] = useState(1);
  const isExpanded = snapIndex === 0;

  // ── Derived metrics ────────────────────────────────────────────────────────
  const paceSecsPerKm = distanceKm > 0 ? elapsed / distanceKm : 0;
  const caloriesKcal = Math.round(distanceKm * (profile.weightKg ?? 70) * 1.036);

  const gpsDotColor =
    permissionStatus === "granted" && currentLocation
      ? c.primary
      : permissionStatus === "granted"
        ? "#F59E0B"
        : permissionStatus === "denied"
          ? "#EF4444"
          : "#9CA3AF";

  const region = currentLocation
    ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }
    : undefined;

  const initials =
    (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase() ||
    "?";

  return (
    // ── Root: YStack fills the screen ─────────────────────────────────────
    <YStack flex={1} backgroundColor={c.background}>

      {/* ── Layer 0: Map (fills entire screen under everything) ─────────── */}
      <View style={StyleSheet.absoluteFill}>
        {permissionStatus === "granted" ? (
          region ? (
            <MapView
              provider={PROVIDER_DEFAULT}
              style={StyleSheet.absoluteFill}
              initialRegion={region}
              showsUserLocation
              followsUserLocation={isRunning}
              showsMyLocationButton={false}
              showsCompass={false}
              toolbarEnabled={false}
              customMapStyle={scheme === "dark" ? MapStyles.dark : MapStyles.light}
            >
              {routeCoords.length > 1 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={c.primary}
                  strokeWidth={4}
                />
              )}
            </MapView>
          ) : (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <ActivityIndicator color={c.primary} size="large" />
              <SizableText
                size="$3"
                textAlign="center"
                paddingHorizontal="$8"
                marginTop="$3"
                color={c.textSecondary}
              >
                {isLoadingLocation ? "Locating..." : "Getting location..."}
              </SizableText>
            </YStack>
          )
        ) : (
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            backgroundColor={scheme === "dark" ? "#111827" : "#E5E7EB"}
          >
            <SizableText size="$8">{"📍"}</SizableText>
            <SizableText
              size="$3"
              textAlign="center"
              paddingHorizontal="$8"
              marginTop="$3"
              color={c.textSecondary}
            >
              {permissionStatus === "denied"
                ? "Location access denied. Tap below to open Settings."
                : "Location is needed to show the map."}
            </SizableText>
            <Pressable
              onPress={() =>
                permissionStatus === "denied"
                  ? void Linking.openSettings()
                  : void requestPermission()
              }
              style={{
                backgroundColor: c.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 9999,
                marginTop: 16,
              }}
              accessibilityRole="button"
            >
              <SizableText size="$3" fontWeight="700" color="white">
                {permissionStatus === "denied" ? "Open Settings" : "Allow Location"}
              </SizableText>
            </Pressable>
          </YStack>
        )}
      </View>

      {/* ── Layer 1: Top pills (GPS + Profile) — absolute over map ─────── */}
      <XStack
        position="absolute"
        top={insets.top + 8}
        left={0}
        right={0}
        paddingHorizontal="$5"
        justifyContent="space-between"
        zIndex={10}
      >
        {/* Profile pill */}
        <Pressable
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 14,
              borderRadius: 9999,
              overflow: "hidden",
              backgroundColor: c.surface,
            },
            PILL_SHADOW,
          ]}
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          {profile.photoUrl ? (
            <Image
              source={{ uri: profile.photoUrl }}
              style={{ width: 26, height: 26, borderRadius: 13 }}
              contentFit="cover"
            />
          ) : (
            <SizableText size="$3" fontWeight="700" color={c.textPrimary}>
              {initials}
            </SizableText>
          )}
        </Pressable>

        {/* GPS pill */}
        <XStack
          alignItems="center"
          gap="$1"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderRadius="$full"
          overflow="hidden"
          backgroundColor={c.surface}
          style={PILL_SHADOW}
        >
          <YStack
            width={8}
            height={8}
            borderRadius="$full"
            backgroundColor={gpsDotColor}
          />
          <SizableText size="$2" fontWeight="600" color={c.textSecondary}>
            {permissionStatus === "granted" && currentLocation
              ? "GPS"
              : permissionStatus === "denied"
                ? "No GPS"
                : "GPS..."}
          </SizableText>
        </XStack>
      </XStack>

      {/* ── Layer 2: Bottom Sheet ────────────────────────────────────────── */}
      {/*
        modal={false}  → Sheet stays inline; MapView pointer events are NOT
                         blocked — the map remains fully interactive.
        snapPoints     → [50, 15] — position 0 = 50 % open (stats visible),
                                     position 1 = 15 % open (controls only).
        open           → always mounted; use dismissOnSnapToBottom={false} so
                         the user can't swipe it away entirely.
        animation      → "snap" resolves to the spring defined in tamagui.config.ts
                         (mirrors the old SNAP_SPRING values).
      */}
      <Sheet
        modal={false}
        open
        snapPoints={[50, 15]}
        snapPointsMode="percent"
        position={snapIndex}
        onPositionChange={setSnapIndex}
        dismissOnSnapToBottom={false}
        zIndex={30_000}
        animation="snap"
      >
        {/* Tamagui renders the drag handle automatically */}
        <Sheet.Handle
          backgroundColor={isExpanded ? c.primary : c.border}
          marginTop="$2"
        />

        <Sheet.Frame
          backgroundColor={c.surface}
          borderTopLeftRadius={28}
          borderTopRightRadius={28}
          paddingBottom={Math.max(insets.bottom, 20)}
          shadowColor="#000"
          shadowOpacity={0.1}
          shadowRadius={20}
          shadowOffset={{ width: 0, height: -8 }}
          elevation={12}
        >
          {/* Run controls (RunDrawer — unchanged) */}
          <YStack paddingHorizontal="$7" paddingTop="$2" paddingBottom="$1">
            <RunDrawer
              runState={runState}
              elapsed={elapsed}
              distanceKm={distanceKm}
              unitSystem={unitSystem}
              locationName={locationName}
              onStart={() => void handleStart()}
              onPause={handlePause}
              onResume={() => void handleResume()}
              onEnd={handleEnd}
            />
          </YStack>

          {/* Stats panel — visible only at the expanded snap point */}
          {isExpanded && (
            <XStack
              marginHorizontal="$7"
              paddingTop="$3"
              paddingBottom="$3"
              borderTopWidth={1}
              borderTopColor={c.border}
              alignItems="center"
            >
              <YStack flex={1} alignItems="center">
                <SizableText size="$8" fontWeight="800" color={c.textPrimary}>
                  {paceSecsPerKm > 0 ? formatPace(paceSecsPerKm, unitSystem) : "--"}
                </SizableText>
                <SizableText
                  size="$1"
                  fontWeight="600"
                  marginTop="$0"
                  color={c.textSecondary}
                >
                  Avg Pace
                </SizableText>
              </YStack>

              {/* Vertical divider */}
              <YStack width={1} height={40} backgroundColor={c.border} />

              <YStack flex={1} alignItems="center">
                <SizableText size="$8" fontWeight="800" color={c.textPrimary}>
                  {caloriesKcal > 0 ? String(caloriesKcal) : "--"}
                </SizableText>
                <SizableText
                  size="$1"
                  fontWeight="600"
                  marginTop="$0"
                  color={c.textSecondary}
                >
                  kcal
                </SizableText>
              </YStack>
            </XStack>
          )}
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
```

**Lines of manual gesture/animation code removed:**

| Removed | Replacement |
|---|---|
| `drawerExpansion = useSharedValue(0)` | `snapIndex` state (plain `useState`) |
| `dragStart = useSharedValue(0)` | Sheet handles drag internally |
| `expandStyle = useAnimatedStyle(...)` | Conditional `{isExpanded && ...}` |
| `panGesture = Gesture.Pan()...` (20 lines) | `Sheet` built-in drag |
| `toggleExpanded` callback | `onPositionChange` prop |
| `GestureDetector` wrapper | Removed entirely |
| `<Animated.View style={expandStyle}>` | Plain `{isExpanded && <XStack>}` |

---

## Phase 4 — Performance & Type Safety

### 4.1 Full TypeScript Autocomplete

The `declare module` block at the bottom of `tamagui.config.ts` (already included above) provides full autocomplete for every token. After adding it, all Tamagui JSX props accept only valid GoStrich tokens:

```typescript
// tamagui.config.ts (already present — shown here for reference)
export type AppConfig = typeof tamaguiConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppConfig {}
}
```

This gives TypeScript errors like:
```
Type '"$brandGreen"' is not assignable to type 'ThemeValueFallback | ColorTokens'
```
...if you mistype a token name — catching theme mismatches at compile time.

### 4.2 Babel — Enable the Tamagui Optimizing Compiler

The Tamagui compiler pre-evaluates style objects to inline StyleSheet values, reducing JS thread work at runtime. Replace the NativeWind preset with the Tamagui plugin:

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource: "nativewind" removed
      ["babel-preset-expo"],
    ],
    plugins: [
      [
        "@tamagui/babel-plugin",
        {
          components: ["@tamagui/core", "@tamagui/sheet"],
          config: "./tamagui.config.ts",
          logTimings: true,        // Print per-file optimization stats
          disableExtraction: process.env.NODE_ENV === "development",
          // ^ Disable in dev for faster rebuilds; enable in production builds
        },
      ],
    ],
  };
};
```

### 4.3 Metro — Remove NativeWind, Keep Rive Asset Extension

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Keep the .riv extension for the Rive ostrich mascot animation
config.resolver.assetExts.push("riv");

// withNativeWind wrapper removed
module.exports = config;
```

---

## Post-Migration Checklist

### Zustand Persistence (Offline-First Integrity)

- [ ] **`authStore`** — persists to `expo-secure-store`. No UI dependency; unaffected. Verify `hydrate()` is still called in `_layout.tsx` `useEffect`. ✓
- [ ] **`profileStore`** — persists to `expo-secure-store`. `photoUrl` still rendered via `expo-image`; no change. ✓
- [ ] **`workoutStore`** — persists to `AsyncStorage`. GPS arrays still stripped on save. No UI dependency; unaffected. ✓
- [ ] **`appStore.darkMode`** — currently in-memory, drives `colorScheme`. Connect it to `TamaguiProvider`'s `defaultTheme` if you want a user-controlled dark mode override:

  ```typescript
  // _layout.tsx — optional: respect appStore.darkMode override
  const darkMode = useAppStore((s) => s.darkMode);
  const systemScheme = useColorScheme();
  const activeTheme = darkMode ? "dark" : (systemScheme ?? "light");

  <TamaguiProvider config={tamaguiConfig} defaultTheme={activeTheme}>
  ```

- [ ] **`trackingStore`** — in-memory; unaffected. ✓

### Functional Smoke Tests

- [ ] App loads without `global.css` import error
- [ ] `TamaguiProvider` wraps the full tree in `_layout.tsx`
- [ ] Dark/light theme switches correctly (Sheet, pills, text all respond)
- [ ] `Sheet` opens at 15 % on launch (collapsed state)
- [ ] Dragging `Sheet.Handle` up snaps to 50 % and reveals the stats panel
- [ ] `MapView` receives tap/drag events while Sheet is at either snap point (`modal={false}` verification)
- [ ] `RunDrawer` slide-to-start gesture still fires `onStart` correctly
- [ ] GPS polyline renders in `c.primary` color (token reads correct theme value)
- [ ] Profile photo pill navigates to `/profile` modal
- [ ] Session saved to `workoutStore` on run end; navigates to `/session/[id]`

### Build Verification

```bash
# iOS
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

Check for:
- No `nativewind` import resolution errors
- `@tamagui/babel-plugin` logs timing output (confirms compiler is active)
- No TypeScript errors on the `$token` references in the refactored files
