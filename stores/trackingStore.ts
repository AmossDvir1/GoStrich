import { useWorkoutStore } from "@/stores/workoutStore";
import type {
    ActiveRun,
    TrackingMetrics,
    TrackingStatus,
} from "@/types/tracking";
import type { GpsPoint } from "@/types/workout";
import { vincenty } from "@/utils/gps-utils";
import * as Location from "expo-location";
import { create } from "zustand";

interface TrackingState {
  status: TrackingStatus;
  activeRun: ActiveRun | null;
  metrics: TrackingMetrics;

  startRun: (locationName: string | null) => Promise<boolean>;
  pauseRun: () => void;
  resumeRun: () => Promise<boolean>;
  stopRun: () => void;
  endRun: () => string | null;
  addGpsPoint: (point: GpsPoint) => void;
  updateMetrics: (metrics: Partial<TrackingMetrics>) => void;
  reset: () => void;
}

const initialMetrics: TrackingMetrics = {
  distance: 0,
  duration: 0,
  currentPace: 0,
  avgPace: 0,
  currentSpeed: 0,
};

let timerRef: ReturnType<typeof setInterval> | null = null;
let gpsWatchRef: Location.LocationSubscription | null = null;

// Phase 1: Tiered accuracy thresholding (P1.1)
const ACCURACY_THRESHOLDS = {
  DISCARD_M: 50, // Discard points > 50m accuracy
  WEIGHT_LOW_MIN: 20, // Full trust below 20m
  WEIGHT_LOW_MAX: 50, // Reduced trust 20-50m (70% acceptance)
};

const MAX_RUNNING_SPEED_KPH = 30;
const MIN_DISTANCE_SAMPLE_KM = 0.002;
// Phase 1: Optimized EMA smoothing factor (P1.2) — reduced from 0.25 to 0.15 for better responsiveness
const SPEED_SMOOTHING_FACTOR = 0.15;

function haversine(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
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

// Phase 2.3: Use Vincenty for high precision on long distances (>= 5km total)
function calculateSegmentDistance(
  prev: GpsPoint,
  current: GpsPoint,
  cumulativeDistanceKm: number,
): number {
  // Use Vincenty for better accuracy on long runs (>= 5km cumulative)
  if (cumulativeDistanceKm >= 5) {
    return vincenty(prev, current);
  }
  // Use Haversine for short distances (faster, good enough accuracy)
  return haversine(prev, current);
}

// Phase 1: Tiered accuracy filtering (P1.1)
function filterByAccuracy(point: GpsPoint): boolean {
  if (point.accuracy == null) return true; // Accept if not reported
  if (point.accuracy > ACCURACY_THRESHOLDS.DISCARD_M) return false; // Discard > 50m
  if (point.accuracy > ACCURACY_THRESHOLDS.WEIGHT_LOW_MAX) {
    // Degraded accuracy 20-50m: 70% acceptance rate (stochastic filtering)
    return Math.random() > 0.3;
  }
  return true; // Accept < 20m with full trust
}

function smoothGpsPoint(
  next: GpsPoint,
  previousPoints: readonly GpsPoint[],
): GpsPoint {
  if (previousPoints.length < 2) {
    return next;
  }

  const prev1 = previousPoints[previousPoints.length - 2];
  const prev2 = previousPoints[previousPoints.length - 1];

  return {
    ...next,
    latitude: (prev1.latitude + prev2.latitude + next.latitude) / 3,
    longitude: (prev1.longitude + prev2.longitude + next.longitude) / 3,
  };
}

// Phase 1: Trajectory interpolation for GPS jumps (P1.4)
function interpolateFromTrajectory(
  lastThreePoints: readonly GpsPoint[],
  implausiblePoint: GpsPoint,
): GpsPoint {
  // Use weighted average of last 3 points + expected vector
  if (lastThreePoints.length < 2) {
    return lastThreePoints[lastThreePoints.length - 1];
  }

  const p1 = lastThreePoints[lastThreePoints.length - 2];
  const p2 = lastThreePoints[lastThreePoints.length - 1];

  // Project forward along last vector (50% of step)
  const dLat = (p2.latitude - p1.latitude) * 0.5;
  const dLon = (p2.longitude - p1.longitude) * 0.5;

  return {
    ...implausiblePoint,
    latitude: p2.latitude + dLat,
    longitude: p2.longitude + dLon,
  };
}

function normalizeSpeedMps(
  rawSpeedMps: number | null,
  fallbackSpeedMps: number,
): number {
  if (
    rawSpeedMps != null &&
    rawSpeedMps > 0 &&
    rawSpeedMps < MAX_RUNNING_SPEED_KPH / 3.6
  ) {
    return rawSpeedMps;
  }

  return fallbackSpeedMps;
}

function smoothSpeedMps(
  previousSpeedMps: number,
  currentSpeedMps: number,
): number {
  if (previousSpeedMps <= 0) {
    return currentSpeedMps;
  }

  return (
    previousSpeedMps +
    (currentSpeedMps - previousSpeedMps) * SPEED_SMOOTHING_FACTOR
  );
}

function getPausedMs(run: ActiveRun, nowMs: number): number {
  return run.pauses.reduce((sum, pause) => {
    const end = pause.endTime > 0 ? pause.endTime : nowMs;
    return sum + Math.max(0, end - pause.startTime);
  }, 0);
}

function getElapsedSeconds(run: ActiveRun, nowMs: number): number {
  const movingMs = nowMs - run.startTime - getPausedMs(run, nowMs);
  return Math.max(0, Math.floor(movingMs / 1000));
}

function computeMetrics(
  run: ActiveRun,
  nowMs: number,
  distanceKm: number,
  currentSpeedMps: number,
): TrackingMetrics {
  const duration = getElapsedSeconds(run, nowMs);
  const avgPace = distanceKm > 0 ? duration / distanceKm : 0;
  // Phase 1: Pace display rounding (P1.3) — round to 30s for consistent live display
  const currentPaceRounded =
    currentSpeedMps > 0
      ? Math.round(1000 / (currentSpeedMps * 60) / 30) * 30
      : 0;

  return {
    distance: distanceKm,
    duration,
    avgPace,
    currentPace: currentPaceRounded,
    currentSpeed: currentSpeedMps,
  };
}

function stopTimer(): void {
  if (timerRef) {
    clearInterval(timerRef);
    timerRef = null;
  }
}

function stopGpsWatch(): void {
  gpsWatchRef?.remove();
  gpsWatchRef = null;
}

async function startTrackingWatch(): Promise<boolean> {
  try {
    gpsWatchRef = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => {
        const point: GpsPoint = {
          id: `${loc.timestamp}`,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude,
          accuracy: loc.coords.accuracy,
          speed: loc.coords.speed,
          timestamp: loc.timestamp,
        };

        useTrackingStore.setState((state) => {
          if (state.status !== "running" || !state.activeRun) {
            return state;
          }

          // Phase 1: Tiered accuracy filtering (P1.1)
          if (!filterByAccuracy(point)) {
            return state;
          }

          const filteredPoint = smoothGpsPoint(
            point,
            state.activeRun.gpsPoints,
          );

          const prev = state.activeRun.gpsPoints.at(-1);
          let distanceKm = state.metrics.distance;
          let speedMps = 0;
          let finalPoint = filteredPoint;

          if (prev) {
            // Phase 2.3: Use Vincenty for distances >= 5km, Haversine for shorter
            const dKm = calculateSegmentDistance(
              prev,
              filteredPoint,
              distanceKm,
            );
            const timeDeltaS =
              (filteredPoint.timestamp - prev.timestamp) / 1000;
            const speedKph = timeDeltaS > 0 ? (dKm / timeDeltaS) * 3600 : 0;

            // Phase 1: Trajectory interpolation for GPS jumps (P1.4)
            // If speed threshold exceeded, interpolate instead of discarding
            if (speedKph > MAX_RUNNING_SPEED_KPH) {
              if (state.activeRun.gpsPoints.length >= 2) {
                finalPoint = interpolateFromTrajectory(
                  state.activeRun.gpsPoints,
                  filteredPoint,
                );
                const dKmInterp = calculateSegmentDistance(
                  prev,
                  finalPoint,
                  distanceKm,
                );
                const speedKphInterp =
                  timeDeltaS > 0 ? (dKmInterp / timeDeltaS) * 3600 : 0;
                if (speedKphInterp > MAX_RUNNING_SPEED_KPH || timeDeltaS <= 0) {
                  return state; // Still implausible, discard
                }
                const instantSpeedMps = normalizeSpeedMps(
                  point.speed,
                  speedKphInterp / 3.6,
                );
                speedMps = smoothSpeedMps(
                  state.metrics.currentSpeed,
                  instantSpeedMps,
                );
                distanceKm += dKmInterp;
              } else {
                return state; // Not enough history to interpolate
              }
            } else if (timeDeltaS <= 0 || dKm < MIN_DISTANCE_SAMPLE_KM) {
              return state;
            } else {
              const instantSpeedMps = normalizeSpeedMps(
                point.speed,
                speedKph / 3.6,
              );
              speedMps = smoothSpeedMps(
                state.metrics.currentSpeed,
                instantSpeedMps,
              );
              distanceKm += dKm;
            }
          } else {
            speedMps = normalizeSpeedMps(point.speed, 0);
          }

          return {
            activeRun: {
              ...state.activeRun,
              gpsPoints: [...state.activeRun.gpsPoints, finalPoint],
              speedSeries: [
                ...state.activeRun.speedSeries,
                {
                  t: finalPoint.timestamp - state.activeRun.startTime,
                  speedMps,
                },
              ],
            },
            metrics: computeMetrics(
              state.activeRun,
              Date.now(),
              distanceKm,
              speedMps,
            ),
          };
        });
      },
    );

    return true;
  } catch {
    stopGpsWatch();
    return false;
  }
}

function startMetricsTimer(): void {
  stopTimer();
  timerRef = setInterval(() => {
    const state = useTrackingStore.getState();
    if (state.status !== "running" || !state.activeRun) return;

    useTrackingStore.setState({
      metrics: computeMetrics(
        state.activeRun,
        Date.now(),
        state.metrics.distance,
        state.metrics.currentSpeed,
      ),
    });
  }, 1000);
}

export const useTrackingStore = create<TrackingState>((set) => ({
  status: "idle",
  activeRun: null,
  metrics: initialMetrics,

  startRun: async (locationName) => {
    const currentState = useTrackingStore.getState();
    if (currentState.status !== "idle") {
      return true;
    }

    const current = await Location.getForegroundPermissionsAsync();
    let granted = current.status === Location.PermissionStatus.GRANTED;

    if (!granted && current.canAskAgain) {
      const requested = await Location.requestForegroundPermissionsAsync();
      granted = requested.status === Location.PermissionStatus.GRANTED;
    }

    if (!granted) {
      return false;
    }

    stopTimer();
    stopGpsWatch();

    const now = Date.now();
    set({
      status: "running",
      activeRun: {
        gpsPoints: [],
        startTime: now,
        pauses: [],
        speedSeries: [],
        locationName,
      },
      metrics: initialMetrics,
    });

    startMetricsTimer();
    const watchStarted = await startTrackingWatch();
    if (!watchStarted) {
      stopTimer();
      set({
        status: "idle",
        activeRun: null,
        metrics: initialMetrics,
      });
      return false;
    }

    return true;
  },

  pauseRun: () =>
    set((state) => {
      if (state.status !== "running" || !state.activeRun) return state;

      stopTimer();
      stopGpsWatch();

      const pauseStart = Date.now();
      const nextRun: ActiveRun = {
        ...state.activeRun,
        pauses: [
          ...state.activeRun.pauses,
          { startTime: pauseStart, endTime: 0 },
        ],
      };

      return {
        status: "paused",
        activeRun: nextRun,
        metrics: computeMetrics(nextRun, pauseStart, state.metrics.distance, 0),
      };
    }),

  resumeRun: async () => {
    const state = useTrackingStore.getState();
    if (state.status !== "paused" || !state.activeRun) {
      return false;
    }

    const now = Date.now();
    const pauses = [...state.activeRun.pauses];
    if (pauses.length > 0 && pauses[pauses.length - 1].endTime === 0) {
      pauses[pauses.length - 1] = {
        ...pauses[pauses.length - 1],
        endTime: now,
      };
    }

    const nextRun: ActiveRun = { ...state.activeRun, pauses };
    set({
      status: "running",
      activeRun: nextRun,
      metrics: computeMetrics(
        nextRun,
        now,
        state.metrics.distance,
        state.metrics.currentSpeed,
      ),
    });

    startMetricsTimer();
    const watchStarted = await startTrackingWatch();
    if (!watchStarted) {
      stopTimer();
      set((freshState) => ({
        status: "paused",
        metrics: {
          ...freshState.metrics,
          currentSpeed: 0,
          currentPace: 0,
        },
      }));
      return false;
    }

    return true;
  },

  stopRun: () => {
    stopTimer();
    stopGpsWatch();
    set({
      status: "idle",
      activeRun: null,
      metrics: initialMetrics,
    });
  },

  endRun: () => {
    const state = useTrackingStore.getState();
    const { activeRun } = state;
    if (!activeRun) return null;

    stopTimer();
    stopGpsWatch();

    const endTime = Date.now();
    const pauses = activeRun.pauses.map((pause) =>
      pause.endTime > 0 ? pause : { ...pause, endTime },
    );
    const normalizedRun: ActiveRun = { ...activeRun, pauses };

    const duration = getElapsedSeconds(normalizedRun, endTime);
    const distanceKm = state.metrics.distance;
    const distanceM = distanceKm * 1000;
    const avgPace = distanceKm > 0 ? duration / distanceKm : 0;
    const pauseIntervals = pauses.map((pause) => ({
      startMs: pause.startTime - normalizedRun.startTime,
      endMs: pause.endTime - normalizedRun.startTime,
    }));
    const pausedDurationMs = pauseIntervals.reduce(
      (sum, interval) => sum + Math.max(0, interval.endMs - interval.startMs),
      0,
    );
    const maxSpeed = normalizedRun.gpsPoints.reduce(
      (max, point) => (point.speed != null ? Math.max(max, point.speed) : max),
      0,
    );

    const maxSmoothedSpeed = normalizedRun.speedSeries.reduce(
      (max, point) =>
        point.speedMps != null ? Math.max(max, point.speedMps) : max,
      0,
    );

    const id = `${normalizedRun.startTime}`;
    useWorkoutStore.getState().addWorkout({
      id,
      name: normalizedRun.locationName
        ? `Run at ${normalizedRun.locationName}`
        : `Run on ${new Date(normalizedRun.startTime).toLocaleDateString()}`,
      date: new Date(normalizedRun.startTime).toISOString(),
      startTime: normalizedRun.startTime,
      endTime,
      duration,
      distance: distanceM,
      avgPace,
      maxSpeed: Math.max(maxSpeed, maxSmoothedSpeed),
      gpsPoints: normalizedRun.gpsPoints,
      speedSeries: normalizedRun.speedSeries,
      pauseIntervals,
      routeCoords: normalizedRun.gpsPoints.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
      pausedDuration: Math.round(pausedDurationMs / 1000),
      createdAt: endTime,
      updatedAt: endTime,
    });

    set({
      status: "idle",
      activeRun: null,
      metrics: initialMetrics,
    });

    return id;
  },

  addGpsPoint: (point) =>
    set((state) => {
      if (!state.activeRun) return state;
      return {
        activeRun: {
          ...state.activeRun,
          gpsPoints: [...state.activeRun.gpsPoints, point],
        },
      };
    }),

  updateMetrics: (metrics) =>
    set((state) => ({
      metrics: { ...state.metrics, ...metrics },
    })),

  reset: () => {
    stopTimer();
    stopGpsWatch();
    set({
      status: "idle",
      activeRun: null,
      metrics: initialMetrics,
    });
  },
}));
