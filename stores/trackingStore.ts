import { useWorkoutStore } from "@/stores/workoutStore";
import type {
    ActiveRun,
    TrackingMetrics,
    TrackingStatus,
} from "@/types/tracking";
import type { GpsPoint } from "@/types/workout";
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
  const currentPace = currentSpeedMps > 0 ? 1000 / (currentSpeedMps * 60) : 0;

  return {
    distance: distanceKm,
    duration,
    avgPace,
    currentPace,
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

          const prev = state.activeRun.gpsPoints.at(-1);
          let distanceKm = state.metrics.distance;
          let speedMps = point.speed ?? 0;

          if (prev) {
            const dKm = haversine(prev, point);
            const timeDeltaS = (point.timestamp - prev.timestamp) / 1000;
            const speedKph = timeDeltaS > 0 ? (dKm / timeDeltaS) * 3600 : 0;

            if (dKm < 0.002 || speedKph > 50) {
              return state;
            }

            if (speedMps <= 0) {
              speedMps = speedKph / 3.6;
            }
            distanceKm += dKm;
          }

          return {
            activeRun: {
              ...state.activeRun,
              gpsPoints: [...state.activeRun.gpsPoints, point],
              speedSeries: [
                ...state.activeRun.speedSeries,
                {
                  t: point.timestamp - state.activeRun.startTime,
                  speedMps: point.speed,
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
      maxSpeed,
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
