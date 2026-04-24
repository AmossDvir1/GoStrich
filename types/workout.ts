export interface GpsPoint {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
}

export interface SpeedPoint {
  /** Milliseconds since run start (relative timeline for charts). */
  t: number;
  /** Raw speed from location updates in meters per second. */
  speedMps: number | null;
}

export interface PauseInterval {
  startMs: number;
  endMs: number;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  avgPace: number;
  maxSpeed: number;
  gpsPoints: GpsPoint[];
  speedSeries?: SpeedPoint[];
  pauseIntervals?: PauseInterval[];
  /** Downsampled lat/lon pairs used for map display — stored in WorkoutSummary */
  routeCoords: { latitude: number; longitude: number }[];
  pausedDuration: number;
  createdAt: number;
  updatedAt: number;
}

export type WorkoutSummary = Omit<Workout, "gpsPoints">;
