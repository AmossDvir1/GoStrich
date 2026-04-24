# Migration Strategy: Transitioning GoStrich to Tamagui

**Role:** Act as a Senior Mobile Solutions Architect and Tamagui Specialist.
**Objective:** Create a comprehensive, phase-by-phase technical plan to migrate the "GoStrich" app from **NativeWind 4** to **Tamagui**. The goal is to eliminate manual drawer math, improve type safety, and leverage the React Native 0.81 New Architecture.

---

### 1. App Context (GoStrich)

- **Core Tech:** Expo 54, RN 0.81, Zustand (Offline-first), Reanimated 4, Expo Router.
- **Current Issue:** The `HomeScreen` uses manual `Reanimated` and `GestureHandler` logic for a bottom drawer which is buggy/complex.
- **Constraint:** Replace NativeWind entirely. Do not suggest a hybrid approach. Tamagui must handle all styling and theming.

---

### 2. The Migration Plan Requirements

Please generate the plan following these four specific phases:

#### Phase 1: Environment & Foundation

1.  **Dependencies:** Provide the commands to swap NativeWind/Tailwind for `@tamagui/core`, `@tamagui/config`, `@tamagui/animations-react-native`, and `@tamagui/sheet`.
2.  **Theme Configuration:** Write a `tamagui.config.ts` that maps the existing `constants/theme.ts` (GoStrich colors) into Tamagui tokens.
3.  **Provider Integration:** Show the refactor for `app/_layout.tsx` to wrap the app in `TamaguiProvider`, linking it to the `appStore` Zustand theme state.

#### Phase 2: Component Conversion (NativeWind -> Tamagui)

Create a conversion guide for the existing UI patterns:

- **Layouts:** Map `View className` patterns to `YStack`, `XStack`, and `ZStack`.
- **Typography:** Map `Text className` to Tamagui `SizableText`.
- **Shadows:** Convert the `PILL_SHADOW` and `DRAWER_SHADOW` constants into Tamagui `elevation` tokens or custom shadow tokens.

#### Phase 3: The "HomeScreen" Drawer Refactor

This is the priority. Provide a detailed refactor of the current `HomeScreen.tsx`:

1.  **Logic Removal:** Identify all `useSharedValue`, `withSpring`, and `Gesture.Pan` code that should be deleted.
2.  **Sheet Implementation:** Implement the `Tamagui Sheet`.
    - **Critical:** Set `modal={false}` so the `MapView` remains interactive.
    - **Snap Points:** Define `[15, 50]` to allow a "collapsed" metrics view and an "expanded" stats view.
3.  **Z-Index Layering:** Use `ZStack` to ensure the Map is the bottom layer, with the GPS/Profile pills and the Sheet layered on top.

#### Phase 4: Performance & Type Safety

1.  **TypeScript:** Generate the `TamaguiCustomConfig` declaration to ensure full autocomplete for GoStrich-specific tokens.
2.  **Compiler Optimization:** Provide the configuration for `metro.config.js` and `babel.config.js` to enable the Tamagui optimizing compiler for Expo 54.

---

### 3. Expected Output Format

1.  **Step-by-step terminal commands.**
2.  **Code block for the new `tamagui.config.ts`.**
3.  **Code block for the refactored `HomeScreen.tsx`.**
4.  **A "Post-Migration Checklist" to ensure offline persistence (Zustand) still works with the new UI.**

**[PASTE YOUR FULL PROJECT CONTEXT/CODE HERE]**
