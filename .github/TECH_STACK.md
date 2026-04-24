# GoStrich - Technology Stack

**Last Updated**: April 2026  
**Status**: Implementation Complete (Phase 1-4)

---

## Executive Summary

GoStrich is a **100% offline-first** running tracker for iOS and Android built with **React Native 0.81** + **Expo 54** using **TypeScript 5.9**, **Zustand** for state management, and **Tamagui 2.0** for cross-platform UI. All data is stored locally on-device using Zustand persistence + AsyncStorage. Zero backend, zero sync service, zero external dependencies.

---

## Core Technology Stack

### Framework & Runtime

| Tech             | Version  | Purpose                       | Notes                                  |
| ---------------- | -------- | ----------------------------- | -------------------------------------- |
| **React Native** | 0.81.5   | Cross-platform mobile UI      | New Architecture enabled in app.json   |
| **Expo**         | ~54.0.33 | Managed React Native workflow | EAS builds, SDK 54 compatibility       |
| **React**        | 19.1.0   | UI library                    | Latest stable with concurrent features |
| **Expo Router**  | ~6.0.23  | File-based navigation         | Uses app/ directory for screens        |
| **TypeScript**   | ~5.9.2   | Static type checking          | Strict mode enabled globally           |

### State Management & Storage

| Tech                  | Version | Purpose           | Persistence                                      |
| --------------------- | ------- | ----------------- | ------------------------------------------------ |
| **Zustand**           | ^5.0.0  | Global state      | In-memory + AsyncStorage persist middleware      |
| **AsyncStorage**      | 2.2.0   | Device storage    | Persists workout summaries (GPS points stripped) |
| **expo-secure-store** | ~15.0.8 | Encrypted storage | User auth session + profile data                 |

### Location & Maps

| Tech                  | Version | Purpose       | Permission Scope                                  |
| --------------------- | ------- | ------------- | ------------------------------------------------- |
| **expo-location**     | ~19.0.8 | GPS tracking  | Foreground only (iOS/Android with app.json perms) |
| **react-native-maps** | 1.20.1  | Map rendering | Google Maps backend with polylines                |

### Authentication & Security

| Tech                                          | Version | Purpose           | Notes                          |
| --------------------------------------------- | ------- | ----------------- | ------------------------------ |
| **@react-native-google-signin/google-signin** | ^16.1.2 | Google Sign-In    | OAuth 2.0, no password storage |
| **expo-secure-store**                         | ~15.0.8 | Encrypted session | Survives app restart           |

### Styling & UI

| Tech                                 | Version      | Purpose                           | Approach                                             |
| ------------------------------------ | ------------ | --------------------------------- | ---------------------------------------------------- |
| **Tamagui**                          | ^2.0.0-rc.41 | Universal React + React Native UI | Optimizing compiler, design tokens, responsive props |
| **@tamagui/animations-react-native** | 2.0.0-rc.41  | Spring animations                 | Native performance, customizable dynamics            |
| **expo-linear-gradient**             | ~15.0.8      | Gradient backgrounds              | Enhanced UI polish                                   |
| **rive-react-native**                | ^9.8.2       | Ostrich mascot animation          | Loaded from `assets/ostrich.riv`                     |
| **@expo/vector-icons**               | ^15.0.3      | Icon system                       | ionicons, MaterialIcons, etc.                        |

### Navigation & Interaction

| Tech                              | Version | Purpose               | Usage                            |
| --------------------------------- | ------- | --------------------- | -------------------------------- |
| **@react-navigation/native**      | ^7.1.8  | Navigation foundation | Managed by Expo Router v6        |
| **@react-navigation/bottom-tabs** | ^7.4.0  | Tab navigation        | (tabs) layout for Home & History |
| **react-native-gesture-handler**  | ~2.28.0 | Gesture support       | Tab swipes, drawer interactions  |
| **react-native-reanimated**       | ~4.1.1  | Animation engine      | Worklet-based animations         |
| **expo-haptics**                  | ~15.0.8 | Haptic feedback       | Button press feedback            |

### Media & Assets

| Tech                  | Version  | Purpose                 | Usage                        |
| --------------------- | -------- | ----------------------- | ---------------------------- |
| **expo-image**        | ~3.0.11  | Optimized image loading | Profile photos, user avatars |
| **expo-image-picker** | ~17.0.10 | Camera/gallery access   | Profile photo selection      |
| **react-native-svg**  | 15.12.1  | SVG rendering           | Custom icons & graphics      |
| **sharp**             | ^0.34.5  | Image processing        | Asset generation for build   |

### Build & Optimization

| Tech                     | Version      | Purpose                   | Config File        |
| ------------------------ | ------------ | ------------------------- | ------------------ |
| **Tamagui Babel Plugin** | 2.0.0-rc.41  | Optimize & extract styles | `babel.config.js`  |
| **Tamagui Metro Plugin** | ^2.0.0-rc.41 | Metro bundler integration | `metro.config.js`  |
| **ESLint**               | ^9.25.0      | Code linting              | `eslint.config.js` |
| **Babel**                | via expo     | JS transpilation          | `babel.config.js`  |

---

## Architecture Breakdown

### State Stores (Zustand)

All stores are defined in `/stores` and integrated with persistence middleware:

```typescript
// Pattern: Zustand store with persistence
create(
  persist(
    (set) => ({
      state: initialValue,
      actions: {
        setState: (value) => set({ state: value })
      }
    }),
    {
      name: 'store-name',
      storage: storage (SecureStore or AsyncStorage)
    }
  )
)
```

#### Stores Reference

| Store             | Backend      | Scope     | Contents                                                                 |
| ----------------- | ------------ | --------- | ------------------------------------------------------------------------ |
| **authStore**     | SecureStore  | Encrypted | `isLoggedIn`, `user` (email, name, photoUrl), `isHydrating`              |
| **profileStore**  | SecureStore  | Encrypted | `firstName`, `lastName`, `photoUrl`, `weightKg`, `heightCm`              |
| **workoutStore**  | AsyncStorage | Local     | `workouts: WorkoutSummary[]` (GPS points stripped for space)             |
| **appStore**      | In-memory    | Runtime   | `unitSystem`, `mapStyle`, `darkMode`, `theme`                            |
| **trackingStore** | In-memory    | Runtime   | Active run state: `state`, `distance`, `duration`, `routeCoords`, `pace` |

### File Structure

```
app/                              # Expo Router app directory
├── _layout.tsx                   # Root layout + auth guard
├── +not-found.tsx                # 404 fallback
├── auth.tsx                      # Google Sign-In screen
├── modal.tsx                     # Modal provider
├── profile.tsx                   # Profile settings modal
├── (tabs)/
│   ├── _layout.tsx               # Tab navigator (Home, History, Settings)
│   ├── index.tsx                 # Home/Run screen (live map + controls)
│   ├── history.tsx               # Workout history list
│   └── settings.tsx              # App settings
└── session/
    └── [id].tsx                  # Session summary (post-run)

components/
├── run-drawer.tsx                # Live metrics HUD during run
├── photo-picker-modal.tsx        # Profile photo selection
├── haptic-tab.tsx                # Haptic feedback wrapper
└── ui/
    ├── runner-character.tsx      # Ostrich mascot (Rive)
    ├── icon-symbol.tsx           # Icon system
    └── icon-symbol.ios.tsx       # iOS-specific icons

hooks/
├── use-run-session.ts            # GPS + timer + distance engine
├── use-location.ts               # Location permissions + geocoding
├── use-color-scheme.ts           # Dark mode detection
├── use-color-scheme.web.ts       # Web-specific color scheme
└── use-theme-color.ts            # Dynamic color hook

services/
├── gps/index.ts                  # GPS service (expo-location wrapper)
├── tracking/index.ts             # Tracking business logic
└── workout/index.ts              # Workout persistence

stores/
├── authStore.ts                  # Google Sign-In + session
├── profileStore.ts               # User profile (name, weight, height)
├── workoutStore.ts               # Workout history (in-memory + AsyncStorage)
├── appStore.ts                   # App settings (theme, units)
└── trackingStore.ts              # Active run state

types/
├── workout.ts                    # WorkoutSummary, Workout interfaces
├── tracking.ts                   # TrackingState, GPS point types
└── auth.ts                       # User, Auth session types

constants/
└── theme.ts                      # Colors.light, Colors.dark palettes

utils/
├── formatting.ts                 # Format time, distance, pace
└── [other helpers]               # Calculation utilities

assets/
├── images/                       # Icons, splashscreen
└── ostrich.riv                   # Rive animation file (mascot)
```

---

## Key Architectural Patterns

### 1. **Auth Guard Pattern**

Root layout (`app/_layout.tsx`) checks `authStore.isLoggedIn`:

- If `false` → redirect to `/auth` screen
- If `true` → render tab navigation

Session persisted in SecureStore, survives app restart.

### 2. **GPS Tracking Lifecycle**

Managed via `use-run-session` hook:

```
idle → [handleStart] → running → [handlePause] → paused
       ↓ (canceled)              ↓ (handleResume)
    idle              [handleEnd: save workout]
                           ↓
                      session/[id] screen
```

**During running**:

- `expo-location.watchPositionAsync()` at `BestForNavigation`
- GPS points collected at 1 sec / 2 m interval
- Distance: Haversine formula between consecutive points
- Timer: `setInterval` updating every second

**On end**:

- Full `Workout` (with `gpsPoints`) saved to `trackingStore`
- `WorkoutSummary` (GPS points stripped) saved to AsyncStorage via `workoutStore`
- Router navigates to `/session/[id]` for summary

### 3. **State Persistence Strategy**

- **Auth + Profile**: SecureStore (encrypted, survives restart)
- **Workouts**: Zustand persisted to AsyncStorage (summary only, lightweight)
- **Active tracking**: In-memory only (lost on app restart, intentional)

**Why strip GPS points from storage?**

- GPS arrays are memory-intensive (1000+ points per run)
- AsyncStorage has size limits
- Stripped summaries still contain all metrics: distance, pace, duration

### 4. **Design System with Tamagui**

Universal design tokens + optimizing compiler for cross-platform consistency:

```typescript
// In tamagui.config.ts:
const tokens = createTokens({
  color: { backgroundLight, textPrimaryLight, primaryLight, ... },
  space: { $0, $1, $2, ... },
  size: { $0, $1, $2, ... },
  radius: { $0, $1, $2, ... }
})

// In components: Use Tamagui components with responsive props
<YStack bg="$backgroundLight" dark={{ bg: "$backgroundDark" }} padding="$4" />
```

---

## Platform-Specific Configuration

### iOS (app.json)

```json
{
  "ios": {
    "bundleIdentifier": "com.advir.gostrich",
    "supportsTablet": false,
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "GoStrich needs your location to track your runs in real-time.",
      "NSLocationAlwaysUsageDescription": "Background location tracking for runs."
    }
  }
}
```

### Android (app.json)

```json
{
  "android": {
    "package": "com.advir.gostrich",
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION"
    ],
    "edgeToEdgeEnabled": true
  }
}
```

---

## Environment Variables

```bash
# Required for Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
```

Set in `.env` at project root. Loaded at build time via Expo.

---

## Dependencies Summary

### Production (30+ packages)

- **React & React Native**: react, react-native, react-dom, react-native-web, react-compiler-runtime
- **Expo Core**: expo, expo-router, expo-splash-screen
- **State**: zustand
- **Storage**: @react-native-async-storage/async-storage, expo-secure-store
- **Location & Maps**: expo-location, react-native-maps
- **Auth**: @react-native-google-signin/google-signin, expo-auth-session
- **Styling & UI**: tamagui, @tamagui/core, @tamagui/config, @tamagui/sheet, @tamagui/animations-react-native, expo-linear-gradient
- **Animation & UI**: react-native-reanimated, rive-react-native, react-native-gesture-handler
- **Media**: expo-image, expo-image-picker, react-native-svg, expo-asset
- **Other**: expo-constants, expo-font, expo-haptics, expo-linking, expo-web-browser, expo-symbols, expo-system-ui, @expo/vector-icons, react-native-safe-area-context, react-native-screens, react-native-worklets, sharp

### Dev (5 packages)

- TypeScript, ESLint, Babel preset, Tamagui babel plugin, Tamagui metro plugin

---

## Performance Characteristics

| Concern          | Choice                  | Rationale                            |
| ---------------- | ----------------------- | ------------------------------------ |
| GPS accuracy     | BestForNavigation       | Highest accuracy for active tracking |
| GPS interval     | 1 sec / 2 m             | Balance between accuracy & battery   |
| Distance calc    | Haversine               | Accounts for Earth curvature         |
| Storage strategy | AsyncStorage            | Sufficient for 100s of runs          |
| Theme switching  | In-memory               | Instant transitions (not persisted)  |
| Animations       | React Native Reanimated | Smooth 60fps worklet animations      |

---

## Known Limitations & Trade-offs

| Item                | Current         | Why                                         |
| ------------------- | --------------- | ------------------------------------------- |
| Background GPS      | Foreground only | Complexity & battery drain; not in MVP      |
| Offline maps        | Not implemented | Would require offline tile caching          |
| Social features     | None            | Offline-first architecture prevents sharing |
| Cloud sync          | Not implemented | Intentional design choice (offline-first)   |
| SQLite/WatermelonDB | Not used        | AsyncStorage sufficient for current scale   |
| Offline data export | Not implemented | Manual export via settings planned          |

---

## Testing & Quality

- **Linting**: ESLint with expo config
- **TypeScript**: Strict mode, full coverage expected
- **Testing**: Jest + React Native Testing Library (not yet implemented in Phase 1-4)
- **Build**: EAS build, Expo development client

---

## Tamagui Integration

**Design System**: Custom tokens and animations configured in `tamagui.config.ts`:

- **Tokens**: Color palettes (light/dark), spacing (`$1` to `$10`), sizing, border radius
- **Animations**: Preconfigured spring dynamics (bouncy, lazy, quick, snap)
- **Babel Plugin**: Automatic style optimization and extraction during build
- **Metro Plugin**: React Native bundler integration for seamless compilation

**Components**: Leverages Tamagui's built-in components (YStack, XStack, Text, etc.) with responsive props and dark mode support out-of-the-box.

## Future Expansion Paths

- **Background GPS**: Implement background location tracking with foreground service
- **Analytics**: Track aggregate fitness metrics (PRs, streaks, etc.)
- **Social**: QR code sharing of individual runs
- **Data Export**: CSV/GPX export of workouts
- **Offline Maps**: Cache tiles for areas runner frequents
- **Performance**: Optimize Tamagui compilation times, lazy load components
