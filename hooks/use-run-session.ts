import { useTrackingStore } from "@/stores/trackingStore";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";

export type RunState = "idle" | "running" | "paused";

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
  const runState = useTrackingStore((s) => s.status);
  const activeRun = useTrackingStore((s) => s.activeRun);
  const metrics = useTrackingStore((s) => s.metrics);
  const startRun = useTrackingStore((s) => s.startRun);
  const pauseRun = useTrackingStore((s) => s.pauseRun);
  const resumeRun = useTrackingStore((s) => s.resumeRun);
  const endRun = useTrackingStore((s) => s.endRun);

  const routeCoords = useMemo(
    () =>
      activeRun?.gpsPoints.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })) ?? [],
    [activeRun?.gpsPoints],
  );

  const handleStart = useCallback(async () => {
    const hasPermission = await startRun(locationName);
    if (!hasPermission) {
      return;
    }
  }, [locationName, startRun]);

  const handlePause = useCallback(() => {
    pauseRun();
  }, [pauseRun]);

  const handleResume = useCallback(async () => {
    await resumeRun();
  }, [resumeRun]);

  const handleEnd = useCallback(() => {
    const id = endRun();
    if (id) {
      router.push(`/session/${id}?isNew=1` as never);
    }
  }, [endRun]);

  return {
    runState,
    elapsed: metrics.duration,
    distanceKm: metrics.distance,
    routeCoords,
    handleStart,
    handlePause,
    handleResume,
    handleEnd,
  };
}
