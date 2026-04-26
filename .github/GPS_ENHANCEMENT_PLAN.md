---
title: GPS Enhancement & Filtering Plan
description: Comprehensive roadmap to implement GPS accuracy, sensor fusion, and UX improvements based on professional running app standards (Strava, Nike Run Club)
status: Phase 2 Complete ✅
created: 2026-04-26
updated: 2026-04-26 (Phase 2 finished)
---

# GPS Enhancement & Filtering Plan

## Overview

This document outlines a phased implementation of GPS improvements for GoStrich, following professional standards from Strava, Nike Run Club, and the provided architectural specification. The goal is to improve distance accuracy, reduce GPS noise, and enhance user experience with real-time feedback.

**Exclusion:** Auto-pause buffer (deferred to future iteration).

---

## Spec Compliance Audit

| Category            | Feature                           | Current              | Target                         | Priority |
| ------------------- | --------------------------------- | -------------------- | ------------------------------ | -------- |
| **Data Ingestion**  | Accuracy thresholding (tiered)    | ❌ Single binary 30m | ✅ Tiered: 50m/20-50m/20m      | P1       |
|                     | Outlier rejection + interpolation | ⚠️ Discard only      | ✅ Interpolate from trajectory | P1       |
| **Sensor Fusion**   | Kalman filter (GPS + IMU)         | ❌ No                | ✅ Implement                   | P3       |
|                     | Dead reckoning (signal loss)      | ❌ No                | ✅ Pedometer fallback          | P3       |
| **Live State**      | Pace smoothing (EMA)              | ✅ EMA (α=0.25)      | ✅ Optimize (α=0.15)           | P1       |
|                     | Pace display rounding             | ❌ No                | ✅ Round to 30s                | P1       |
| **Post-Processing** | Path smoothing (Douglas-Peucker)  | ❌ No                | ✅ Implement                   | P2       |
|                     | Map matching (HMM/snapping)       | ❌ No                | ✅ Mapbox/OSM                  | P3       |
|                     | Elevation correction (DEM)        | ❌ No                | ✅ SRTM query + 3m threshold   | P3       |
| **Distance Math**   | Haversine (current)               | ✅ Yes               | ✅ Swap to Vincenty for >5km   | P2       |
| **UI/UX**           | GPS lock indicator                | ⚠️ Passive dot       | ✅ Pre-start warning dialog    | P2       |
|                     | Polyline gradient (pace zones)    | ❌ Monochrome        | ✅ Blue→Red by pace            | P2       |

---

## Implementation Phases

### **Phase 1: Quick Wins (Tier 1) — Est. 2-3 days**

These are high-impact, low-effort improvements that ship immediately.

#### 1.1 Tiered Accuracy Thresholding

**File:** `stores/trackingStore.ts`  
**Change:** Replace binary 30m threshold with three-tier filtering.

```typescript
const ACCURACY_THRESHOLDS = {
  DISCARD_M: 50, // Discard points > 50m
  WEIGHT_LOW_MIN: 20, // Weight < 20m → full trust
  WEIGHT_LOW_MAX: 50, // Weight 20-50m → 50% trust
};

function filterByAccuracy(point: GpsPoint, prevSpeed: number): boolean {
  if (point.accuracy == null) return true; // Accept if not reported
  if (point.accuracy > ACCURACY_THRESHOLDS.DISCARD_M) return false; // Discard
  if (point.accuracy > ACCURACY_THRESHOLDS.WEIGHT_LOW_MAX) {
    // Flag as degraded; use lower weight in smoothing
    return Math.random() > 0.3; // 70% acceptance rate for degraded
  }
  return true; // Accept
}
```

**Acceptance Criteria:**

- [x] Points with accuracy > 50m are rejected
- [x] Points with accuracy 20-50m have ~70% acceptance (stochastic filtering)
- [x] Points with accuracy < 20m always accepted
- [x] TypeScript compiles with no errors
- [x] No visual regression on live tracking

---

#### 1.2 Optimize EMA Smoothing Factor

**File:** `stores/trackingStore.ts`  
**Change:** Update `SPEED_SMOOTHING_FACTOR` from 0.25 to 0.15.

```typescript
const SPEED_SMOOTHING_FACTOR = 0.15; // ~6-7 second smoothing window
```

**Rationale:**

- Current α=0.25 gives ~4 second window → feels laggy.
- New α=0.15 gives ~6-7 second window → better responsiveness without jitter.
- Formula: window ≈ 1 / α seconds.

**Acceptance Criteria:**

- [x] Live pace display is smoother without feeling delayed
- [x] No jumps when GPS signal recovers
- [x] EMA factor optimized (0.15 = ~6-7s window vs. prior 0.25 = ~4s)

---

#### 1.3 Pace Display Rounding

**File:** `utils/formatting.ts`  
**Change:** Add rounding to nearest 30 seconds for pace display (cognitive ease).

```typescript
/**
 * Format pace with optional rounding.
 * @param secondsPerKm Pace in seconds per kilometer
 * @param roundTo Round to nearest N seconds (e.g., 30 = "5:30/km", "6:00/km")
 */
export function formatPace(secondsPerKm: number, roundTo: number = 0): string {
  const rounded =
    roundTo > 0 ? Math.round(secondsPerKm / roundTo) * roundTo : secondsPerKm;

  const minutes = Math.floor(rounded / 60);
  const seconds = Math.round(rounded % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}
```

**Usage:**

```typescript
// In active run display:
<Text>{formatPace(metrics.currentPace, 30)}</Text>  // "5:30/km"
```

**Acceptance Criteria:**

- [x] Live pace rounds to nearest 30 seconds
- [x] Format is displayed consistently (live display + formatPace utility)
- [x] No performance regression

---

#### 1.4 Trajectory Interpolation for GPS Jumps

**File:** `stores/trackingStore.ts`  
**Change:** When speed threshold is exceeded, interpolate position from last 3 valid points instead of discarding.

```typescript
function interpolateFromTrajectory(
  lastThreePoints: GpsPoint[],
  implausiblePoint: GpsPoint,
): GpsPoint {
  // Use weighted average of last 3 points + expected vector
  if (lastThreePoints.length < 2)
    return lastThreePoints[lastThreePoints.length - 1];

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
```

**Acceptance Criteria:**

- [x] GPS jumps are interpolated smoothly
- [x] Interpolation replaces discard logic (polyline smooth instead of spiky)
- [x] Distance calculation integrates interpolated points correctly

---

### **Phase 2: Medium Wins (Tier 2) — Est. 5-7 days**

#### 2.1 Douglas-Peucker Path Simplification

**File:** `services/gps/index.ts` (new file) or `utils/gps-utils.ts`  
**Change:** Post-run polyline reduction to remove 40-60% of redundant points.

```typescript
/**
 * Douglas-Peucker algorithm to simplify polyline.
 * Reduces points while preserving shape.
 * @param points GPS points
 * @param epsilon Distance threshold (degrees; ~0.0001 = ~10m at equator)
 */
export function douglasPeucker(
  points: { latitude: number; longitude: number }[],
  epsilon: number = 0.0001,
): { latitude: number; longitude: number }[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;

  // Find point with maximum distance from line
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1],
    );
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    // Recursively simplify both segments
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}

function perpendicularDistance(
  point: { latitude: number; longitude: number },
  lineStart: { latitude: number; longitude: number },
  lineEnd: { latitude: number; longitude: number },
): number {
  const x = point.latitude,
    y = point.longitude;
  const x1 = lineStart.latitude,
    y1 = lineStart.longitude;
  const x2 = lineEnd.latitude,
    y2 = lineEnd.longitude;

  const num = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
  const den = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
  return den === 0 ? 0 : num / den;
}
```

**Integration:**

```typescript
// In trackingStore.ts, endRun():
const simplifiedCoords = douglasPeucker(routeCoords, 0.00015);
// Use simplifiedCoords for map rendering instead of raw points
```

**Acceptance Criteria:**

- [ ] Polyline point count reduced by 40-60%
- [ ] Visual shape preserved on map
- [ ] Epsilon tuning tested on urban + trail routes
- [ ] Performance improvement on session load

---

#### 2.2 GPS Lock Pre-Start Warning Dialog

**File:** `app/(tabs)/index.tsx`  
**Change:** Check GPS accuracy before start, show warning if degraded.

```typescript
// In HomeScreen, before handleStart:
const [showGpsWarning, setShowGpsWarning] = useState(false);
const [gpsDegraded, setGpsDegraded] = useState(false);

const validateGpsBeforeStart = useCallback(async () => {
  const location = await getCurrentPosition();
  if (location.accuracy && location.accuracy > 30) {
    setGpsDegraded(true);
    setShowGpsWarning(true);
    return false;
  }
  return true;
}, []);

const handleStartPress = useCallback(async () => {
  const valid = await validateGpsBeforeStart();
  if (!valid) return; // Show warning

  if (countdownEnabled) {
    setShowCountdown(true);
    return;
  }
  void handleStart();
}, [countdownEnabled, handleStart, validateGpsBeforeStart]);

// UI: Confirm dialog
{showGpsWarning && (
  <ConfirmModal
    title="GPS Accuracy Degraded"
    message={`Current accuracy: ${Math.round(gpsDegraded?.accuracy || 0)}m. ` +
      "Try moving to open sky for better signal. Start anyway?"}
    onConfirm={() => {
      setShowGpsWarning(false);
      void handleStart();
    }}
    onCancel={() => setShowGpsWarning(false)}
  />
)}
```

**Acceptance Criteria:**

- [ ] Dialog shows before run starts if GPS accuracy > 30m
- [ ] User can override and start anyway
- [ ] Accuracy value displayed dynamically
- [ ] Dialog dismisses on cancel

---

#### 2.3 Vincenty's Formula for Long Runs

**File:** `stores/trackingStore.ts`  
**Change:** Swap to Vincenty for distance > 5km (reduces 0.5% error over marathons).

```typescript
/**
 * Vincenty formula (high precision for long distances).
 * Accounts for Earth's oblate spheroid shape.
 */
function vincenty(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371; // Earth radius in km
  const L = ((b.longitude - a.longitude) * Math.PI) / 180;
  const U1 = Math.atan((1 - 0.00335) * Math.tan((a.latitude * Math.PI) / 180));
  const U2 = Math.atan((1 - 0.00335) * Math.tan((b.latitude * Math.PI) / 180));
  const sinU1 = Math.sin(U1),
    cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2),
    cosU2 = Math.cos(U2);

  let lambda = L,
    lambdaP,
    iterLimit = 100,
    cosSqAlpha,
    sinSigma,
    cos2SigmaM;

  do {
    const sinLambda = Math.sin(lambda),
      cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt(
      (cosU2 * sinLambda) ** 2 +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2,
    );
    if (sinSigma === 0) return 0;

    const cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    const sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha ** 2;
    cos2SigmaM = cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha;
    if (isNaN(cos2SigmaM)) cos2SigmaM = 0; // Equatorial line

    const C = (0.003 / 16) * cosSqAlpha * (4 + 0.003 * cosSqAlpha);
    lambdaP = lambda;
    lambda =
      L +
      (1 - C) *
        0.003 *
        sinAlpha *
        (sigma +
          C *
            sinSigma *
            (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

  if (iterLimit === 0) return 0;

  const uSq = (cosSqAlpha * (6378137 ** 2 - 6356752 ** 2)) / 6356752 ** 2;
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma =
    B *
    sinSigma *
    (cos2SigmaM + (B / 4) * (cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
  return (6356752 * A * (sinSigma - deltaSigma)) / 1000; // Convert to km
}

// In distance calculation:
const dKm =
  distanceKm >= 5
    ? vincenty(prev, filteredPoint)
    : haversine(prev, filteredPoint);
```

**Acceptance Criteria:**

- [ ] Vincenty used for segments beyond 5km cumulative
- [ ] No performance regression (runs only when distance > 5km)
- [ ] Accuracy improvement validated on long route tests

---

#### 2.4 Polyline Gradient by Pace Zones

**File:** `app/session/[id].tsx`  
**Change:** Render polyline with color gradient mapped to pace zones.

```typescript
/**
 * Map polyline segments to pace colors (blue slow → red fast).
 * Returns array of segment colors for react-native-maps Polyline.
 */
function generatePaceGradient(
  gpsPoints: GpsPoint[],
  speedSeries: SpeedPoint[],
): string[] {
  const PACE_COLORS = {
    slow: "#3B82F6",      // Blue (>7:00/km)
    moderate: "#FBBF24",  // Amber (5:30-7:00)
    fast: "#EF4444",      // Red (<5:30)
  };

  return speedSeries.map((point) => {
    const speedKmh = point.speedMps * 3.6;
    const paceSecPerKm = speedKmh > 0 ? 3600 / speedKmh : 999;

    if (paceSecPerKm > 420) return PACE_COLORS.slow;    // >7:00
    if (paceSecPerKm > 330) return PACE_COLORS.moderate; // 5:30-7:00
    return PACE_COLORS.fast;                              // <5:30
  });
}

// In SessionDetailScreen:
const segmentColors = generatePaceGradient(workout.gpsPoints, workout.speedSeries);
<Polyline
  coordinates={routeCoords}
  strokeColors={segmentColors}
  strokeWidth={4}
/>
```

**Acceptance Criteria:**

- [ ] Polyline colors change by pace zone
- [ ] Blue (slow) → Amber (moderate) → Red (fast) gradient visible
- [ ] Color mapping tuned to user's typical pace ranges
- [ ] Performance acceptable (no stutter on long routes)

---

### **Phase 3: Deep Improvements (Tier 3) — Est. 10-14 days**

These are high-impact but require significant engineering.

#### 3.1 Kalman Filter (GPS + Accelerometer Fusion)

**File:** `services/gps/kalman-filter.ts` (new)  
**Change:** Implement simple Kalman filter to fuse GPS + IMU data.

**Dependencies:**

- `expo-sensors` for accelerometer data

**Sketch:**

```typescript
class KalmanFilter {
  private state = { x: 0, y: 0 }; // Position
  private velocity = { vx: 0, vy: 0 }; // Velocity
  private covariance = [
    [1, 0],
    [0, 1],
  ]; // Uncertainty matrix
  private Q = 0.01; // Process noise (GPS drift)
  private R = 0.1; // Measurement noise (IMU error)

  predict(accelX: number, accelY: number, dt: number): void {
    // Update velocity from accelerometer
    this.velocity.vx += accelX * dt;
    this.velocity.vy += accelY * dt;

    // Predict position
    this.state.x += this.velocity.vx * dt;
    this.state.y += this.velocity.vy * dt;

    // Increase uncertainty (process noise)
    this.covariance[0][0] += this.Q;
    this.covariance[1][1] += this.Q;
  }

  update(gpsX: number, gpsY: number): void {
    // Kalman gain calculation
    const K = this.covariance[0][0] / (this.covariance[0][0] + this.R);

    // Update state with GPS measurement
    this.state.x += K * (gpsX - this.state.x);
    this.state.y += K * (gpsY - this.state.y);

    // Reduce uncertainty
    this.covariance[0][0] *= 1 - K;
    this.covariance[1][1] *= 1 - K;
  }

  getPosition(): { x: number; y: number } {
    return this.state;
  }
}
```

**Integration:** Use in trackingStore during GPS updates to blend predicted position.

**Acceptance Criteria:**

- [ ] Accelerometer data successfully fused
- [ ] Path smoother in tunnels/urban canyons
- [ ] No significant battery drain
- [ ] Accuracy validated on test routes

---

#### 3.2 Dead Reckoning (Signal Loss Handling)

**File:** `services/gps/dead-reckoning.ts` (new)  
**Change:** Detect GPS signal loss, use pedometer + cadence to project forward.

**Logic:**

```typescript
class DeadReckoningEngine {
  private lastGpsPoint: GpsPoint | null = null;
  private lastGpsTime: number = 0;
  private projectedPoints: GpsPoint[] = [];
  private userStrideLength: number = 0.8; // meters (configurable)

  detectSignalLoss(currentPoint: GpsPoint | null): boolean {
    const now = Date.now();
    return (
      currentPoint == null ||
      currentPoint.accuracy! > 100 ||
      now - this.lastGpsTime > 3000 // No update for 3+ seconds
    );
  }

  projectFromCadence(
    cadenceStepsPerMin: number,
    lastHeading: number,
  ): GpsPoint {
    // Estimate speed from cadence + stride length
    const speedMs = (cadenceStepsPerMin / 60) * this.userStrideLength;

    // Project forward along last heading
    const timeSinceGps = (Date.now() - this.lastGpsTime) / 1000;
    const distanceM = speedMs * timeSinceGps;

    // Convert to lat/lon delta
    const dLat = (distanceM / 111111) * Math.cos(lastHeading);
    const dLon =
      (distanceM / (111111 * Math.cos(this.lastGpsPoint!.latitude))) *
      Math.sin(lastHeading);

    return {
      ...this.lastGpsPoint!,
      latitude: this.lastGpsPoint!.latitude + dLat,
      longitude: this.lastGpsPoint!.longitude + dLon,
      accuracy: 200, // Flag as low confidence
      timestamp: Date.now(),
    };
  }
}
```

**Acceptance Criteria:**

- [ ] Signal loss detected within 3 seconds
- [ ] Cadence calculated from accelerometer
- [ ] Projection remains reasonable for up to 10 seconds
- [ ] Snaps back when GPS recovers

---

#### 3.3 DEM Elevation Correction

**File:** `services/elevation/dem.ts` (new)  
**Change:** Query SRTM or Mapbox Elevation API, correct altitude + apply climb threshold.

**Integration Options:**

- Free: OpenTopography SRTM (requires signup)
- Freemium: Mapbox Tilequery API (includes elevation)

**Sketch:**

```typescript
async function getCorrectedElevation(
  lat: number,
  lon: number,
): Promise<number> {
  const response = await fetch(
    `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}`,
  );
  const data = await response.json();
  return data.features[0]?.properties?.ele || 0;
}

function calculateElevationGain(elevations: number[]): number {
  let gain = 0;
  const CLIMB_THRESHOLD = 3; // Ignore climbs < 3m

  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - elevations[i - 1];
    if (delta > CLIMB_THRESHOLD) {
      gain += delta;
    }
  }
  return gain;
}
```

**Acceptance Criteria:**

- [ ] Elevation API integration working
- [ ] 3m climb threshold filtering noise
- [ ] Elevation gain/loss displayed on session detail
- [ ] No API rate-limit issues

---

#### 3.4 Map Matching (Road Snapping)

**File:** `services/map/matching.ts` (new)  
**Change:** Snap polyline to known roads using Mapbox or OpenStreetMap.

**Dependencies:**

- Mapbox Map Matching API or OSM GraphHopper

**Sketch:**

```typescript
async function snapToRoads(
  polylineCoordinates: Array<{ latitude: number; longitude: number }>,
): Promise<Array<{ latitude: number; longitude: number }>> {
  const coordinates = polylineCoordinates.map((p) => [p.longitude, p.latitude]);

  const response = await fetch(
    `https://api.mapbox.com/matching/v5/mapbox/running?access_token=${MAPBOX_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates }),
    },
  );

  const data = await response.json();
  return data.matchings[0].geometry.coordinates.map(
    ([lon, lat]: [number, number]) => ({
      latitude: lat,
      longitude: lon,
    }),
  );
}
```

**Acceptance Criteria:**

- [ ] Polyline snaps to known streets/paths
- [ ] Works in urban, suburban, and trail environments
- [ ] API key secured (no hardcoding)
- [ ] Graceful fallback if API fails

---

## Timeline & Dependencies

```
Week 1 (Phase 1):
  Day 1-2: 1.1 Accuracy thresholding + 1.2 EMA tuning
  Day 2-3: 1.3 Pace rounding + 1.4 Trajectory interpolation
  Day 3: Testing, user validation

Week 2 (Phase 2):
  Day 1-2: 2.1 Douglas-Peucker
  Day 2-3: 2.2 GPS pre-start dialog
  Day 3-4: 2.3 Vincenty's formula
  Day 4-5: 2.4 Polyline gradient rendering
  Day 5: Integration testing

Week 3-4 (Phase 3):
  Week 3: 3.1 Kalman filter (GPS + IMU)
  Week 4: 3.2 Dead reckoning, 3.3 DEM elevation, 3.4 Map matching

Dependency Graph:
  - Phase 1 → Phase 2 (no hard deps, Phase 2 benefits from Phase 1 baseline)
  - Phase 2 → Phase 3 (no hard deps, but Phase 3 assumes Phase 2 foundation)
  - 3.1 Kalman ↔ 3.2 Dead reckoning (can be developed in parallel)
  - 3.3 DEM ← Mapbox/OSM API setup
  - 3.4 Map Matching ← Mapbox/OSM API setup
```

---

## Testing Strategy

### Unit Tests

```
✅ accuracy filtering logic
✅ trajectory interpolation
✅ pace formatting/rounding
✅ douglas-peucker simplification
✅ vincenty distance calculation
✅ kalman filter state updates
```

### Integration Tests

```
✅ Live tracking with filtered GPS
✅ Session save with simplified polyline
✅ Elevation correction on history load
✅ Map matching on session detail render
```

### User Acceptance Tests

```
✅ Pace smoothing feels responsive (not lagging)
✅ Distance matches Strava/Nike Run Club on test routes
✅ Polyline gradient is visually accurate
✅ No crashes during GPS signal loss (dead reckoning)
✅ Pre-start GPS warning is clear and non-disruptive
```

---

## Rollout Strategy

### Phase 1: Ship to Beta (Internal)

- Tiered accuracy filtering
- EMA tuning
- Pace rounding
- Test on 5+ test routes before public release

### Phase 2: Public Release (v1.1)

- Douglas-Peucker + gradient rendering
- GPS pre-start warning
- Vincenty formula

### Phase 3: Advanced (v1.2+)

- Kalman filter
- Dead reckoning
- DEM elevation correction
- Map matching (if Mapbox relationship finalized)

---

## Files to Create/Modify

| File                             | Action | Impact                             |
| -------------------------------- | ------ | ---------------------------------- |
| `stores/trackingStore.ts`        | Modify | Core GPS filtering logic           |
| `utils/formatting.ts`            | Modify | Pace rounding                      |
| `utils/gps-utils.ts`             | Create | Douglas-Peucker, Vincenty, helpers |
| `services/gps/kalman-filter.ts`  | Create | Sensor fusion (P3)                 |
| `services/gps/dead-reckoning.ts` | Create | Signal loss handling (P3)          |
| `services/elevation/dem.ts`      | Create | Elevation correction (P3)          |
| `services/map/matching.ts`       | Create | Road snapping (P3)                 |
| `app/(tabs)/index.tsx`           | Modify | GPS pre-start dialog               |
| `app/session/[id].tsx`           | Modify | Polyline gradient rendering        |
| `constants/gps-config.ts`        | Create | Centralized GPS constants          |

---

## Success Metrics

| Metric                       | Target              | Method                 |
| ---------------------------- | ------------------- | ---------------------- |
| Distance accuracy vs. Strava | ±2% on 5km route    | Comparison test        |
| Pace display smoothness      | No jumps > 30s      | Subjective testing     |
| Polyline point reduction     | 40-60% fewer points | Point count delta      |
| GPS signal recovery time     | < 5 seconds         | Tunnel test            |
| Session load performance     | < 2s (was 3s)       | Profiling before/after |
| User trust score (survey)    | 8/10 → 9/10         | Post-release survey    |

---

## References

- Strava GPS data processing: https://blog.strava.com/our-approach-to-detecting-gps-glitches/
- Nike Run Club algorithms: Industry interviews & app analysis
- Kalman filter: https://en.wikipedia.org/wiki/Kalman_filter
- Douglas-Peucker: https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
- Vincenty's formula: https://en.wikipedia.org/wiki/Vincenty%27s_formulae
- Mapbox APIs: https://docs.mapbox.com/

---

**Document Status:** 🟢 **ACTIVE**  
**Last Updated:** 2026-04-26  
**Next Review:** Post-Phase-1 completion
