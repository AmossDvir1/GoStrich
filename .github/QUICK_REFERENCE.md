# GoStrich - Quick Reference

## 📚 Document Navigation

| Doc | Purpose |
|---|---|
| [TECH_STACK.md](TECH_STACK.md) | **Comprehensive tech stack** (read this first!) |
| [TECHNICAL_PLAN.md](TECHNICAL_PLAN.md) | Architecture, algorithms, data flow |
| [high-level-plan.md](high-level-plan.md) | Original requirements brief |
| [LOGIC_FLOW.md](LOGIC_FLOW.md) | Data flow diagrams |
| [README.md](../README.md) | Setup, commands, project structure |
| **This file** | Quick lookup |

---

## 🚀 Tech Stack at a Glance

```
React Native 0.81 + Expo 54 + TypeScript 5.9
├── State: Zustand 5.0
├── Storage: AsyncStorage 2.2 + SecureStore 15.0
├── Maps: react-native-maps 1.20 (Google Maps)
├── Location: expo-location 19.0 (foreground GPS)
├── Auth: Google Sign-In 16.1 + SecureStore
├── Styling: NativeWind 4.1 (Tailwind CSS)
├── Animation: Rive 9.8 + Reanimated 4.1
└── Navigation: Expo Router 6.0 (file-based)
```

See [TECH_STACK.md](TECH_STACK.md) for full breakdown with versions, purposes, and trade-offs.

**What's working:**
- Google Sign-In (session in SecureStore, survives restarts)
- Live GPS tracking (foreground, 1 s / 2 m intervals)
- Real-time map with route polyline
- Start / Pause / Resume / Stop run controls
- Elapsed time + distance during run
- Workout auto-saved on stop
- Session summary screen with map replay
- Sessions history with delete
- Profile (name, weight, height, photo)
- Dark mode + metric/imperial toggle

---

## Architecture in 60 Seconds

```
USER TAPS "START"
    │
    ▼
use-run-session.ts
    ├── requestForegroundPermissionsAsync()
    ├── watchPositionAsync() → GPS stream
    └── setInterval() → timer

Each GPS tick:
    ├── haversine(prev, curr) → add to distance
    ├── push to routeCoords → Polyline re-renders
    └── update elapsed → RunDrawer re-renders

USER TAPS "STOP"
    ├── build Workout { id, name, gpsPoints, distance, duration, pace }
    ├── workoutStore.addWorkout()  →  strips gpsPoints, saves to AsyncStorage
    └── router.push('/session/[id]')  →  session summary screen
```

---

## Stores Quick Reference

| Store | Backed By | What's In It |
|---|---|---|
| `authStore` | SecureStore | `isLoggedIn`, `user`, `isHydrating` |
| `profileStore` | SecureStore | `firstName`, `lastName`, `photoUrl`, `weightKg`, `heightCm` |
| `workoutStore` | AsyncStorage | `workouts: WorkoutSummary[]` |
| `appStore` | In-memory | `unitSystem`, `mapStyle`, `darkMode` |
| `trackingStore` | In-memory | Active run state |

---

## Key Files

| File | Responsibility |
|---|---|
| `app/_layout.tsx` | Auth guard — redirects to `/auth` when not logged in |
| `app/auth.tsx` | Google Sign-In screen |
| `app/(tabs)/index.tsx` | Home/Run screen — map + run drawer |
| `app/(tabs)/history.tsx` | Sessions list |
| `app/session/[id].tsx` | Session summary (map replay + stats) |
| `app/profile.tsx` | Profile modal (settings + logout) |
| `hooks/use-run-session.ts` | Core run lifecycle — GPS, timer, distance |
| `hooks/use-location.ts` | Permission request + reverse geocoding |
| `components/run-drawer.tsx` | Live metrics HUD shown during a run |
| `constants/theme.ts` | `Colors.light` / `Colors.dark` palette |
| `stores/workoutStore.ts` | Workout history with AsyncStorage persistence |
| `services/gps/index.ts` | expo-location wrapper (permission + watchPosition) |

---

## Run Lifecycle States

```
idle → running → paused → running → (stop) → session summary
              ↘ (stop)
              session summary
```

- `handleStart()` — requests permission, starts GPS + timer
- `handlePause()` — pauses GPS + timer
- `handleResume()` — resumes GPS + timer
- `handleEnd()` — saves workout, navigates to `/session/[id]`

---

## Algorithms

### Haversine Distance

```typescript
function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
```

### Average Pace

```typescript
avgPaceMinPerKm = (durationSeconds / 60) / distanceKm;
// Formatted as "MM:SS /km" in utils/formatting.ts
```

---

## Styling Pattern

```typescript
// Static layout → NativeWind className
<View className="flex-1 px-6 pt-5 pb-3">

// Dynamic brand colors → style prop with Colors[scheme]
const c = Colors[useColorScheme()];
<Text style={{ color: c.textPrimary }}>

// Shadows → inline style objects (defined as consts in each screen)
const CARD_SHADOW = { shadowColor: '#000', shadowOpacity: 0.06, ... };
```

---

## Technology Decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo Router v6 | File-based routing, managed workflow |
| Storage | Zustand + AsyncStorage | No ORM needed; simple, typed |
| Auth | Google Sign-In + SecureStore | No password mgmt; session survives restarts |
| Styling | NativeWind v4 | Utility-first, consistent spacing |
| GPS | expo-location foreground | Sufficient for active tracking |
| Maps | react-native-maps | Standard, polyline support |
| Animation | rive-react-native | Ostrich mascot |

---

## Common Commands

```bash
npm start              # Expo dev server
npm run android        # Android emulator / device
npm run ios            # iOS simulator
npm run lint           # ESLint

# Android release build
cd android
./gradlew assembleRelease

# After renaming project folder (stale autolinking fix)
Remove-Item android/build/generated/autolinking/autolinking.json
./gradlew clean
./gradlew assembleRelease
```
