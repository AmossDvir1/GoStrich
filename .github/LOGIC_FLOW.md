# GoStrich - Logic Flow & System Architecture

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      GOSTRICH APP SHELL                         │
│  (Expo Router - Tabs with Stack Navigators)                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐    ┌────▼────┐   ┌────▼────┐
    │ HOME   │    │ HISTORY │   │SETTINGS │
    │(Active)│    │(Archive)│   │  (Prefs)│
    └───┬────┘    └────┬────┘   └────┬────┘
        │              │              │
        │         WatermelonDB        │
        │         (Local Storage)     │
        │              │              │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
    ┌───▼─────────────┐      ┌───────▼────┐
    │  SERVICES       │      │   STORES   │
    │  (Business      │      │  (Zustand) │
    │   Logic)        │      └───────┬────┘
    └───┬─────────────┘              │
        │                            │
    ┌───┴──────────────────────┐     │
    │                          │     │
┌───▼─────────┐   ┌──────────▼─┐    │
│  GPS Svc    │   │ Tracking   │    │
│             │   │  Engine    │    │
│ • Perms     │   │            │    │
│ • Tracking  │   │ • Start    │    │
│ • Location  │   │ • Pause    │    │
└─────────────┘   │ • Stop     │    │
                  └──────┬─────┘    │
                         │          │
                  ┌──────▼─────────┐│
                  │  Metrics       ││
                  │  Calculator    ││
                  │                ││
                  │ • Distance     ││
                  │ • Pace         ││
                  │ • Duration     ││
                  │ • Filtering    ││
                  └────────┬───────┘│
                           │        │
                           └─────┬──┘
                                 │
                         ┌───────▼───────┐
                         │   ZUSTAND     │
                         │   STORES      │
                         │               │
                         │ • Tracking    │
                         │ • App         │
                         │ • Workouts    │
                         └───────────────┘
```

---

## Data Flow Diagram: Recording a Run

```
USER STARTS RUN
     │
     ▼
┌──────────────────────────┐
│ TrackingEngine.startRun()│
│                          │
│ • Request permissions    │
│ • Initialize GPS watch   │
│ • Set startTime          │
│ • Clear GPS points array │
└──────────┬───────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │ expo-location starts     │
    │ watching position        │
    │                          │
    │ Every 1s (or 5m):        │
    │ receive new location     │
    └──────────┬───────────────┘
               │
        ┌──────▼──────┐
        │ NEW GPS     │
        │ POINT       │
        │ RECEIVED    │
        └──────┬──────┘
               │
    ┌──────────▼─────────────┐
    │ Validate GPS Point     │
    │                        │
    │ • Check accuracy       │
    │ • Check speed          │
    │ • Remove duplicates    │
    │ • Filter outliers      │
    └──────────┬─────────────┘
               │
        ┌──────▼──────┐
        │ VALID?      │
        └──────┬──────┘
         /     \
        /       \
    (YES)      (NO)
     │          │
     ▼          └────────┐
┌─────────────────────┐  │
│ Add to array:       │  │
│ trackingStore.      │  │
│ addGpsPoint(point)  │  │
└─────┬───────────────┘  │
      │                  │
      ▼                  │
┌──────────────────────┐ │
│ Calculate Metrics:   │ │
│                      │ │
│ • Distance (sum of   │ │
│   consecutive        │ │
│   segments)          │ │
│ • Pace (distance /   │ │
│   time)              │ │
│ • Duration (elapsed) │ │
└─────┬────────────────┘ │
      │                  │
      ▼                  │
┌──────────────────────┐ │
│ Update Zustand      │ │
│ Store (trigger      │ │
│ re-render)          │ │
└─────┬────────────────┘ │
      │                  │
      ▼                  │
┌──────────────────────┐ │
│ MetricsDisplay       │ │
│ Component re-renders │ │
│ with new values      │ │
└─────┬────────────────┘ │
      │                  │
      ▼                  │
┌──────────────────────┐ │
│ Update MapView       │ │
│ (add point to        │ │
│ polyline)            │ │
└────────────────────  │ │
      ▲                │ │
      │                │ │
      └────────────────┘ │
                         │
                         └─────────► (Discard point)
                                    │
                                    ▼
                              (Loop continues)


USER STOPS RUN
     │
     ▼
┌──────────────────────────┐
│ TrackingEngine.stopRun() │
│                          │
│ • Stop GPS watch         │
│ • Calculate final stats  │
│ • Create Workout object  │
│ • Calculate total pace   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ WorkoutService.          │
│ saveWorkout(workout)     │
│                          │
│ • Save to WatermelonDB   │
│ • Save all GPS points    │
│ • Set timestamps         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Workout saved locally ✓  │
│                          │
│ Update stores:           │
│ • Clear active run       │
│ • Reload workout list    │
│ • Show success message   │
└──────────────────────────┘
```

---

## Component State Flow

### MetricsDisplay Component

```
Props from Store:
├── distance: number
├── duration: number
├── currentPace: number
├── avgPace: number
└── isRunning: boolean

                │
                ▼
        ┌──────────────┐
        │ useMemo()    │
        │ recompute    │
        │ only when    │
        │ values       │
        │ change       │
        └──────┬───────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
  ┌──────────┐    ┌──────────┐
  │ Format   │    │ Format   │
  │ distance │    │ pace as  │
  │ to "5.2  │    │ "5:42"   │
  │ km"      │    │          │
  └────┬─────┘    └────┬─────┘
       │                │
       ▼                ▼
    ┌────────────────────────┐
    │ Render to UI           │
    │                        │
    │ Distance: 5.2 km       │
    │ Pace: 5:42 /km         │
    │ Duration: 32:15        │
    └────────────────────────┘
```

---

## GPS Data Processing Pipeline

```
Raw GPS Point (from device)
     │
     │ {lat: 37.7749, lon: -122.4194, accuracy: 8.5}
     │
     ▼
┌─────────────────────────┐
│ 1. ACCURACY CHECK       │
│                         │
│ if (accuracy > 100m) {  │
│   reject               │
│ }                       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. DUPLICATE CHECK      │
│                         │
│ if (same as last) {     │
│   reject               │
│ }                       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. SPEED CHECK          │
│                         │
│ distance = haversine()  │
│ speed = distance/time   │
│ if (speed > 50 km/h) {  │
│   reject               │
│ }                       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 4. VALID POINT ✓        │
│                         │
│ Add to array            │
│ Trigger calculations    │
└────────┬────────────────┘
         │
         ▼
    [Point stored]
```

---

## Distance Calculation Example

```
GPS Track (5 points):
┌───────┬──────────┬──────────┬───────────┬──────────┐
│ Pt 0  │   Pt 1   │   Pt 2   │   Pt 3    │   Pt 4   │
│37.77, │ 37.774,  │ 37.778,  │ 37.782,   │ 37.785,  │
│-122.4 │ -122.41  │ -122.42  │ -122.425  │ -122.43  │
└───────┴──────────┴──────────┴───────────┴──────────┘
                 │
                 ▼ Haversine calculation between consecutive points
                 │
    Segment distances:
    ├── Pt0→Pt1: 0.45 km
    ├── Pt1→Pt2: 0.52 km
    ├── Pt2→Pt3: 0.48 km
    └── Pt3→Pt4: 0.43 km
                 │
                 ▼
    Total Distance = 0.45 + 0.52 + 0.48 + 0.43
                   = 1.88 km
                 │
                 ▼
          [Final Distance]
```

---

## State Tree Structure

```
ZustandStore
│
├── trackingStore (Active Run)
│   ├── isRunning: false
│   ├── isPaused: false
│   ├── currentRun: {
│   │   ├── gpsPoints: [...]
│   │   ├── startTime: Date
│   │   └── pausedDuration: 0
│   │}
│   ├── distance: 0
│   ├── duration: 0
│   ├── currentPace: 0
│   ├── avgPace: 0
│   ├── currentSpeed: 0
│   └── actions: {
│       ├── startRun()
│       ├── pauseRun()
│       ├── resumeRun()
│       ├── stopRun()
│       ├── addGpsPoint()
│       └── discardRun()
│       }
│
├── appStore (Global Settings)
│   ├── unitSystem: 'metric'
│   ├── mapStyle: 'standard'
│   ├── autoStartNextRun: false
│   ├── permissionsGranted: true
│   ├── isLoading: false
│   ├── error: null
│   └── actions: {
│       ├── updateSettings()
│       ├── setError()
│       └── clearError()
│       }
│
└── workoutStore (History)
    ├── workouts: [{...}, {...}, ...]
    ├── selectedWorkout: null
    ├── isLoadingWorkouts: false
    └── actions: {
        ├── loadWorkouts()
        ├── selectWorkout()
        ├── deleteWorkout()
        └── updateWorkout()
        }
```

---

## Database Schema Relationships

```
                    ┌─────────────────┐
                    │    Workouts     │
                    ├─────────────────┤
                    │ id (PK)         │◄─────┐
                    │ name            │      │ FK
                    │ startTime       │      │
                    │ endTime         │      │
                    │ distanceKm      │      │
                    │ durationSec     │      │
                    │ avgPace         │      │
                    │ createdAt       │      │
                    └─────────────────┘      │
                                            │
                                            │
                    ┌─────────────────┐     │
                    │   GPS_Points    │     │
                    ├─────────────────┤     │
                    │ id (PK)         │     │
                    │ workoutId ──────┼─────┘
                    │ latitude        │
                    │ longitude       │
                    │ altitude        │
                    │ accuracy        │
                    │ timestamp       │
                    └─────────────────┘


One Workout : Many GPS_Points (1:N relationship)
```

---

## Permission Flow

```
App Starts
     │
     ▼
┌──────────────────────┐
│ Check if permission  │
│ already granted      │
└──────┬───────────────┘
       │
   /   |   \
  /    |    \
 (Y)  (N)   (Never Asked)
 │    │         │
 ▼    ▼         ▼
┌──────────────────────────────────────┐
│ Show Permission Request Modal        │
│                                      │
│ "GoStrich needs location access      │
│  to track your runs"                 │
│                                      │
│ [Allow]  [Don't Allow]               │
└──┬──────────────────────┬────────────┘
   │                      │
   (ALLOW)            (DENY)
   │                      │
   ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│ Permission       │  │ Show error       │
│ granted ✓        │  │                  │
│                  │  │ "Location access │
│ Enable tracking  │  │  is required"    │
│ controls         │  │                  │
└──────────────────┘  │ [Open Settings]  │
                      │ [Cancel]         │
                      └──────────────────┘
```

---

## Service Layer Communication

```
Component
   │ useTracking() hook
   │
   ▼
┌────────────────────┐
│ Zustand Store      │
│ (trackingStore)    │
└────┬───────────────┘
     │ dispatch action
     │
     ▼
┌────────────────────────┐
│ TrackingEngine         │
│                        │
│ • Manages lifecycle    │
│ • Coordinates between  │
│   GPS + Metrics        │
└────┬─────────┬─────────┘
     │         │
     ▼         ▼
┌──────────┐ ┌─────────────────┐
│ GPS Svc  │ │ Metrics         │
│          │ │ Calculator      │
│ • Watch  │ │                 │
│   position
│ • Get    │ │ • Distance      │
│   current│ │ • Pace          │
│ • Perms  │ │ • Duration      │
└──────────┘ └─────────────────┘
     │               │
     └───────┬───────┘
             │ store updated
             ▼
          Component
          re-renders
```

---

## Pause & Resume Logic

```
RUNNING STATE

User Presses PAUSE
     │
     ▼
┌──────────────────────┐
│ trackingStore.       │
│ pauseRun()           │
│                      │
│ • Set isPaused=true  │
│ • Record pause start │
│ • Stop GPS watch     │
└──────┬───────────────┘
       │
       ▼
  ┌─────────┐
  │ PAUSED  │
  │ STATE   │
  └────┬────┘
       │
    [User can see stats but]
    [no GPS updates happening]
       │
       ▼
User Presses RESUME
     │
     ▼
┌──────────────────────┐
│ trackingStore.       │
│ resumeRun()          │
│                      │
│ • Set isPaused=false │
│ • Record pause end   │
│ • Resume GPS watch   │
│ • Add pause to array │
└──────┬───────────────┘
       │
       ▼
  ┌────────────┐
  │ RUNNING    │
  │ AGAIN      │
  │            │
  │ (GPS watch │
  │  continues)│
  └────────────┘

When calculating moving time:
movingTime = totalDuration - totalPausedDuration
```

---

## Error Handling Flow

```
Error Occurs
     │
     ▼
┌──────────────────────────────┐
│ Try-Catch Block              │
│                              │
│ catch (error: Error)         │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Log Error                    │
│                              │
│ logger.error(               │
│   'GPS tracking failed',    │
│   error                     │
│ )                            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Update appStore             │
│                              │
│ setError(                    │
│   'Failed to start tracking' │
│ )                            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Display Error UI             │
│                              │
│ Component reads from store & │
│ shows error message          │
│                              │
│ [Retry] [Dismiss]            │
└──────┬───────────────────────┘
       │
   /   |   \
  /    |    \
(RETRY)(DISMISS)
  │       │
  ▼       ▼
[retry]  [clear]
operation error
```

---

## Polyline Rendering Pipeline

```
GPS Points Array
[Pt0, Pt1, Pt2, ..., PtN]
     │
     │ Simplify polyline (remove unnecessary points)
     │ using simplification algorithm
     │
     ▼
Simplified Points
[Pt0, Pt3, Pt6, ..., PtN]
     │
     │ Encode polyline (for efficient storage/transfer)
     │ Google Polyline Algorithm = "ofxxFxnmzV..."
     │
     ▼
Encoded String
"ofxxFxnmzV..."
     │
     │ Pass to MapView component
     │
     ▼
┌──────────────────────────┐
│ <MapView>               │
│   <Polyline            │
│     coordinates={...}  │
│     strokeColor="red"  │
│   />                   │
│ </MapView>             │
└──────────┬───────────────┘
           │
           ▼
    Rendered on Map
```

---

## Quick Reference: Key Files & Their Roles

```
SERVICE LAYER (Business Logic)
├── services/gps/locationService.ts ........... GPS + Permissions
├── services/tracking/trackingEngine.ts ....... Start/Pause/Stop logic
├── services/tracking/metricsCalculator.ts ... Distance/Pace math
└── services/workout/workoutService.ts ....... Save/Load workouts

STATE MANAGEMENT (Zustand)
├── stores/trackingStore.ts ................... Active run state
├── stores/appStore.ts ....................... Global app state
└── stores/workoutStore.ts ................... Workout history state

CUSTOM HOOKS (Bridge between UI & Logic)
├── hooks/useTracking.ts ..................... Main tracking hook
├── hooks/useGpsTracking.ts .................. Raw GPS hook
├── hooks/useWorkoutHistory.ts ............... Load workouts
├── hooks/useLocationPermissions.ts .......... Permission management
└── hooks/useMetrics.ts ...................... Real-time metrics

COMPONENTS (UI Layer)
├── components/tracking/MapView.tsx ......... Live map
├── components/tracking/MetricsDisplay.tsx . Live stats
├── components/tracking/TrackingControls.tsx  Start/Pause/Stop buttons
├── components/history/WorkoutCard.tsx ...... Workout list item
└── components/common/PermissionModal.tsx .. Permission request

DATABASE (Data Persistence)
├── database/schema.ts ....................... WatermelonDB schema
├── database/models/Workout.ts .............. Workout model
└── database/models/GpsPoint.ts ............. GPS point model
```

---

## Configuration Files Reference

```
app.json ..................... Expo app config
tsconfig.json ................ TypeScript settings
package.json ................. Dependencies + scripts
.env ......................... API keys & secrets
tailwind.config.js ........... Tailwind CSS config
```

---

**End of Logic Flow Document**
