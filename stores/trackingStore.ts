import { create } from "zustand";
import type { TrackingStatus, ActiveRun, TrackingMetrics } from "@/types/tracking";
import type { GpsPoint } from "@/types/workout";

interface TrackingState {
  status: TrackingStatus;
  activeRun: ActiveRun | null;
  metrics: TrackingMetrics;

  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  stopRun: () => void;
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

export const useTrackingStore = create<TrackingState>((set) => ({
  status: "idle",
  activeRun: null,
  metrics: initialMetrics,

  startRun: () =>
    set({
      status: "running",
      activeRun: {
        gpsPoints: [],
        startTime: Date.now(),
        pauses: [],
      },
      metrics: initialMetrics,
    }),

  pauseRun: () =>
    set((state) => {
      if (!state.activeRun) return state;
      return {
        status: "paused",
        activeRun: {
          ...state.activeRun,
          pauses: [
            ...state.activeRun.pauses,
            { startTime: Date.now(), endTime: 0 },
          ],
        },
      };
    }),

  resumeRun: () =>
    set((state) => {
      if (!state.activeRun) return state;
      const pauses = [...state.activeRun.pauses];
      if (pauses.length > 0) {
        pauses[pauses.length - 1] = {
          ...pauses[pauses.length - 1],
          endTime: Date.now(),
        };
      }
      return {
        status: "running",
        activeRun: { ...state.activeRun, pauses },
      };
    }),

  stopRun: () =>
    set({
      status: "idle",
      activeRun: null,
      metrics: initialMetrics,
    }),

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

  reset: () =>
    set({
      status: "idle",
      activeRun: null,
      metrics: initialMetrics,
    }),
}));
