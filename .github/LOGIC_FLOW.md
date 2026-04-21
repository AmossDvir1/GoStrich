# GoStrich - Logic Flow & System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      GOSTRICH APP SHELL                         │
│  (Expo Router v6 - File-based routing)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
    ┌────▼───────────────┐     ┌──────▼─────┐
    │  AUTH GUARD        │     │   STORES   │
    │  app/_layout.tsx   │     │  (Zustand) │
    │                    │     │            │
    │  !isLoggedIn →     │     │ authStore  │
    │  Redirect /auth    │     │ profileStore│
    └────┬───────────────┘     │ workoutStore│
         │                     │ appStore   │
         │ isLoggedIn          │ trackingStore│
         │                     └──────┬─────┘
    ┌────▼────────────────────────────┘
    │
    ├── /auth           → Google Sign-In screen
    ├── /(tabs)/index   → Home/Run screen (main)
    ├── /(tabs)/history → Sessions list
    ├── /session/[id]   → Session summary
    ├── /profile        → Profile modal
    └── /modal          → Generic modal
```

---

## Screen → Store → Persistence Map

```
┌─────────────────────┬──────────────────┬──────────────────────┐
│ Screen              │ Reads From       │ Writes To            │
├─────────────────────┼──────────────────┼──────────────────────┤
│ app/_layout.tsx     │ authStore        │ —                    │
│ app/auth.tsx        │ authStore        │ authStore → SecureStore│
│ (tabs)/index.tsx    │ trackingStore    │ workoutStore → AsyncStorage│
│ (tabs)/history.tsx  │ workoutStore     │ workoutStore → AsyncStorage│
│ session/[id].tsx    │ workoutStore     │ —                    │
│ app/profile.tsx     │ profileStore     │ profileStore → SecureStore│
│                     │ appStore         │ appStore (in-memory) │
└─────────────────────┴──────────────────┴──────────────────────┘
```

---

## Data Flow: Starting a Run

```
USER TAPS "START"
     │
     ▼
use-run-session.ts  handleStart()
     │
     ├── requestForegroundPermissionsAsync()
     │        │
     │   permission denied → alert & return
     │        │
     │   permission granted
     │        │
     ├── watchPositionAsync(GPS_OPTIONS)
     │   GPS_OPTIONS = {
     │     accuracy: BestForNavigation,
     │     timeInterval: 1000,
     │     distanceInterval: 2
     │   }
     │
     ├── setInterval(() => elapsed++, 1000)
     │
     └── setState({ status: 'running', startTime: Date.now() })
          │
          ▼
     RunDrawer renders (live elapsed + distance)
     MapView renders (empty polyline initially)
```

---

## Data Flow: Each GPS Tick

```
watchPositionAsync callback fires
     │
     ▼
new LocationObject { coords: { latitude, longitude, accuracy } }
     │
     ├── push to routeCoords[]
     │        │
     │        ▼
     │   Polyline on MapView re-renders (new segment drawn)
     │
     ├── if (prevCoord exists):
     │        │
     │        ▼
     │   haversine(prevCoord, newCoord) → deltaKm
     │        │
     │        ▼
     │   totalDistance += deltaKm
     │
     └── setState({ routeCoords, totalDistance })
          │
          ▼
     RunDrawer re-renders (updated distance)
```

---

## Haversine Formula (use-run-session.ts)

```
Given two GPS coordinates A and B:

R = 6371 (Earth radius in km)
dLat = (B.lat - A.lat) × π/180
dLon = (B.lon - A.lon) × π/180

x = sin²(dLat/2)
  + cos(A.lat × π/180) × cos(B.lat × π/180) × sin²(dLon/2)

distance = R × 2 × atan2(√x, √(1-x))   [km]
```

---

## Data Flow: Stopping a Run

```
USER TAPS "STOP"
     │
     ▼
use-run-session.ts  handleEnd()
     │
     ├── clearInterval(timer)
     ├── watchPosition.remove()   (stops GPS)
     │
     ├── build Workout object:
     │   {
     │     id:          uuid(),
     │     name:        "Run on Jan 15",
     │     date:        ISO string,
     │     distance:    totalDistance (km),
     │     duration:    elapsed (seconds),
     │     pace:        (elapsed/60) / totalDistance,
     │     gpsPoints:   routeCoords[]
     │   }
     │
     ├── workoutStore.addWorkout(workout)
     │        │
     │        ▼
     │   workoutStore strips gpsPoints from stored WorkoutSummary
     │        │
     │        ▼
     │   persist middleware → AsyncStorage.setItem('workouts', ...)
     │
     ├── setState({ status: 'idle', routeCoords: [], distance: 0 })
     │
     └── router.push('/session/' + workout.id)
          │
          ▼
     Session summary screen renders (map replay + stats)
```

---

## Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ZUSTAND STORES                          │
├──────────────┬──────────────────────────────┬───────────────┤
│ Store        │ State                        │ Persistence   │
├──────────────┼──────────────────────────────┼───────────────┤
│ authStore    │ isLoggedIn: boolean           │ SecureStore   │
│              │ user: GoogleUser | null       │ (encrypted)   │
│              │ isHydrating: boolean          │               │
├──────────────┼──────────────────────────────┼───────────────┤
│ profileStore │ firstName: string             │ SecureStore   │
│              │ lastName: string              │ (encrypted)   │
│              │ photoUrl: string | null       │               │
│              │ weightKg: number | null       │               │
│              │ heightCm: number | null       │               │
├──────────────┼──────────────────────────────┼───────────────┤
│ workoutStore │ workouts: WorkoutSummary[]    │ AsyncStorage  │
│              │                              │ (zustand      │
│              │ addWorkout(w)                 │  persist)     │
│              │ deleteWorkout(id)             │               │
│              │ getWorkoutById(id)            │               │
├──────────────┼──────────────────────────────┼───────────────┤
│ appStore     │ unitSystem: 'metric'|'imperial'│ In-memory    │
│              │ mapStyle: string              │ (resets on   │
│              │ darkMode: boolean             │  app close)  │
├──────────────┼──────────────────────────────┼───────────────┤
│ trackingStore│ Active run state              │ In-memory    │
│              │ (mirrors use-run-session)     │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

---

## Auth Flow

```
APP LAUNCHES
     │
     ▼
app/_layout.tsx  (root layout)
     │
     ├── authStore.hydrate()    ← reads SecureStore
     ├── profileStore.hydrate() ← reads SecureStore
     │
     ▼
isHydrating === true → render nothing (prevents flash)
     │
isHydrating === false
     │
     ├── isLoggedIn === false → <Redirect href="/auth" />
     │        │
     │        ▼
     │   auth.tsx  Google Sign-In button
     │        │
     │   user taps Sign In
     │        │
     │   GoogleSignin.signIn()
     │        │
     │   success → authStore.setLoggedIn(user)
     │        │      → writes to SecureStore
     │        │
     │   <Redirect href="/(tabs)" />
     │
     └── isLoggedIn === true → render (tabs) layout
```

---

## Session Summary Flow

```
handleEnd() calls router.push('/session/' + workoutId)
     │
     ▼
app/session/[id].tsx
     │
     ├── const { id } = useLocalSearchParams()
     ├── workoutStore.getWorkoutById(id)
     │
     │   NOTE: GPS points are stripped from WorkoutSummary.
     │   The session detail screen uses the gpsPoints that were
     │   passed through navigation params (or stored temporarily).
     │
     ├── MapView with Polyline (route replay)
     └── Stats cards: distance, duration, pace, date
```

---

## Component Tree

```
app/_layout.tsx  (Stack navigator + auth guard)
│
├── app/auth.tsx
│   └── Google Sign-In button
│       └── GoogleSignin.signIn() → authStore
│
├── app/(tabs)/_layout.tsx  (Tab navigator)
│   ├── app/(tabs)/index.tsx  [Run tab]
│   │   ├── MapView + Polyline
│   │   ├── RunDrawer (metrics HUD)
│   │   │   └── elapsed, distance, pace display
│   │   └── Start / Pause / Stop controls
│   │       └── use-run-session hook
│   │
│   └── app/(tabs)/history.tsx  [Sessions tab]
│       ├── FlatList of WorkoutSummary cards
│       ├── Swipe-to-delete / delete button
│       └── Tap → router.push('/session/' + id)
│
├── app/session/[id].tsx  (Stack screen)
│   ├── MapView (route replay)
│   └── Stats grid (distance, pace, duration, date)
│
├── app/profile.tsx  (Modal screen)
│   ├── expo-image (profile photo)
│   ├── expo-image-picker (photo selection)
│   ├── Editable fields (name, weight, height)
│   ├── Unit toggle (metric / imperial)
│   ├── Dark mode toggle
│   └── Sign Out button → authStore.logout()
│
└── components/ui/runner-character.tsx
    └── Rive ostrich animation (assets/ostrich.riv)
```
