---
name: workout-tracking
description: "Skill for implementing running workout tracking features, metrics calculation, and data persistence"
---

# Workout Tracking Skill

Implement running workout tracking features including GPS data collection, real-time metrics calculation, data persistence, and workout history management.

## Role

You are an expert in building fitness tracking systems. You understand sports science principles, GPS data handling, performance calculations, and how to build robust, resilient tracking systems for running applications.

## Objectives

When implementing workout tracking, you will:

1. **Set up GPS tracking infrastructure** - Collect location data, handle permissions, optimize battery usage
2. **Calculate running metrics** - Pace, distance, elevation, heart rate zones, effort estimation
3. **Persist workout data** - Save to local database, sync to cloud, handle offline scenarios
4. **Display real-time metrics** - Update UI smoothly without janky frame drops
5. **Provide workout history** - Query, filter, aggregate workout data
6. **Handle edge cases** - GPS signal loss, pauses, extreme conditions

## Core Implementation Areas

### 1. GPS Data Collection

**Location Permission Handling**

```typescript
// Permissions flow
1. Request foreground permission (during active tracking)
2. Request background permission (for long workouts)
3. Handle permission denial gracefully
4. Re-request with education when denied

// Example
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  Alert.alert(
    'Location permission required',
    'Enable location to track your workouts'
  );
  return;
}
```

**Real-time Location Tracking**

```typescript
// Watch position with configuration
const { status } = await Location.watchPositionAsync(
  {
    accuracy: Location.Accuracy.Best, // For running accuracy
    timeInterval: 1000, // Update every second
    distanceInterval: 5, // Or every 5 meters
  },
  (location) => {
    // Handle new location data
    recordGpsPoint({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    });
  },
);

// Cleanup on unmount
return () => status?.remove();
```

**GPS Data Validation**

```typescript
// Filter out invalid/noisy GPS points
const isValidGpsPoint = (point: GpsPoint, previousPoint: GpsPoint): boolean => {
  // Check for unrealistic speed (>50 km/h probably not running)
  const distance = calculateHaversineDistance(previousPoint, point);
  const timeDelta = (point.timestamp - previousPoint.timestamp) / 1000; // seconds
  const speed = (distance / timeDelta) * 3.6; // convert to km/h

  if (speed > 50) return false; // Probably GPS error

  // Check accuracy (>50m is suspect)
  if (point.accuracy && point.accuracy > 50) return false;

  // Check for duplicate/same location
  if (distance < 0.001) return false;

  return true;
};

// Apply validation
const validPoints = gpsPoints.filter((point, idx) => {
  if (idx === 0) return true;
  return isValidGpsPoint(point, gpsPoints[idx - 1]);
});
```

### 2. Metrics Calculation

**Distance Calculation**

```typescript
// Haversine formula for accurate GPS distance
const calculateHaversineDistance = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number },
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate total distance from points
const calculateDistance = (points: GpsPoint[]): number => {
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    distance += calculateHaversineDistance(points[i - 1], points[i]);
  }
  return distance; // in km
};
```

**Pace Calculation**

```typescript
// Pace = time / distance
const calculatePace = (distanceKm: number, timeSeconds: number): number => {
  if (distanceKm <= 0 || timeSeconds <= 0) {
    throw new Error("Invalid pace inputs");
  }
  return timeSeconds / distanceKm; // seconds per km
};

// Format pace for display
const formatPace = (secondsPerKm: number): string => {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Rolling average pace (smooths out variations)
const calculateRollingPace = (
  splits: Split[],
  windowSize: number = 5,
): number[] => {
  return splits.map((_, idx) => {
    const window = splits.slice(Math.max(0, idx - windowSize), idx + 1);
    const totalDistance = window.reduce((sum, s) => sum + s.distance, 0);
    const totalTime = window.reduce((sum, s) => sum + s.time, 0);
    return calculatePace(totalDistance, totalTime);
  });
};
```

**Elevation Analysis**

```typescript
// Filter elevation noise (median filter)
const smoothElevation = (
  elevations: number[],
  windowSize: number = 5,
): number[] => {
  return elevations.map((_, idx) => {
    const start = Math.max(0, idx - Math.floor(windowSize / 2));
    const end = Math.min(elevations.length, start + windowSize);
    const window = elevations.slice(start, end).sort((a, b) => a - b);
    return window[Math.floor(window.length / 2)]; // Median
  });
};

// Calculate elevation gain/loss
const calculateElevationMetrics = (elevations: number[]) => {
  const smoothed = smoothElevation(elevations);
  let gain = 0;
  let loss = 0;

  for (let i = 1; i < smoothed.length; i++) {
    const delta = smoothed[i] - smoothed[i - 1];
    if (delta > 0) gain += delta;
    else loss += Math.abs(delta);
  }

  return {
    gain: Math.round(gain),
    loss: Math.round(loss),
    max: Math.max(...smoothed),
    min: Math.min(...smoothed),
  };
};

// Average grade (slope)
const calculateAverageGrade = (
  elevationGain: number,
  distanceKm: number,
): number => {
  if (distanceKm <= 0) return 0;
  return (elevationGain / (distanceKm * 1000)) * 100; // percentage
};
```

**Heart Rate Zone Classification**

```typescript
// Zone thresholds (percentage of max HR)
const HR_ZONES = {
  z1: { min: 0.5, max: 0.6, name: "Recovery" },
  z2: { min: 0.6, max: 0.7, name: "Aerobic" },
  z3: { min: 0.7, max: 0.8, name: "Tempo" },
  z4: { min: 0.8, max: 0.9, name: "Threshold" },
  z5: { min: 0.9, max: 1.0, name: "Max Effort" },
};

const getHeartRateZone = (
  currentHr: number,
  maxHr: number,
): keyof typeof HR_ZONES => {
  const percentage = currentHr / maxHr;
  for (const [zone, { min, max }] of Object.entries(HR_ZONES)) {
    if (percentage >= min && percentage < max) {
      return zone as keyof typeof HR_ZONES;
    }
  }
  return "z5";
};
```

### 3. Data Persistence

**Local Database Schema**

```typescript
// SQLite database with Expo
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("gostrich.db");

// Initialize schema
const initializeDatabase = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER NOT NULL,
      distance REAL NOT NULL,
      duration INTEGER NOT NULL,
      elevationGain INTEGER,
      elevationLoss INTEGER,
      avgPace REAL,
      avgHeartRate INTEGER,
      notes TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gps_points (
      id TEXT PRIMARY KEY,
      workoutId TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude REAL,
      accuracy REAL,
      timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_workouts_userId ON workouts(userId);
    CREATE INDEX IF NOT EXISTS idx_gps_points_workoutId ON gps_points(workoutId);
  `);
};

// Save workout
const saveWorkout = async (workout: Workout) => {
  const id = uuid.v4();
  await db.runAsync(
    `INSERT INTO workouts (id, userId, type, startTime, endTime, distance, duration, 
     elevationGain, elevationLoss, avgPace, avgHeartRate, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      workout.userId,
      workout.type,
      workout.startTime.getTime(),
      workout.endTime.getTime(),
      workout.metrics.distance,
      workout.metrics.movingTime,
      workout.metrics.elevation.gain,
      workout.metrics.elevation.loss,
      workout.metrics.pace,
      workout.metrics.heartRate?.average,
      workout.notes,
      Date.now(),
      Date.now(),
    ],
  );

  // Save GPS points
  for (const point of workout.gpsTrack) {
    await db.runAsync(
      `INSERT INTO gps_points (id, workoutId, latitude, longitude, altitude, accuracy, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid.v4(),
        id,
        point.latitude,
        point.longitude,
        point.altitude,
        point.accuracy,
        point.timestamp,
      ],
    );
  }

  return id;
};
```

**Cloud Sync**

```typescript
// Sync completed workouts to backend
const syncWorkoutToCloud = async (workoutId: string) => {
  try {
    const workout = await getWorkoutFromLocal(workoutId);
    if (!workout) return;

    const response = await fetch("https://api.gostrich.app/workouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify(workout),
    });

    if (!response.ok) throw new Error("Sync failed");

    // Mark as synced
    await db.runAsync(
      `UPDATE workouts SET synced = 1, syncedAt = ? WHERE id = ?`,
      [Date.now(), workoutId],
    );
  } catch (error) {
    logger.error("Sync failed:", error);
    // Retry on next sync window
  }
};

// Background sync queue
const setupBackgroundSync = () => {
  setInterval(async () => {
    const unsynced = await db.allAsync(
      `SELECT id FROM workouts WHERE synced = 0 LIMIT 10`,
    );

    for (const row of unsynced) {
      await syncWorkoutToCloud(row.id);
    }
  }, 60000); // Every minute
};
```

### 4. Real-time UI Updates

**Smooth Metrics Updates**

```typescript
// Update metrics every second without janky rendering
const useActiveWorkoutMetrics = () => {
  const [metrics, setMetrics] = useState<WorkoutMetrics>(initialMetrics);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const now = Date.now();
        const elapsed = now - lastUpdateRef.current;
        lastUpdateRef.current = now;

        return {
          ...prev,
          movingTime: prev.movingTime + Math.round(elapsed / 1000),
          pace: calculatePace(prev.distance, prev.movingTime),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};
```

### 5. Workout History

**Query & Filter**

```typescript
// Get recent workouts with filtering
const getWorkoutHistory = async (
  userId: string,
  filter: {
    startDate?: Date;
    endDate?: Date;
    type?: string[];
    limit?: number;
  } = {},
) => {
  let query = `SELECT * FROM workouts WHERE userId = ?`;
  const params: any[] = [userId];

  if (filter.startDate) {
    query += ` AND startTime >= ?`;
    params.push(filter.startDate.getTime());
  }

  if (filter.endDate) {
    query += ` AND endTime <= ?`;
    params.push(filter.endDate.getTime());
  }

  if (filter.type?.length) {
    query += ` AND type IN (${filter.type.map(() => "?").join(",")})`;
    params.push(...filter.type);
  }

  query += ` ORDER BY startTime DESC LIMIT ?`;
  params.push(filter.limit || 50);

  return db.allAsync(query, params);
};
```

**Weekly/Monthly Statistics**

```typescript
// Aggregate stats by week or month
const getWeeklyStats = async (userId: string, week: Date) => {
  const startOfWeek = getMonday(week);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const results = await db.allAsync(
    `SELECT 
      COUNT(*) as runCount,
      SUM(distance) as totalDistance,
      SUM(duration) as totalDuration,
      AVG(avgPace) as avgPace,
      MAX(distance) as longestRun,
      SUM(elevationGain) as totalElevation
    FROM workouts
    WHERE userId = ? AND startTime >= ? AND startTime < ?`,
    [userId, startOfWeek.getTime(), endOfWeek.getTime()],
  );

  return results[0];
};
```

## Success Criteria

Your work is complete when:

1. GPS tracking handles permissions and background execution
2. Distance/pace calculations are accurate and validated
3. Elevation analysis filters noise appropriately
4. Data persists reliably to local and cloud databases
5. Real-time UI updates are smooth (60 FPS target)
6. Workout history can be queried and aggregated
7. Edge cases (signal loss, pauses, extreme conditions) are handled
8. Battery usage is optimized for long workouts
9. Offline functionality works seamlessly
10. Data sync resolves conflicts gracefully
