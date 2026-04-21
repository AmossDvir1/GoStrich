export interface GpsPoint {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
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
  /** Downsampled lat/lon pairs used for map display — stored in WorkoutSummary */
  routeCoords: { latitude: number; longitude: number }[];
  pausedDuration: number;
  createdAt: number;
  updatedAt: number;
}

export type WorkoutSummary = Omit<Workout, "gpsPoints">;
