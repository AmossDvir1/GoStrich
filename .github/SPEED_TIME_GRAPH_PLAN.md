# Speed vs Time Graph Plan

Date: 2026-04-24

## Goal

Add a session graph where:

- X axis = elapsed time during the run
- Y axis = speed

This document answers:

1. Is per-timepoint data collected now?
2. How is a session data point stored?
3. What is missing for a reliable speed-vs-time graph?
4. What is the implementation plan?

## Current State (Deep Audit)

### 1) Is per-timepoint data collected during an active session?

Yes.

In `hooks/use-run-session.ts`, the GPS watcher callback builds a `GpsPoint` for each location update with:

- `latitude`
- `longitude`
- `altitude`
- `accuracy`
- `speed` (from Expo Location, typically m/s)
- `timestamp` (epoch ms)

It appends each point to an in-memory array: `gpsPointsRef.current`.

So during an active session, you already collect speed and timestamp at each sampled point.

### 2) How do we currently store session data points?

Flow today:

1. `use-run-session` creates a full `Workout` object at `handleEnd`, including `gpsPoints`.
2. `addWorkout(workout)` is called in `stores/workoutStore.ts`.
3. In `addWorkout`, `gpsPoints` is explicitly removed:
   - `const { gpsPoints: _, ...summary } = workout`
4. Only `summary` is persisted to AsyncStorage via Zustand `persist` middleware.
5. `WorkoutSummary` type is `Omit<Workout, "gpsPoints">`.

Result:

- `gpsPoints` (and therefore per-point `speed` and `timestamp`) are NOT persisted.
- After app restart, only summary data is available.
- Session detail currently uses `routeCoords` (lat/lon pairs) for map, but no speed-time series.

### 3) Can we render speed vs time graph from persisted data today?

Not reliably.

You can only render it immediately in-memory while run state is alive. For historical sessions and restart safety, the required time-series data is missing because `gpsPoints` are stripped before persistence.

## Data Model Assessment

### Existing types

`types/workout.ts`:

- `GpsPoint` already contains `speed` + `timestamp`.
- `Workout` includes `gpsPoints: GpsPoint[]`.
- `WorkoutSummary = Omit<Workout, "gpsPoints">`.

### Key gap

There is no persisted lightweight time-series field dedicated to charting.

## Risks To Address

1. Storage growth if full raw GPS arrays are persisted for every run.
2. Inconsistent speed source:
   - Raw GPS speed (`point.speed`) may be null/noisy.
   - Computed speed from distance/time can differ.
3. Pause handling is incomplete in saved workout metadata:
   - `pausedDuration` is currently saved as `0`.
4. Sampling is non-uniform (`timeInterval` + `distanceInterval` + filters), so chart logic must tolerate irregular intervals.

## Recommended Approach

Persist a compact speed-time series in workout summaries while still omitting full raw `gpsPoints`.

This preserves historical chart ability without storing the heaviest geospatial payload.

## Proposed Type Additions

In `types/workout.ts`, add:

```ts
export interface SpeedPoint {
  // milliseconds since run start (relative time for chart X axis)
  t: number;
  // speed in m/s (source of truth for calculations)
  speedMps: number | null;
}

export interface PauseInterval {
  startMs: number;
  endMs: number;
}
```

Extend `Workout` with:

- `speedSeries?: SpeedPoint[]`
- `pauseIntervals?: PauseInterval[]`

Keep `WorkoutSummary = Omit<Workout, "gpsPoints">`.

This means summaries persist `speedSeries`, but still exclude raw GPS points.

## Implementation Plan

### Phase 1: Persist chart-ready speed data (MVP)

1. Update types

- File: `types/workout.ts`
- Add `SpeedPoint`, `PauseInterval`, optional `speedSeries`, `pauseIntervals` on `Workout`.

2. Build speed series on session end

- File: `hooks/use-run-session.ts`
- In `handleEnd`, map `gpsPointsRef.current` to `speedSeries`:
  - `t = point.timestamp - startTimeRef.current`
  - `speedMps = point.speed`

3. Persist summary with speed series

- File: `stores/workoutStore.ts`
- Keep stripping only `gpsPoints`.
- Ensure `speedSeries` and `pauseIntervals` remain in persisted summary.

Verification:

- Start run -> end run -> kill app -> reopen -> session still has `speedSeries`.

### Phase 2: Normalize and sanitize graph data

1. Add a chart-prep utility

- File: `services/tracking/index.ts` (currently stub)
- Implement:
  - null speed handling
  - optional smoothing (light moving average)
  - optional downsampling for performance on long runs

2. Unit conversion at rendering boundary

- Display metric: km/h (`mps * 3.6`)
- Display imperial: mph (`mps * 2.236936`)

Verification:

- Same stored data can render correctly in metric and imperial.

### Phase 3: Add graph UI on session details

1. Create component

- New file: `components/session-speed-chart.tsx`
- Inputs:
  - `speedSeries`
  - `unitSystem`
- Output:
  - line chart: Y speed, X elapsed time

2. Integrate into session screen

- File: `app/session/[id].tsx`
- Render chart when `workout.speedSeries?.length > 1`.

Verification:

- Historical sessions with speed series show graph.
- Sessions without series degrade gracefully (no crash, fallback text).

### Phase 4: Improve pause correctness (recommended)

1. Track pause intervals in run hook

- File: `hooks/use-run-session.ts`
- Save relative pause windows into `pauseIntervals`.

2. Compute and persist `pausedDuration`

- Replace current hardcoded `pausedDuration: 0` with real sum.

3. Optional chart behavior

- Either remove paused segments from plotted points
- Or visually mark pause windows

Verification:

- Pausing no longer flattens/misleads speed-time chart interpretation.

## Backward Compatibility Strategy

1. Keep new fields optional (`speedSeries?`).
2. For old workouts, chart section should show a friendly message:
   - "No speed timeline available for this session."
3. Do not migrate old records immediately unless needed.

## Performance and Storage Notes

1. Keep `gpsPoints` excluded from AsyncStorage summaries (current good decision).
2. Persist only compact `speedSeries` needed for charting.
3. If storage becomes large later, downsample before persistence (for example 1 point every N seconds after run end).

## Direct Answers

1. Is data being collected per point in time now?

- Yes, during active tracking (`speed` + `timestamp` per GPS point).

2. How do we store each data point now?

- We collect full points in-memory, but strip `gpsPoints` before persistence, so per-point speed-time data is not retained long-term.

3. Do we need to add data for the graph?

- Yes. We should persist a compact speed time-series field in workout summaries so historical sessions can render speed-vs-time after restart.

## Minimal First Delivery Scope

If we want the fastest safe delivery:

1. Add `speedSeries` type + persistence.
2. Populate it in `handleEnd`.
3. Render a simple chart in session detail.

This gives immediate graph support without reworking full storage architecture.
