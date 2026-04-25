import { useWorkoutStore } from "@/stores/workoutStore";
import type { GpsPoint } from "@/types/workout";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

export type RunState = "idle" | "running" | "paused";

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

export interface UseRunSessionResult {
  runState: RunState;
  elapsed: number;
  distanceKm: number;
  routeCoords: { latitude: number; longitude: number }[];
  handleStart: () => Promise<void>;
  handlePause: () => void;
  handleResume: () => Promise<void>;
  handleEnd: () => void;
}

export function useRunSession(
  locationName: string | null,
): UseRunSessionResult {
  const addWorkout = useWorkoutStore((s) => s.addWorkout);

  const [runState, setRunState] = useState<RunState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<Location.LocationSubscription | null>(null);
  const gpsPointsRef = useRef<GpsPoint[]>([]);
  const pauseStartRef = useRef<number | null>(null);
  const pauseIntervalsRef = useRef<{ startMs: number; endMs: number }[]>([]);
  const distanceRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const ensureForegroundPermission = useCallback(async (): Promise<boolean> => {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === Location.PermissionStatus.GRANTED) {
      return true;
    }

    if (!current.canAskAgain) {
      return false;
    }

    const requested = await Location.requestForegroundPermissionsAsync();
    return requested.status === Location.PermissionStatus.GRANTED;
  }, []);

  const startGpsWatch = useCallback(async () => {
    gpsWatchRef.current = await Location.watchPositionAsync(
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

        const prev = gpsPointsRef.current.at(-1);
        if (prev) {
          const d = haversine(prev, point);
          const timeDeltaS = (point.timestamp - prev.timestamp) / 1000;
          const speedKph = timeDeltaS > 0 ? (d / timeDeltaS) * 3600 : 0;
          if (d < 0.002 || speedKph > 50) return;
          distanceRef.current += d;
          setDistanceKm(distanceRef.current);
        }

        gpsPointsRef.current.push(point);
        setRouteCoords((prev) => [
          ...prev,
          { latitude: point.latitude, longitude: point.longitude },
        ]);
      },
    );
  }, []);

  const stopGpsWatch = useCallback(() => {
    gpsWatchRef.current?.remove();
    gpsWatchRef.current = null;
  }, []);

  const handleStart = useCallback(async () => {
    const hasPermission = await ensureForegroundPermission();
    if (!hasPermission) {
      return;
    }

    gpsPointsRef.current = [];
    pauseStartRef.current = null;
    pauseIntervalsRef.current = [];
    setRouteCoords([]);
    distanceRef.current = 0;
    setDistanceKm(0);
    setElapsed(0);
    startTimeRef.current = Date.now();
    setRunState("running");
    startTimer();
    await startGpsWatch();
  }, [startTimer, startGpsWatch, ensureForegroundPermission]);

  const handlePause = useCallback(() => {
    pauseStartRef.current = Date.now();
    setRunState("paused");
    stopTimer();
    stopGpsWatch();
  }, [stopTimer, stopGpsWatch]);

  const handleResume = useCallback(async () => {
    if (pauseStartRef.current != null) {
      pauseIntervalsRef.current.push({
        startMs: pauseStartRef.current - startTimeRef.current,
        endMs: Date.now() - startTimeRef.current,
      });
      pauseStartRef.current = null;
    }
    setRunState("running");
    startTimer();
    await startGpsWatch();
  }, [startTimer, startGpsWatch]);

  const handleEnd = useCallback(() => {
    stopTimer();
    stopGpsWatch();

    const endTime = Date.now();
    if (pauseStartRef.current != null) {
      pauseIntervalsRef.current.push({
        startMs: pauseStartRef.current - startTimeRef.current,
        endMs: endTime - startTimeRef.current,
      });
      pauseStartRef.current = null;
    }

    const points = gpsPointsRef.current;
    const speedSeries = points.map((point) => ({
      t: point.timestamp - startTimeRef.current,
      speedMps: point.speed,
    }));
    const pauseIntervals = pauseIntervalsRef.current;
    const pausedDurationMs = pauseIntervals.reduce(
      (sum, interval) => sum + Math.max(0, interval.endMs - interval.startMs),
      0,
    );
    const distM = distanceRef.current * 1000;
    const elapsedSnap = elapsed;
    const avgPace =
      elapsedSnap > 0 && distanceRef.current > 0
        ? elapsedSnap / distanceRef.current
        : 0;
    const maxSpeed = points.reduce(
      (max, p) => (p.speed != null ? Math.max(max, p.speed) : max),
      0,
    );

    const id = `${startTimeRef.current}`;
    addWorkout({
      id,
      name: locationName
        ? `Run at ${locationName}`
        : `Run on ${new Date(startTimeRef.current).toLocaleDateString()}`,
      date: new Date(startTimeRef.current).toISOString(),
      startTime: startTimeRef.current,
      endTime,
      duration: elapsedSnap,
      distance: distM,
      avgPace,
      maxSpeed,
      gpsPoints: points,
      speedSeries,
      pauseIntervals,
      routeCoords: points.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
      })),
      pausedDuration: Math.round(pausedDurationMs / 1000),
      createdAt: endTime,
      updatedAt: endTime,
    });

    setRunState("idle");
    setElapsed(0);
    setDistanceKm(0);
    setRouteCoords([]);
    gpsPointsRef.current = [];
    pauseIntervalsRef.current = [];
    distanceRef.current = 0;

    router.push(`/session/${id}?isNew=1` as never);
  }, [stopTimer, stopGpsWatch, elapsed, locationName, addWorkout]);

  return {
    runState,
    elapsed,
    distanceKm,
    routeCoords,
    handleStart,
    handlePause,
    handleResume,
    handleEnd,
  };
}
