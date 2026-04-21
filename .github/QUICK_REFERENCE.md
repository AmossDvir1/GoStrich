# GoStrich - Quick Reference & Implementation Guide

## 📚 Document Navigation

You now have 4 key documents:

1. **HIGH_LEVEL_PLAN.md** ← What the app should do (requirements)
2. **TECHNICAL_PLAN.md** ← How we'll build it (tech stack, structure, algorithms)
3. **LOGIC_FLOW.md** ← Visual diagrams of how data flows
4. **This file** ← Quick reference & how to use everything

---

## 🎯 The Vision at a Glance

**GoStrich** = Strava for iOS/Android, but 100% offline-first.

### What Users Can Do

- ✅ Start a run and see it on a live map
- ✅ See real-time pace, distance, duration
- ✅ Pause and resume runs
- ✅ Stop and save to device
- ✅ View all past runs with details
- ✅ No internet required

### What We Build

- 📱 React Native app (Expo)
- 🗺️ Real-time map with GPS tracking
- 💾 Local SQLite database (WatermelonDB)
- 📊 Metrics calculations (distance, pace, time)
- 🎨 Clean UI with Tailwind CSS
- 🏗️ Well-organized services & components

---

## 🏗️ Architecture in 60 Seconds

```
USER TAPS "START RUN"
         ↓
Zustand Store updates isRunning=true
         ↓
GPS Service starts watching position
         ↓
MetricsCalculator processes each GPS point
         ↓
UI components subscribe to store, re-render in real-time
         ↓
Points drawn on map as polyline
         ↓
USER TAPS "STOP"
         ↓
Workout object created & saved to WatermelonDB
         ↓
Workout appears in History screen
         ↓
Done! Data persists on device forever.
```

---

## 📋 Core Concepts Reference

### 1. WatermelonDB (Database)

**What**: Local database on device  
**Why**: Fast, reactive, handles GPS point arrays well  
**Contains**:

- Workouts table (id, name, distance, time, etc.)
- GpsPoints table (lat, lon, accuracy, timestamp, etc.)

```typescript
// You never write raw SQL
// Instead, you use models:
const workout = await db.collections.get("workouts").find(id);
const gpsPoints = await workout.gpsPoints.fetch();
```

---

### 2. Zustand (State Management)

**What**: Global state store (like Redux but simpler)  
**Why**: Components automatically re-render when store changes  
**Stores**:

- `trackingStore` - active run (isRunning, distance, pace, etc.)
- `appStore` - settings (unitSystem, permissions, etc.)
- `workoutStore` - all saved workouts

```typescript
// Component gets latest values from store
const { isRunning, distance } = useTracking();
// Returns live data - updates as GPS points arrive
```

---

### 3. Services (Business Logic)

**What**: Classes that handle GPS, calculations, database  
**Why**: Keep logic separate from UI  
**Key Services**:

- `LocationService` - request permissions, watch GPS
- `TrackingEngine` - start/pause/stop logic
- `MetricsCalculator` - distance, pace math
- `WorkoutService` - save/load from database

---

### 4. Custom Hooks (Connect UI to Services)

**What**: React hooks that glue services to components  
**Why**: Cleaner component code  
**Key Hooks**:

- `useTracking()` - main hook for dashboard
- `useLocationPermissions()` - check/request permissions
- `useMetrics()` - get live metrics

---

### 5. Components (UI)

**What**: React Native components users see  
**Why**: Organized, reusable, testable  
**Key Components**:

- `MapView` - live tracking map
- `MetricsDisplay` - pace, distance, time
- `TrackingControls` - start/pause/stop buttons
- `WorkoutCard` - history list item

---

## 🔄 Data Flow Examples

### Example 1: User Starts a Run

```
1. User taps [START] button
2. TrackingEngine.startRun() called
3. GPS Service requests location permissions
4. Zustand store: isRunning = true
5. Components re-render (button changes to [PAUSE])
6. GPS Service starts watching position
7. Each GPS point triggers:
   a. Validate & filter
   b. Calculate distance/pace
   c. Update Zustand store
   d. Components re-render
   e. Map polyline updates
```

### Example 2: User Stops Run

```
1. User taps [STOP] button
2. TrackingEngine.stopRun() called
3. GPS Service stops watching
4. Calculate final metrics (total distance, avg pace)
5. Create Workout object with all data
6. WorkoutService.saveWorkout() → saves to WatermelonDB
7. Zustand stores update:
   a. trackingStore: reset (isRunning=false, distance=0, etc.)
   b. workoutStore: reload all workouts
8. Components re-render with new history
```

---

## 📂 File Structure Quick Map

### Where to put different things:

**Business Logic** → `services/`

```
const distance = metricsCalculator.calculateDistance(gpsPoints);
```

**UI Components** → `components/`

```
<MetricsDisplay distance={distance} pace={pace} />
```

**Database Models** → `database/models/`

```
const workouts = await db.collections.get('workouts').query().fetch();
```

**TypeScript Types** → `types/`

```
type Workout = { id: string; distance: number; ... }
```

**Utility Functions** → `utils/`

```
const formatted = formatPace(5.5); // "5:30"
```

**State Stores** → `stores/`

```
const { isRunning, startRun } = useTracking();
```

**Hooks** → `hooks/`

```
const { distance, pace } = useMetrics();
```

---

## 🚀 Technology Decisions Explained

| Decision   | Tool              | Why                       | Alternative    |
| ---------- | ----------------- | ------------------------- | -------------- |
| Database   | WatermelonDB      | Reactive, fast            | expo-sqlite    |
| State      | Zustand           | Simple, TypeScript        | Redux, Context |
| Maps       | react-native-maps | Standard, reliable        | @rnmapbox/maps |
| GPS        | expo-location     | Built into Expo           | bare RN        |
| Styling    | Tailwind CSS      | Utility-first, consistent | StyleSheet     |
| Navigation | React Navigation  | Industry standard         | Expo Router    |

---

## ⚡ Key Algorithms Simplified

### Distance Calculation

```
Loop through each GPS point pair
├─ Calculate distance between two points (Haversine formula)
├─ Add to running total
└─ Result = total distance in km
```

### Pace Calculation

```
pace = total_duration_seconds / total_distance_km
Format: Convert to "MM:SS" format
Example: 332 seconds / 5.2 km = 5.5 min/km = "5:30"
```

### Outlier Filtering

```
For each GPS point:
├─ If accuracy > 100m → reject (bad signal)
├─ If speed > 50 km/h → reject (unrealistic for running)
├─ If duplicate location → reject
└─ Otherwise → accept and use
```

---

## 🎨 Styling Quick Reference

### Colors

```typescript
primary: "#FF6B35"; // Buttons, actions
success: "#10B981"; // Completed runs
error: "#EF4444"; // Errors, stop
paceEasy: "#86EFAC"; // Slow pace (green)
paceHard: "#EF4444"; // Fast pace (red)
```

### Typography

```typescript
// Big numbers (distance, pace)
style={tailwind('text-4xl font-bold')}

// Regular text
style={tailwind('text-base text-gray-600')}

// Small labels
style={tailwind('text-sm text-gray-500')}
```

### Spacing

```typescript
// Use standard scale
p - 4; // padding 16px
m - 2; // margin 8px
gap - 3; // gap 12px
```

---

## 🧪 Testing Strategy

### What to Test

**Unit Tests** (math functions)

```typescript
test("calculates distance correctly", () => {
  const result = calculateDistance(point1, point2);
  expect(result).toBeCloseTo(0.5, 2); // 0.5 km ± 0.01
});
```

**Component Tests** (UI)

```typescript
test('displays metrics correctly', () => {
  render(<MetricsDisplay distance={5.2} pace={5.5} />);
  expect(screen.getByText('5.2')).toBeOnTheScreen();
});
```

**Integration Tests** (full flows)

```typescript
test("can start, track, and stop a run", async () => {
  // Mock GPS points
  // Start tracking
  // Add GPS points
  // Stop tracking
  // Verify saved to database
});
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Map doesn't show route

**Check**:

- [ ] GPS points being added to store?
- [ ] Polyline coordinates formatted correctly?
- [ ] Map permissions granted?

### Issue 2: Metrics not updating in real-time

**Check**:

- [ ] GPS points arriving (check console)?
- [ ] Store subscribers working?
- [ ] Component using `useTracking()` hook?

### Issue 3: GPS tracking stops

**Check**:

- [ ] Permissions granted?
- [ ] App has location permission in background?
- [ ] Battery saver mode enabled on device?

### Issue 4: Large GPS arrays causing lag

**Solution**:

- Simplify polyline (remove ~80% of points)
- Use `removeClippedSubviews` on map
- Virtualize polyline rendering

---

## 📊 Performance Targets

| Metric                 | Target     | How to Check         |
| ---------------------- | ---------- | -------------------- |
| App Launch             | <2 seconds | DevTools Performance |
| GPS Update Delay       | <1 second  | Visual inspection    |
| Polyline Render        | 60 FPS     | React Profiler       |
| Memory (1-hour run)    | <150 MB    | DevTools Memory      |
| Battery Drain (1-hour) | <12%       | Device battery meter |

---

## 🛠️ Development Workflow

### 1. Before Starting Phase

- [ ] Read relevant sections of TECHNICAL_PLAN.md
- [ ] Check LOGIC_FLOW.md for data flow
- [ ] Understand which services/components involved

### 2. During Development

- [ ] Follow TypeScript best practices
- [ ] Use tailwind for styling
- [ ] Write tests as you go
- [ ] Check for memory leaks

### 3. After Development

- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Profile performance
- [ ] Check battery drain on long run

---

## 📖 Where to Look for Specific Info

| Question                      | Document                              |
| ----------------------------- | ------------------------------------- |
| What features do we need?     | HIGH_LEVEL_PLAN.md                    |
| What tech stack are we using? | TECHNICAL_PLAN.md → Technology Stack  |
| What folder structure?        | TECHNICAL_PLAN.md → File Structure    |
| How does GPS data flow?       | LOGIC_FLOW.md → Data Flow             |
| What are the algorithms?      | TECHNICAL_PLAN.md → Core Algorithms   |
| How do components connect?    | LOGIC_FLOW.md → Component State Flow  |
| What's the database schema?   | TECHNICAL_PLAN.md → Data Architecture |
| How do I use Zustand?         | LOGIC_FLOW.md → State Tree Structure  |

---

## 🎯 Phase Checklist

### Phase 1: Setup & Navigation

- [ ] Expo project initialized
- [ ] TypeScript configured
- [ ] Folder structure created
- [ ] Navigation set up (tabs + stack)
- [ ] Screen stubs created

### Phase 2: Map & UI

- [ ] MapView component working
- [ ] MetricsDisplay component
- [ ] TrackingControls component
- [ ] WorkoutCard component
- [ ] PermissionModal component

### Phase 3: GPS & Permissions

- [ ] LocationService implemented
- [ ] Permissions working
- [ ] GPS watching working
- [ ] Real device testing done

### Phase 4: Tracking Engine

- [ ] TrackingEngine class implemented
- [ ] Start/Pause/Stop working
- [ ] MetricsCalculator working
- [ ] Real-time updates working

### Phase 5: Database

- [ ] WatermelonDB set up
- [ ] Schema created
- [ ] Models created
- [ ] Save/load working

### Phase 6: Polyline

- [ ] Route drawing on map
- [ ] Real-time polyline updates
- [ ] Polyline simplification
- [ ] Performance optimized

### Phase 7: History

- [ ] Workout list loading
- [ ] Workout detail view
- [ ] Filtering/searching
- [ ] Stats calculations

### Phase 8: Polish & Optimization

- [ ] Error handling
- [ ] Loading states
- [ ] Performance profiling
- [ ] Battery optimization

---

## 💡 Pro Tips

1. **Use TypeScript Strictly**: Catch errors at compile time, not runtime
2. **Test Early**: Write tests before integrating
3. **Profile Often**: Use DevTools to catch performance issues early
4. **Keep Services Pure**: No UI logic in services, no service logic in UI
5. **Validate GPS Data**: Filter bad points early to prevent cascading errors
6. **Simplify Polylines**: 1000+ points on map = lag. Simplify to 100-200 points.
7. **Use Zustand Sparingly**: Only store what needs to trigger UI updates
8. **Clean Up Subscriptions**: Always unsubscribe from GPS watch and other listeners

---

## 🚨 Common Pitfalls to Avoid

❌ **Don't**:

- Store all GPS points in component state (causes crashes)
- Use `any` type in TypeScript
- Forget to add cleanup in `useEffect` (memory leaks)
- Call expensive calculations on every render
- Store sensitive data without encryption
- Update store too frequently (causes re-render spam)

✅ **Do**:

- Store GPS points in a ref or database
- Use strict TypeScript
- Cleanup subscriptions & timers
- Use `useMemo` for expensive calculations
- Limit store updates (throttle/debounce)
- Use WatermelonDB for data persistence

---

## 🆘 Getting Help

### If stuck on architecture:

→ Review TECHNICAL_PLAN.md → Project Structure

### If confused about data flow:

→ Check LOGIC_FLOW.md → Data Flow Diagram

### If unsure about implementation:

→ Check TECHNICAL_PLAN.md → Service Layer Architecture

### If code is slow:

→ Check TECHNICAL_PLAN.md → Performance Targets

---

## 📝 Summary

GoStrich is a well-designed, offline-first app with:

- ✅ Clean architecture (services, stores, components)
- ✅ Strong type safety (TypeScript)
- ✅ Responsive UI (Zustand + React Native)
- ✅ Local data persistence (WatermelonDB)
- ✅ Real-time GPS tracking (expo-location)
- ✅ Beautiful maps (react-native-maps)

**All documented. All planned. Ready to build.**

---

**Happy coding! 🏃‍♂️💨**
