---
description: "General project context and coding guidelines for GoStrich. Load for any task involving this codebase."
applyTo: "**"
---

# GoStrich — Project Instructions

## Project Overview

GoStrich is a 100% offline-first running tracker for iOS and Android built with React Native + Expo. All data is stored on-device — there is no backend, no remote database, and no sync service.

## Core Architecture Decisions

| Concern         | Choice                                       | Rationale                                       |
| --------------- | -------------------------------------------- | ----------------------------------------------- |
| Framework       | React Native 0.81 + Expo 54 (Expo Router v6) | Managed workflow for fast iteration             |
| Language        | TypeScript 5.x strict                        | Type safety for GPS/metrics calculations        |
| Styling         | NativeWind v4 (Tailwind CSS)                 | Utility-first, consistent spacing/colors        |
| State           | Zustand                                      | Minimal boilerplate, works well with TypeScript |
| Auth session    | expo-secure-store                            | Encrypted, survives app restarts                |
| Workout history | Zustand persist + AsyncStorage               | Simple, no ORM needed at current data volume    |
| GPS             | expo-location (foreground only)              | Sufficient for active run tracking              |
| Maps            | react-native-maps (Google Maps)              | Industry standard, polyline support             |
| Auth            | @react-native-google-signin/google-signin    | Google SSO — no password management             |
| Animation       | rive-react-native                            | Ostrich mascot animation                        |

## Navigation Structure

```
Root Stack (_layout.tsx)
├── auth          # Google Sign-In — shown when !isLoggedIn
├── (tabs)        # Main app — protected by auth guard
│   ├── index     # Home/Run screen (live map + GPS HUD)
│   └── history   # Sessions list
├── profile       # Profile modal (settings, logout)
└── session/[id]  # Session summary after a run finishes
```

## State Stores

| Store           | Persisted    | Contents                                                         |
| --------------- | ------------ | ---------------------------------------------------------------- |
| `authStore`     | SecureStore  | `isLoggedIn`, `user` (email, name, photoUrl), `isHydrating`      |
| `profileStore`  | SecureStore  | `firstName`, `lastName`, `photoUrl`, `weightKg`, `heightCm`      |
| `workoutStore`  | AsyncStorage | `workouts: WorkoutSummary[]` (GPS points stripped to save space) |
| `appStore`      | In-memory    | `unitSystem`, `mapStyle`, `darkMode`                             |
| `trackingStore` | In-memory    | Active run state                                                 |

## Run Lifecycle (use-run-session.ts)

```
idle → [handleStart] → running → [handlePause] → paused → [handleResume] → running
                                                                         ↓ [handleEnd]
                                                                     Save workout → navigate to /session/[id]
```

- GPS watch: `expo-location.watchPositionAsync` at `BestForNavigation`, 1 s / 2 m intervals
- Distance: Haversine formula, accumulated between consecutive GPS points
- Timer: `setInterval` running only when state === 'running'
- On end: full `Workout` (with `gpsPoints`) saved to `workoutStore`, then `WorkoutSummary` (gpsPoints stripped) stored in AsyncStorage

## Theming

- Light/dark colors defined in `constants/theme.ts` as `Colors.light` and `Colors.dark`
- Active scheme via `useColorScheme()` hook
- NativeWind classes used for layout/spacing, `style` prop used for dynamic brand colors from `Colors`

## Coding Conventions

- **No `any`** — use proper interfaces or `unknown`
- **No class components** — functional components + hooks only
- **Imports**: use `@/` alias (maps to project root)
- **Styling**: prefer NativeWind `className` for static layout; use `style` with `Colors[scheme]` for dynamic theme colors
- **Effect cleanup**: always unsubscribe GPS watchers and clear timers in `useEffect` cleanup
- **Async errors**: always catch with try/catch in async event handlers; never let unhandled promise rejections surface
- **GPS noise**: filter points with accuracy > threshold before accumulating distance

## Environment Variables

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
```

Required for Google Sign-In. Set in `.env` at project root.

## Common Pitfalls

- **Stale autolinking cache**: after renaming the project folder, delete `android/build/generated/autolinking/autolinking.json` and run `./gradlew clean`
- **Map not rendering on Android**: ensure Google Maps API key is set and SHA-1 fingerprint is registered in Google Cloud Console
- **GPS not updating in simulator**: use a simulated location (Xcode → Features → Location) or test on a physical device
- **AsyncStorage quota**: GPS point arrays are stripped from stored `WorkoutSummary` objects; only `workouts` (not full `Workout`) go to AsyncStorage
