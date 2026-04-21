# GoStrich - Technical Architecture Plan

**Version**: 1.0  
**Date**: April 2026  
**Status**: Architecture Ready for Approval

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
11. [Phase Breakdown](#phase-breakdown)

---

## Executive Summary

GoStrich is a **100% offline-first** running tracker built with React Native + Expo, TypeScript, and local SQLite. The app enables users to:

- Track runs with live GPS coordinates
- View real-time maps with route polylines
- Calculate distance, pace, and duration automatically
- Store unlimited runs locally on-device
- View historical workout data with analytics

**Key Principle**: No backend. All data persists locally on the device.

---

## Technology Stack

### Core Framework

- **React Native 0.73+** with Expo (managed workflow)
- **TypeScript 5.x** (strict mode)
- **React Navigation 6.x** (tab-based + stack navigation)

### Local Storage

- **WatermelonDB** (recommended over SQLite for React Native)
  - Why: Better performance for large datasets, built-in reactivity, ORM-like queries
  - Alternative: `expo-sqlite` (simpler, lighter)
  - **Choice**: WatermelonDB for scalability

### Mapping & Location

- **react-native-maps** (Google Maps backend)
- **expo-location** (GPS tracking with foreground/background support)

### State Management

- **Zustand** (lightweight, TypeScript-friendly, no boilerplate)
  - Global state: Active run, app settings, user preferences
  - Alternative: Context API (simpler but less optimized)

### Styling

- **react-native-tailwindcss** (Tailwind utilities for React Native)
- Custom theme extensions for running-specific colors

### Utilities & Helpers

- **date-fns** (date formatting and calculations)
- **uuid** (unique IDs for runs and GPS points)
- **expo-constants** (app metadata)
- **expo-permissions** (location permission handling)

### Testing & Development

- **Jest** (unit testing)
- **React Native Testing Library** (component testing)
- **ESLint + Prettier** (code quality)

---

## Project File Structure

```
GoStrich/
│
├── app/                                    # Navigation & screens (Expo Router)
│   ├── (tabs)/
│   │   ├── _layout.tsx                    # Tab navigator layout
│   │   ├── index.tsx                      # Home/Dashboard screen
│   │   ├── history.tsx                    # Activity history screen
│   │   └── settings.tsx                   # Settings screen
│   ├── _layout.tsx                        # Root layout (app shell)
│   ├── modal.tsx                          # Modal provider
│   └── +not-found.tsx                     # 404 screen
│
├── components/                             # Reusable UI components
│   ├── common/
│   │   ├── Button.tsx                     # Reusable button component
│   │   ├── Card.tsx                       # Reusable card wrapper
│   │   ├── Badge.tsx                      # Status badges
│   │   ├── Spinner.tsx                    # Loading spinner
│   │   └── PermissionModal.tsx            # Permission request modal
│   ├── tracking/
│   │   ├── MapView.tsx                    # Live map with polyline
│   │   ├── MetricsDisplay.tsx             # Live pace, distance, time
│   │   ├── TrackingControls.tsx           # Start/pause/stop buttons
│   │   └── GpsAccuracyIndicator.tsx       # GPS signal quality
│   ├── history/
│   │   ├── WorkoutCard.tsx                # Individual workout list item
│   │   ├── WorkoutList.tsx                # List of workouts
│   │   └── WorkoutDetail.tsx              # Detailed workout view
│   └── ui/
│       ├── typography.tsx                 # Text components (Heading, Body, etc.)
│       ├── spacing.ts                     # Spacing scale
│       └── colors.ts                      # Color palette
│
├── database/                               # Local database & models
│   ├── schema.ts                          # WatermelonDB schema definitions
│   ├── index.ts                           # Database initialization
│   ├── models/
│   │   ├── Workout.ts                     # Workout model
│   │   └── GpsPoint.ts                    # GPS coordinate model
│   └── migrations.ts                      # Schema migrations
│
├── stores/                                 # Zustand state stores
│   ├── trackingStore.ts                   # Active run state
│   ├── appStore.ts                        # App-wide settings
│   └── workoutStore.ts                    # Workout history state
│
├── services/                               # Business logic & external APIs
│   ├── gps/
│   │   ├── locationService.ts             # GPS tracking & permissions
│   │   └── gpsTracker.ts                  # GPS point collection
│   ├── tracking/
│   │   ├── trackingEngine.ts              # Main tracking logic (start/pause/stop)
│   │   └── metricsCalculator.ts           # Pace, distance, duration calculations
│   ├── workout/
│   │   ├── workoutService.ts              # Save/load workouts
│   │   └── workoutRepository.ts           # Database queries
│   └── map/
│       └── polylineService.ts             # Polyline encoding/decoding
│
├── hooks/                                  # Custom React hooks
│   ├── useTracking.ts                     # Active tracking state & controls
│   ├── useGpsTracking.ts                  # Real-time GPS tracking
│   ├── useWorkoutHistory.ts               # Fetch and manage workout history
│   ├── useLocationPermissions.ts          # Permission management hook
│   └── useMetrics.ts                      # Calculate & update metrics
│
├── types/                                  # TypeScript type definitions
│   ├── workout.ts                         # Workout, GpsPoint types
│   ├── app.ts                             # App-wide types
│   └── tracking.ts                        # Tracking engine types
│
├── utils/                                  # Utility functions
│   ├── calculations.ts                    # Distance, pace, duration math
│   ├── formatting.ts                      # Format times, distances, pace
│   ├── validation.ts                      # Input validation
│   ├── constants.ts                       # App constants
│   └── logger.ts                          # Error logging
│
├── assets/
│   ├── images/
│   └── fonts/
│
├── __tests__/                              # Test files
│   ├── unit/
│   ├── components/
│   └── integration/
│
├── .env                                    # Environment variables
├── .env.example                            # Example env
├── app.json                                # Expo config
├── tsconfig.json                           # TypeScript config
├── package.json                            # Dependencies
└── README.md                               # Project documentation
```

---

## Data Architecture

### Data Models

#### **Workout**

```typescript
{
  id: string (UUID);                    // Primary key
  name: string;                         // e.g., "Morning Run"
  startTime: Date;                      // When run started
  endTime: Date;                        // When run ended
  distanceKm: number;                   // Total distance in km
  durationSeconds: number;              // Total duration
  avgPaceMinPerKm: number;              // Average pace
  maxPaceMinPerKm: number;              // Fastest pace segment
  elevationGainM: number;               // Total elevation (optional)
  gpsPoints: GpsPoint[];                // Array of GPS coordinates
  pauses: Array<{
    startTime: Date;
    endTime: Date;
    durationSeconds: number;
  }>;
  notes?: string;                       // User notes
  createdAt: Date;
  updatedAt: Date;
}
```

#### **GpsPoint**

```typescript
{
  id: string (UUID);
  workoutId: string;                    // FK to Workout
  latitude: number;
  longitude: number;
  altitude?: number;                    // Elevation (meters)
  accuracy?: number;                    // GPS accuracy (meters)
  speed?: number;                       // Current speed (m/s)
  bearing?: number;                     // Direction (degrees)
  timestamp: number;                    // Unix timestamp (ms)
}
```

### WatermelonDB Schema

```typescript
// Advantages:
// - Reactive queries (UI updates automatically when data changes)
// - ORM-like API (type-safe queries)
// - Optimized for React Native
// - Handles large datasets efficiently
// - Built-in synchronization (useful for future cloud sync)
```

---

## State Management

### Store Structure (Zustand)

#### **trackingStore.ts** - Active Run State

```typescript
{
  // Run data
  isRunning: boolean;
  isPaused: boolean;
  currentRun: {
    gpsPoints: GpsPoint[];
    startTime: Date;
    pausedDuration: number;
  } | null;

  // Metrics (real-time)
  distance: number;
  duration: number;
  currentPace: number;
  avgPace: number;
  currentSpeed: number;

  // Controls
  startRun: () => Promise<void>;
  pauseRun: () => void;
  resumeRun: () => void;
  stopRun: () => Promise<Workout>;
  addGpsPoint: (point: GpsPoint) => void;
  discardRun: () => void;
}
```

#### **appStore.ts** - Global App State

```typescript
{
  // Settings
  unitSystem: 'metric' | 'imperial';
  mapStyle: 'standard' | 'satellite';
  autoStartNextRun: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;
  permissionsGranted: boolean;

  // Methods
  updateSettings: (settings: Partial<AppSettings>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}
```

#### **workoutStore.ts** - Workout History

```typescript
{
  workouts: Workout[];
  selectedWorkout: Workout | null;
  isLoadingWorkouts: boolean;

  loadWorkouts: () => Promise<void>;
  selectWorkout: (id: string) => void;
  deleteWorkout: (id: string) => Promise<void>;
  updateWorkout: (id: string, updates: Partial<Workout>) => Promise<void>;
}
```

---

## Component Hierarchy

### Screen Components

```
Root (App Shell)
├── Tabs Navigator
│   ├── Home Screen (Dashboard)
│   │   └── MapView + MetricsDisplay + TrackingControls
│   ├── History Screen
│   │   └── WorkoutList
│   │       └── WorkoutCard (individual items)
│   └── Settings Screen
│       └── Setting controls
└── Modal Provider
    └── Permission Modal
    └── Confirmation Modals
```

### Component Tree Detail

#### **Home Screen (Dashboard)**

```
<Dashboard>
  <PermissionChecker />
  <MapContainer>
    <MapView />
    <UserLocation Marker />
    <Route Polyline />
  </MapContainer>
  <BottomSheet>
    <MetricsDisplay>
      <Distance />
      <Duration />
      <CurrentPace />
      <AvgPace />
    </MetricsDisplay>
    <TrackingControls>
      <StartButton />
      <PauseButton />
      <StopButton />
      <DiscardButton />
    </TrackingControls>
  </BottomSheet>
</Dashboard>
```

#### **History Screen**

```
<HistoryScreen>
  <SearchBar />
  <FilterChips (Date, Distance) />
  <WorkoutList>
    <WorkoutCard
      onClick={() => navigate to detail}
    />
  </WorkoutList>
</HistoryScreen>
```

---

## Service Layer Architecture

### GPS Service (`services/gps/locationService.ts`)

```typescript
export class LocationService {
  // Permissions
  requestLocationPermissions(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
  openSystemSettings(): void;

  // Tracking
  startWatchingPosition(callback: (point) => void): void;
  stopWatchingPosition(): void;
  getCurrentLocation(): Promise<GpsPoint>;
}
```

### Tracking Engine (`services/tracking/trackingEngine.ts`)

```typescript
export class TrackingEngine {
  startTracking(): Promise<void>;
  pauseTracking(): void;
  resumeTracking(): void;
  stopTracking(): Promise<Workout>;
  addGpsPoint(point: GpsPoint): void;
  discard(): void;

  // Internal state
  private gpsPoints: GpsPoint[] = [];
  private startTime: Date;
  private pausedSegments: Pause[] = [];
}
```

### Metrics Calculator (`services/tracking/metricsCalculator.ts`)

```typescript
export class MetricsCalculator {
  // Distance calculation (Haversine formula)
  calculateDistance(points: GpsPoint[]): number;

  // Pace calculations
  calculateCurrentPace(lastNPoints: GpsPoint[], n: number = 10): number;
  calculateAveragePace(points: GpsPoint[], duration: number): number;

  // Filtering
  filterOutliers(points: GpsPoint[]): GpsPoint[];
  smoothElevationData(points: GpsPoint[]): GpsPoint[];
}
```

### Workout Service (`services/workout/workoutService.ts`)

```typescript
export class WorkoutService {
  // CRUD operations
  saveWorkout(workout: Workout): Promise<string>;
  getWorkout(id: string): Promise<Workout>;
  getAllWorkouts(): Promise<Workout[]>;
  updateWorkout(id: string, updates: Partial<Workout>): Promise<void>;
  deleteWorkout(id: string): Promise<void>;

  // Queries
  getWorkoutsByDateRange(start: Date, end: Date): Promise<Workout[]>;
  searchWorkouts(query: string): Promise<Workout[]>;
}
```

---

## Styling & Design System

### Color Palette

```typescript
export const colors = {
  // Primary
  primary: "#FF6B35", // Action buttons, active states
  primaryLight: "#FFB4A0",
  primaryDark: "#E85A1F",

  // Secondary
  secondary: "#004E89", // Secondary actions
  secondaryLight: "#0079C1",

  // Status
  success: "#10B981", // Completed, positive
  warning: "#FBBF24", // Caution
  error: "#EF4444", // Errors, stopped
  info: "#3B82F6", // Info alerts

  // Neutral
  bg: "#FFFFFF",
  bgDark: "#F9FAFB",
  border: "#E5E7EB",
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",

  // Pace/Zone specific
  paceEasy: "#86EFAC", // Z1-Z2 (green)
  paceMedium: "#FBBF24", // Z3 (yellow)
  paceHard: "#FB923C", // Z4 (orange)
  paceMax: "#EF4444", // Z5 (red)
};
```

### Typography

```typescript
export const typography = {
  // Headings
  h1: { fontSize: 32, fontWeight: "700", lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "700", lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: "600", lineHeight: 28 },

  // Body
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: "400", lineHeight: 20 },
  bodyTiny: { fontSize: 12, fontWeight: "400", lineHeight: 18 },

  // Metrics (large numbers)
  metric: { fontSize: 48, fontWeight: "700", lineHeight: 56 },
};
```

### Spacing Scale

```typescript
export const spacing = {
  xs: 4, // Tiny gaps
  sm: 8, // Small gaps
  md: 16, // Default
  lg: 24, // Large sections
  xl: 32, // Very large
  "2xl": 48, // Extra large
};
```

### Using Tailwind CSS

```typescript
// Example component styling
<View style={tailwind('flex-1 bg-white p-4')}>
  <Text style={tailwind('text-xl font-bold text-slate-900')}>
    Distance
  </Text>
</View>
```

---

## Navigation Flow

### Screen Hierarchy

```
RootNavigator (Stack)
├── TabNavigator (Bottom Tabs)
│   ├── HomeStack (Stack)
│   │   ├── Dashboard (Home Tab)
│   │   └── WorkoutDetailModal (if needed)
│   ├── HistoryStack (Stack)
│   │   ├── History (History Tab)
│   │   └── WorkoutDetail (Stack navigation)
│   └── SettingsStack (Stack)
│       └── Settings (Settings Tab)
└── Modal (Outside tabs)
    ├── PermissionModal
    ├── ConfirmationModals
    └── ErrorModals
```

### Deep Linking (Future Ready)

```
gostrich://home
gostrich://history
gostrich://workout/:id
gostrich://settings
```

---

## Core Algorithms & Logic

### 1. Distance Calculation (Haversine Formula)

```typescript
function calculateDistance(
  point1: { lat: number; lon: number },
  point2: { lat: number; lon: number },
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lon - point1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Total distance = sum of all consecutive segments
```

### 2. Pace Calculation

```typescript
function calculatePace(distanceKm: number, durationSeconds: number): number {
  // Returns pace in minutes per km
  if (distanceKm <= 0 || durationSeconds <= 0) return 0;
  const durationMinutes = durationSeconds / 60;
  return durationMinutes / distanceKm;
}

// Format: "5:42" (5 minutes 42 seconds per km)
```

### 3. GPS Outlier Filtering

```typescript
function filterOutliers(points: GpsPoint[]): GpsPoint[] {
  // Remove points with:
  // - Unrealistic speed (e.g., >100 km/h)
  // - Very low accuracy (>100m)
  // - Duplicate/same coordinates

  return points.filter((point, idx) => {
    if (idx === 0) return true;

    const prev = points[idx - 1];
    const distance = calculateDistance(prev, point);
    const timeDelta = (point.timestamp - prev.timestamp) / 1000;
    const speed = (distance / timeDelta) * 3.6; // m/s to km/h

    // Reject if speed > 50 km/h or accuracy too poor
    return speed <= 50 && (point.accuracy || 0) < 100;
  });
}
```

### 4. Pause Handling

```typescript
// Track pauses separately
interface Pause {
  startTime: Date;
  endTime: Date;
}

// When resuming, calculate total paused duration
const totalPausedDuration = pauses.reduce(
  (sum, pause) => sum + (pause.endTime - pause.startTime),
  0,
);

// Moving time = duration - paused duration
const movingTime = duration - totalPausedDuration;
```

---

## Phase Breakdown

### Phase 1: Setup & Navigation ✅

**Objective**: Get the basic app shell working with navigation

**Tasks**:

- [ ] Initialize Expo project with TypeScript
- [ ] Set up navigation (tabs + stack)
- [ ] Create screen stubs (Dashboard, History, Settings)
- [ ] Configure Tailwind CSS
- [ ] Set up folder structure

**Dependencies**: None (just Expo setup)

---

### Phase 2: Map & UI Components 🔄

**Objective**: Build the visual layer without tracking logic

**Tasks**:

- [ ] Implement MapView component with marker
- [ ] Create MetricsDisplay component
- [ ] Build TrackingControls component
- [ ] Create WorkoutCard component for history
- [ ] Implement bottom sheet/modal for metrics
- [ ] Add PermissionModal component

**Dependencies**: react-native-maps, @react-native-bottom-sheet

---

### Phase 3: Location Permissions & GPS 🔄

**Objective**: Request permissions and set up GPS tracking infrastructure

**Tasks**:

- [ ] Implement LocationService with permission handling
- [ ] Set up expo-location with foreground tracking
- [ ] Create useLocationPermissions hook
- [ ] Add permission error UI
- [ ] Test on real device

**Dependencies**: expo-location

---

### Phase 4: Tracking Engine & Calculations 🔄

**Objective**: Core running logic

**Tasks**:

- [ ] Build TrackingEngine class (start/pause/stop)
- [ ] Implement MetricsCalculator (distance, pace)
- [ ] Create useTracking hook
- [ ] Wire tracking controls to engine
- [ ] Real-time metrics updates to UI
- [ ] Add GPS point filtering

**Dependencies**: None (pure logic)

---

### Phase 5: Local Database Setup 🔄

**Objective**: Persist workouts locally

**Tasks**:

- [ ] Set up WatermelonDB with schema
- [ ] Create Workout and GpsPoint models
- [ ] Implement WorkoutService (CRUD)
- [ ] Wire up save/load functionality
- [ ] Test data persistence

**Dependencies**: WatermelonDB, @react-native-firebase/firestore (or simpler: expo-sqlite)

---

### Phase 6: Map Polyline Drawing 🔄

**Objective**: Visualize the route on the map

**Tasks**:

- [ ] Create polyline from GPS points
- [ ] Update polyline in real-time
- [ ] Implement polyline simplification (for performance)
- [ ] Add color coding (pace-based)
- [ ] Test with long runs

**Dependencies**: react-native-maps

---

### Phase 7: History & Analytics 🔄

**Objective**: View past workouts and stats

**Tasks**:

- [ ] Load workouts from database
- [ ] Implement WorkoutList component
- [ ] Build workout detail view
- [ ] Add filtering (by date, distance)
- [ ] Show workout stats (total distance, avg pace)

**Dependencies**: None (uses existing services)

---

### Phase 8: Optimization & Polish 🔄

**Objective**: Performance, battery, UX refinement

**Tasks**:

- [ ] Optimize FlatList rendering
- [ ] Reduce battery drain (GPS accuracy tuning)
- [ ] Add error boundaries
- [ ] Implement logging
- [ ] Test on multiple devices
- [ ] Add loading states and feedback

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
