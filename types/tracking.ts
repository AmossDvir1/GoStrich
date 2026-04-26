import type { GpsPoint } from "./workout";

export type TrackingStatus = "idle" | "running" | "paused";

export interface Pause {
  startTime: number;
  endTime: number;
}

export interface ActiveRun {
  gpsPoints: GpsPoint[];
  startTime: number;
  pauses: Pause[];
  speedSeries: { t: number; speedMps: number | null }[];
  locationName: string | null;
}

export interface TrackingMetrics {
  distance: number;
  duration: number;
  currentPace: number;
  avgPace: number;
  currentSpeed: number;
}
