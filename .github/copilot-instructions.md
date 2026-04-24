# GoStrich - AI Development Guidelines

You are an expert React Native developer specializing in Expo, TypeScript, and Tamagui. Follow these rules strictly to maintain the GoStrich architecture.

## 🚀 1. Tech Stack Overview

- **Core**: React Native 0.81.5 (New Arch), Expo 54, TypeScript 5.9.
- **UI**: Tamagui 2.0 (Optimizing compiler + Design Tokens).
- **State**: Zustand 5 (Persisted via AsyncStorage/SecureStore).
- **Navigation**: Expo Router v6 (File-based navigation in `app/`).
- **Animation**: Reanimated 4 + Rive (for the Ostrich mascot).
- **Database**: 100% Offline-first. Zero backend dependencies.

## 🛠 2. Coding Standards & Best Practices

### File Architecture (Modularity)

- **Small Files Only**: Keep files under 150-200 lines.
- **Logic Separation**:
  - Move complex logic into custom hooks (`/hooks`).
  - Move business logic (math, formatting) into `/utils` or `/services`.
  - Components should strictly handle UI and event delegation.
- **Folder Structure**: Adhere strictly to: `app/`, `components/`, `hooks/`, `stores/`, `services/`, `types/`, `constants/`.

### Styling (The Tamagui Way)

- **No Inline Styles**: Never use the `style={{...}}` prop for layout or spacing.
- **No StyleSheet.create**: Avoid standard React Native StyleSheets.
- **Use Tamagui Tokens**: Use Tamagui shorthand props linked to the design system in `tamagui.config.ts`:
  - Padding: `p="$4"`
  - Background: `bc="$background"`
  - Spacing: `gap="$2"`
- **Styled Components**: For reusable UI elements, use the `styled()` HOC:

  ```typescript
  import { YStack, styled } from "tamagui";

  export const Card = styled(YStack, {
    backgroundColor: "$background",
    padding: "$4",
    borderRadius: "$true",
    elevation: 2,
  });
  ```

- **Theming**: Always support light/dark modes using Tamagui’s `theme` props.

### TypeScript & State Management

- **Strict Typing**: No `any`. Every object/prop must have an interface/type in `@/types`.
- **Zustand Persistence**: All stores must use the `persist` middleware.
- **GPS Privacy/Storage**: When persisting workouts to `workoutStore`, explicitly strip the `gpsPoints` array from the stored summary to keep the local AsyncStorage footprint small.

## 📍 3. Specific Component Rules

- **Buttons**: Use `expo-haptics` (Impact: Medium) on all primary interactions.
- **Images**: Use `expo-image` for high-performance caching and transitions.
- **Icons**: Use @expo/vector-icons (Ionicons/Material) or `Lucide` via Tamagui.
- **Animations**: Use `react-native-reanimated` for layout transitions and `rive-react-native` for the Ostrich character.
- **Maps**: Use `react-native-maps` with the Google Maps provider for both iOS and Android.

## 🚨 4. Prohibited Patterns

- **No Backend Calls**: Do not suggest `axios`, `fetch`, or Firebase. Everything must be handled locally.
- **No UI Blockers**: Heavy GPS calculations or data processing must run in hooks or via Reanimated worklets to maintain 60fps.
- **No Global Context**: Use Zustand stores instead of React Context to prevent unnecessary tree re-renders.
- **No External Libraries**: Check `package.json` before suggesting new dependencies. Prefer Expo SDK built-ins.

## 📝 5. Prompting Tips for Claude/Copilot

- When asking for a new feature, remind the AI: "Keep the logic in a custom hook and use Tamagui tokens for the UI."
- For UI changes: "Ensure this follows the light/dark theme tokens defined in our Tamagui config."
- For GPS logic: "Use the Haversine formula for distance and ensure points are stripped before persistence."
