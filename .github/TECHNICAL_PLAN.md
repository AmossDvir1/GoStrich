# GoStrich - Technical Architecture Plan

**Version**: 2.0 (Updated)  
**Date**: April 2026  
**Status**: ✅ Implementation Complete (Phases 1-4)  
**See also**: [TECH_STACK.md](TECH_STACK.md) for comprehensive dependency breakdown

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Project File Structure](#project-file-structure)
4. [Data Architecture](#data-architecture)
5. [State Management](#state-management)
6. [Component Hierarchy](#component-hierarchy)
7. [Service Layer Architecture](#service-layer-architecture)
8. [Styling & Design System](#styling--design-system)
9. [Navigation Flow](#navigation-flow)
10. [Core Algorithms & Logic](#core-algorithms--logic)

---

## Executive Summary

GoStrich is a **100% offline-first** running tracker for iOS and Android, fully implemented with:

- ✅ React Native 0.81 + Expo 54 (New Architecture enabled)
- ✅ Live GPS tracking (foreground, 1 sec / 2 m intervals) with Haversine distance calculation
- ✅ Real-time maps with Google Maps polylines
- ✅ Google Sign-In authentication (SecureStore encrypted session)
- ✅ Distance, pace, duration metrics calculated in real-time
- ✅ Workout auto-save with summary screen post-run
- ✅ Full workout history with delete functionality
- ✅ User profile (name, weight, height, photo)
- ✅ Dark mode + metric/imperial unit toggle
- ✅ Ostrich mascot animation (Rive)

**Key Principle**: No backend, no external database, no sync service. All data persists locally using Zustand + AsyncStorage.

---

## Technology Stack

### Core Framework

| Tech | Version | Purpose |
|------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile UI (New Architecture enabled) |
| **Expo** | ~54.0.33 | Managed workflow, SDK 54 compatibility |
| **React** | 19.1.0 | UI library with concurrent features |
| **Expo Router** | ~6.0.23 | File-based navigation (app/ directory) |
| **TypeScript** | ~5.9.2 | Strict mode, full coverage |

### Local Storage (Actual Implementation)

| Tech | Purpose | Trade-off |
|------|---------|-----------|
| **Zustand** (^5.0.0) | Global state management | In-memory + persist middleware |
| **AsyncStorage** (2.2.0) | Device persistence | Simple, sufficient for 100s of runs |
| **expo-secure-store** (~15.0.8) | Encrypted storage | Auth session + profile data |

> ⚠️ **Deviation from Plan**: Originally planned WatermelonDB for scalability. Actual implementation uses Zustand + AsyncStorage (simpler, sufficient for current scale). GPS arrays stripped from stored summaries to reduce storage footprint.

### Mapping & Location

- **react-native-maps** (1.20.1) — Google Maps polylines
- **expo-location** (~19.0.8) — Foreground GPS tracking

### Authentication & Security

- **@react-native-google-signin/google-signin** (^16.1.2) — OAuth 2.0
- **expo-secure-store** (~15.0.8) — Encrypted session (survives app restart)

### Styling

- **NativeWind** (^4.1.23) — Tailwind CSS for React Native (not react-native-tailwindcss)
- **expo-linear-gradient** (~15.0.8) — Gradient backgrounds

### UI & Animation

- **rive-react-native** (^9.8.2) — Ostrich mascot animation
- **react-native-reanimated** (~4.1.1) — Smooth 60fps worklet animations
- **react-native-gesture-handler** (~2.28.0) — Tab swipes, drawer interactions
- **expo-haptics** (~15.0.8) — Haptic feedback
- **@expo/vector-icons** (^15.0.3) — Icon system

### Development

- **ESLint** (^9.25.0) — Code linting
- **Babel** (via expo) — JS transpilation
- **Tailwind CSS** (^3.4.17) — CSS framework

---

## Project File Structure

**Actual Structure (Phases 1-4 Complete)**:

```
app/                                    # Expo Router app directory
├── _layout.tsx                         # Root layout + auth guard
├── +not-found.tsx                      # 404 fallback
├── auth.tsx                            # Google Sign-In screen
├── modal.tsx                           # Modal provider
├── profile.tsx                         # Profile settings modal
├── (tabs)/
│   ├── _layout.tsx                    # Tab navigator (Home, History, Settings)
│   ├── index.tsx                      # Home/Run screen (live map + controls)
│   ├── history.tsx                    # Workout history list
│   └── settings.tsx                   # App settings
└── session/
    └── [id].tsx                       # Session summary (post-run)

components/
├── run-drawer.tsx                     # Live metrics HUD during run
├── photo-picker-modal.tsx             # Profile photo selection
├── haptic-tab.tsx                     # Haptic feedback wrapper
└── ui/
    ├── runner-character.tsx           # Ostrich mascot (Rive)
    ├── icon-symbol.tsx                # Icon system
    └── icon-symbol.ios.tsx            # iOS-specific icons

hooks/
├── use-run-session.ts                 # Core GPS + timer + distance engine
├── use-location.ts                    # Location permissions + reverse geocoding
├── use-color-scheme.ts                # Dark mode detection
├── use-color-scheme.web.ts            # Web-specific color scheme
└── use-theme-color.ts                 # Dynamic color hook

services/
├── gps/index.ts                       # GPS service (expo-location wrapper)
├── tracking/index.ts                  # Tracking business logic
└── workout/index.ts                   # Workout persistence

stores/
├── authStore.ts                       # Google Sign-In + session (SecureStore)
├── profileStore.ts                    # User profile (SecureStore)
├── workoutStore.ts                    # Workout history (AsyncStorage)
├── appStore.ts                        # App settings (in-memory)
└── trackingStore.ts                   # Active run state (in-memory)

types/
├── workout.ts                         # WorkoutSummary, Workout interfaces
├── tracking.ts                        # TrackingState interfaces
└── auth.ts                            # User, Auth session types

constants/
└── theme.ts                           # Colors.light, Colors.dark palettes

utils/
└── formatting.ts                      # Format time, distance, pace

assets/
├── images/                            # Icons, splashscreen
└── ostrich.riv                        # Rive animation (mascot)
```

**Differences from Plan**:
- No `database/` folder (using AsyncStorage instead of WatermelonDB)
- No `components/common/`, `components/tracking/`, `components/history/` subdirs
- Simpler file structure, flatter hierarchy
- No `services/map/polylineService.ts` (handled inline in components)

---

## Data Architecture

### Data Models

#### **Workout** (Full - kept in-memory)

```typescript
interface Workout {
  id: string;                          // UUID
  name: string;                        // e.g., "Morning Run"
  startTime: Date;
  endTime: Date;
  distanceKm: number;
  durationSeconds: number;
  pace: number;                        // min/km
  gpsPoints: GpsPoint[];               // Full coordinates
  createdAt: Date;
  updatedAt: Date;
}
```

#### **WorkoutSummary** (Persisted to AsyncStorage - GPS points stripped)

```typescript
interface WorkoutSummary {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  distanceKm: number;
  durationSeconds: number;
  pace: number;                        // avg min/km
  // ⚠️ gpsPoints NOT included to reduce storage
  createdAt: Date;
}
```

#### **GpsPoint**

```typescript
interface GpsPoint {
  latitude: number;
  longitude: number;
  altitude?: number;                   // meters
  accuracy?: number;                   // meters
  timestamp: number;                   // unix ms
}
```

### Storage Strategy

| Data | Where | Backend | Size | Persistence |
|------|-------|---------|------|-------------|
| Full Workouts | `trackingStore` | Zustand (in-memory) | Full GPS points | During app session only |
| Workout Summaries | AsyncStorage | Zustand persist | No GPS points | Survives app restart |
| Auth Session | SecureStore | Zustand persist | JSON + JWT | Encrypted, survives app restart |
| Profile | SecureStore | Zustand persist | JSON | Encrypted, survives app restart |
| App Settings | In-memory | Zustand | JSON | Lost on app restart (intentional) |

**Why strip GPS points from storage?**
- 1000+ coordinates per run = ~50-100 KB per workout
- AsyncStorage has quota (~10 MB total)
- Stripped summaries still contain all metrics needed for history view
- Full GPS maintained in-memory during session for real-time map

---

## State Management

### Store Structure (Zustand + Persistence)

All stores follow this pattern:

```typescript
create(
  persist(
    (set) => ({
      // State
      state: initialValue,
      // Actions
      setState: (value) => set({ state: value })
    }),
    {
      name: 'store-name',
      storage: persistStorage // SecureStore or AsyncStorage
    }
  )
)
```

### Stores Reference

#### **trackingStore** (In-memory)
- Active run state during workout
- Distance, duration, pace calculations
- GPS points array (full coordinates)
- Start/pause/resume/end handlers

#### **workoutStore** (AsyncStorage persist)
- `workouts: WorkoutSummary[]`
- Add/delete/load workout operations
- Loaded on app start (hydration)

#### **authStore** (SecureStore persist)
- `isLoggedIn: boolean`
- `user: { email, name, photoUrl }`
- `isHydrating: boolean`
- Login/logout handlers

#### **profileStore** (SecureStore persist)
- `firstName, lastName`
- `weightKg, heightCm`
- `photoUrl`

#### **appStore** (In-memory)
- `unitSystem: 'metric' | 'imperial'`
- `mapStyle: 'standard' | 'satellite'`
- `darkMode: boolean`
- Settings update handlers

---

## Component Hierarchy & Navigation

### Root Navigation Structure

```
Root Layout (app/_layout.tsx)
├── Auth Guard
│   ├── If not logged in → /auth screen
│   └── If logged in → Tab Navigator
└── Tab Navigator (tabs)
    ├── Home (index.tsx)
    │   └── Map + Run Drawer + Controls
    ├── History (history.tsx)
    │   └── Workout List
    └── Settings (settings.tsx)
        └── Settings Controls

Modal Provider (app/modal.tsx)
├── Profile Settings (profile.tsx)
├── Permission Alerts
└── Confirmation Dialogs

Post-Run Screen
└── Session Summary (session/[id].tsx)
    └── Map Replay + Workout Stats
```

### Screen Components

#### **Home Screen (app/(tabs)/index.tsx)**
- Full-screen map with current location
- Polyline showing route
- User location marker
- Bottom Run Drawer showing:
  - Distance, Duration, Pace
  - Start/Pause/Resume/Stop buttons
  - State indicator (running/paused/idle)

#### **History Screen (app/(tabs)/history.tsx)**
- Flat list of past WorkoutSummaries
- Delete functionality per workout
- Tap to view full summary

#### **Settings Screen (app/(tabs)/settings.tsx)**
- Unit system toggle (metric/imperial)
- Dark mode toggle
- Map style selector
- Profile button
- Logout button

#### **Profile Modal (app/profile.tsx)**
- Profile photo picker
- Name, weight, height inputs
- Logout button

#### **Session Summary (app/session/[id].tsx)**
- Map replay of full route
- Workout stats (distance, time, pace)
- Save/delete options

---

## Styling & Design System

### Theme System (constants/theme.ts)

```typescript
export const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#FF6B35',
    primaryLight: '#FFB4A0',
    border: '#E5E7EB'
  },
  dark: {
    background: '#1F2937',
    surface: '#111827',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    primary: '#FF6B35',
    primaryLight: '#FFB4A0',
    border: '#374151'
  }
}
```

### NativeWind Usage

```typescript
// Static layout classes
<View className="flex-1 gap-4 p-4" />

// Dynamic colors via style prop
<View style={{ backgroundColor: Colors[scheme].background }} />

// Combined
<Text className="text-xl font-bold dark:text-white">Distance</Text>
```

### Tailwind Configuration (tailwind.config.js)

NativeWind exposes Tailwind utilities for React Native. See [tailwind-css.instructions.md](instructions/tailwind-css.instructions.md) for detailed guidelines.

---

## Navigation Flow

Expo Router handles file-based navigation:

```
app/                    → Route prefix
├── (tabs)/_layout      → Tab group (home, history, settings)
├── auth                → /auth route
├── profile             → /profile modal
└── session/[id]        → /session/:id (dynamic route)
```

**Auth Flow**:
1. User launches app
2. Root layout checks `authStore.isLoggedIn`
3. If false → redirect to `/auth` (Google Sign-In)
4. If true → show tab navigator

**Run Lifecycle**:
```
(tabs)/index.tsx
  ↓ user taps "Start"
use-run-session hook
  ↓ user taps "Stop"
trackingStore saves workout
  ↓ router.push('/session/[id]')
session/[id].tsx
  ↓ user taps "Done"
→ back to (tabs)/index.tsx
```

---

## Implementation Status

### ✅ Complete (Phases 1-4)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Setup & Navigation | ✅ Complete |
| 2 | Map & UI Components | ✅ Complete |
| 3 | Location Permissions & GPS | ✅ Complete (foreground only) |
| 4 | Tracking Engine & Calculations | ✅ Complete |

**What's working**:
- Google Sign-In with SecureStore persistence
- Live GPS tracking (BestForNavigation, 1 sec / 2 m)
- Real-time map with polyline
- Start/Pause/Resume/Stop controls
- Distance (Haversine) + pace calculations
- Workout auto-save + session summary
- History view with delete
- Profile settings
- Dark mode + unit system toggle

### 🔄 Future Enhancements (Not in MVP)

| Feature | Notes |
|---------|-------|
| Background GPS | Complexity & battery drain; requires foreground service |
| Analytics | Aggregated fitness metrics, streaks, PR tracking |
| Social Sharing | QR codes or links to runs |
| Data Export | CSV/GPX export functionality |
| Offline Maps | Tile caching for frequent areas |
| Elevation Profiles | Requires elevation data during tracking |

---

## Core Algorithms

### 1. Haversine Distance Formula

Calculates distance between two GPS coordinates accounting for Earth's curvature:

```typescript
const R = 6371; // Earth radius in km
const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);
const a = sin²(dLat/2) + cos(lat1) × cos(lat2) × sin²(dLon/2);
const c = 2 × atan2(√a, √(1-a));
distance = R × c;
```

**Total Distance** = Sum of all consecutive GPS point distances

### 2. Pace Calculation

```typescript
pace (min/km) = (duration in minutes) / (distance in km)
```

Updated in real-time during run.

### 3. GPS Point Filtering

```typescript
// Reject points if:
// - Speed > 50 km/h (unrealistic for running)
// - Accuracy > 100m (too noisy)
// - Duplicate coordinates
```

### 4. Storage Optimization

```typescript
// In trackingStore (full Workout with GPS):
{ id, name, startTime, distance, duration, pace, gpsPoints[] }

// Persisted to AsyncStorage (WorkoutSummary):
{ id, name, startTime, distance, duration, pace } 
// ⚠️ gpsPoints stripped to save space
```

**Dependencies**: None

---

## Architecture Decision Records (ADRs)

### ADR-001: WatermelonDB vs expo-sqlite

**Decision**: Use WatermelonDB
**Rationale**:

- Reactivity (UI updates automatically)
- Better query performance for large datasets
- Cleaner API (ORM-like)
- Easier to add cloud sync later

**Alternative Rejected**: expo-sqlite (simpler but less optimized)

---

### ADR-002: Zustand for State Management

**Decision**: Use Zustand (lightweight store)
**Rationale**:

- Minimal boilerplate (vs Redux)
- Great TypeScript support
- Perfect for this app's complexity level
- Easy integration with Expo

**Alternative Rejected**: Context API (less optimized for performance)

---

### ADR-003: Tailwind CSS for Styling

**Decision**: Use react-native-tailwindcss
**Rationale**:

- Consistent design system
- Utility-first approach matches component structure
- Great for rapid UI development
- Reduces custom StyleSheet bloat

---

## Testing Strategy

### Unit Tests

```typescript
// Math & calculations
- calculateDistance() with various coordinates
- calculatePace() edge cases
- filterOutliers() with realistic GPS noise
```

### Component Tests

```typescript
// UI components
- MetricsDisplay with various values
- TrackingControls button states
- PermissionModal flow
```

### Integration Tests

```typescript
// Full user flows
- Start run → add GPS points → stop run → save
- Load history → view workout details
- Permission denied → guide to settings
```

---

## Deployment & Distribution

### Platform Targets

- iOS (iPhone 12+)
- Android (API 28+)

### EAS Build Configuration

```json
{
  "builds": {
    "ios": {
      "production": {}
    },
    "android": {
      "production": {}
    }
  }
}
```

---

## Performance Targets

| Metric                 | Target         | Method         |
| ---------------------- | -------------- | -------------- |
| App Launch             | <2s            | Profiler       |
| GPS Update             | <1s UI latency | DevTools       |
| Polyline Render        | 60 FPS         | React Profiler |
| Memory (1-hour run)    | <150MB         | DevTools       |
| Battery Drain (1-hour) | <12%           | Device testing |

---

## Summary Table

| Aspect     | Choice            | Rationale                             |
| ---------- | ----------------- | ------------------------------------- |
| Database   | WatermelonDB      | Reactive, performant, ORM-like        |
| State Mgmt | Zustand           | Lightweight, TypeScript, simple       |
| Maps       | react-native-maps | Standard, well-maintained             |
| GPS        | expo-location     | Built into Expo, permissions handling |
| Styling    | Tailwind CSS      | Utility-first, design system          |
| Navigation | React Navigation  | Industry standard, deep linking ready |

---

## Next Steps

1. **Review this plan** - Confirm all choices and structure
2. **Phase 1 approval** - Ready to initialize project?
3. **Proceed phase-by-phase** - Wait for sign-off before each phase

---

**End of Technical Plan**
