---
name: route-optimization
description: 'Skill for implementing route discovery, planning, navigation, and elevation analysis features'
---

# Route Optimization Skill

Implement route discovery, planning, and navigation features including route finding algorithms, elevation analysis, turn-by-turn guidance, and community route features.

## Role

You are an expert in route planning systems, mapping technologies, and running-specific navigation. You understand optimal routing algorithms, elevation analysis, and how to build intuitive navigation for runners.

## Objectives

When implementing route features, you will:

1. **Integrate mapping services** - Google Maps, OpenStreetMap, or Mapbox APIs
2. **Implement route algorithms** - Distance optimization, elevation analysis, variety
3. **Create route discovery** - Popular routes, proximity search, filters
4. **Build navigation features** - Turn-by-turn, waypoints, live navigation
5. **Analyze elevation** - Grade, difficulty, effort estimation
6. **Handle offline navigation** - Pre-download routes, offline maps

## Core Implementation Areas

### 1. Mapping Service Integration

**Google Maps Setup**
```typescript
// Install and configure
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

// Configuration
const MAP_CONFIG = {
  google_maps_api_key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
  default_zoom: 14,
  default_region: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
};

// Map component wrapper
const WorkoutMap: React.FC<{ route: GpsPoint[] }> = ({ route }) => {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFill}
      initialRegion={MAP_CONFIG.default_region}
    >
      {/* Route polyline */}
      <Polyline
        coordinates={route}
        strokeColor="#ff6b35"
        strokeWidth={3}
      />

      {/* Start/end markers */}
      {route.length > 0 && (
        <>
          <Marker coordinate={route[0]} title="Start" />
          <Marker coordinate={route[route.length - 1]} title="End" />
        </>
      )}
    </MapView>
  );
};
```

**Mapbox Alternative** (if preferred for offline support)
```typescript
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

const MapboxRoute: React.FC<{ route: GpsPoint[] }> = ({ route }) => {
  return (
    <MapboxGL.MapView style={{ flex: 1 }}>
      <MapboxGL.Camera
        zoomLevel={14}
        centerCoordinate={[route[0].longitude, route[0].latitude]}
        animationDuration={500}
      />

      <MapboxGL.ShapeSource
        id="routeSource"
        shape={{
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route.map((p) => [p.longitude, p.latitude]),
          },
        }}
      >
        <MapboxGL.LineLayer
          id="routeLine"
          style={{
            lineColor: '#ff6b35',
            lineWidth: 3,
          }}
        />
      </MapboxGL.ShapeSource>
    </MapboxGL.MapView>
  );
};
```

### 2. Route Finding Algorithms

**Polyline Encoding/Decoding** (compress route data)
```typescript
// Google Polyline algorithm for compression
const encodePolyline = (points: GpsPoint[]): string => {
  let encoded = '';
  let prevLat = 0, prevLng = 0;

  const encode = (value: number): string => {
    let result = '';
    let v = Math.round(value * 1e5);
    v = (v << 1) ^ (v >> 31);

    while (v >= 0x20) {
      result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    result += String.fromCharCode(v + 63);
    return result;
  };

  for (const point of points) {
    encoded += encode(point.latitude - prevLat);
    encoded += encode(point.longitude - prevLng);
    prevLat = point.latitude;
    prevLng = point.longitude;
  }

  return encoded;
};

// Decode polyline
const decodePolyline = (encoded: string): GpsPoint[] => {
  const points: GpsPoint[] = [];
  let index = 0, lat = 0, lng = 0;

  const decode = (): number => {
    let result = 0, shift = 0, byte;

    while (true) {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
      if (byte < 0x20) break;
    }

    return (result & 1) ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    lat += decode();
    lng += decode();

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
      timestamp: Date.now(),
    });
  }

  return points;
};
```

**Route Simplification** (Douglas-Peucker algorithm)
```typescript
// Reduce number of points while maintaining shape
const simplifyRoute = (
  points: GpsPoint[],
  tolerance: number = 0.00005 // ~5 meters
): GpsPoint[] => {
  if (points.length < 3) return points;

  const getDistance = (
    p0: GpsPoint,
    p1: GpsPoint,
    p2: GpsPoint
  ): number => {
    // Calculate perpendicular distance from p1 to line p0-p2
    const x0 = p0.latitude, y0 = p0.longitude;
    const x1 = p1.latitude, y1 = p1.longitude;
    const x2 = p2.latitude, y2 = p2.longitude;

    const num = Math.abs(
      (y2 - y1) * x1 - (x2 - x1) * y1 + x2 * y1 - y2 * x1
    );
    const den = Math.hypot(y2 - y1, x2 - x1);
    return num / den;
  };

  let dmax = 0;
  let index = 1;

  for (let i = 1; i < points.length - 1; i++) {
    const d = getDistance(points[0], points[i], points[points.length - 1]);
    if (d > dmax) {
      dmax = d;
      index = i;
    }
  }

  let result: GpsPoint[] = [];
  if (dmax > tolerance) {
    const recResults1 = simplifyRoute(points.slice(0, index + 1), tolerance);
    const recResults2 = simplifyRoute(
      points.slice(index),
      tolerance
    );
    result = [
      ...recResults1.slice(0, -1),
      ...recResults2,
    ];
  } else {
    result = [points[0], points[points.length - 1]];
  }

  return result;
};
```

### 3. Route Discovery

**Nearby Routes Search**
```typescript
// Find routes within specified distance from user
const findNearbyRoutes = async (
  userLocation: { latitude: number; longitude: number },
  radiusKm: number = 5
): Promise<Route[]> => {
  const routes = await routeService.searchByDistance(
    userLocation,
    radiusKm
  );

  // Sort by distance
  const sorted = routes.sort((a, b) => {
    const distA = calculateHaversineDistance(
      userLocation,
      { latitude: a.points[0].latitude, longitude: a.points[0].longitude }
    );
    const distB = calculateHaversineDistance(
      userLocation,
      { latitude: b.points[0].latitude, longitude: b.points[0].longitude }
    );
    return distA - distB;
  });

  return sorted;
};

// Route filtering
const filterRoutes = (
  routes: Route[],
  filters: {
    minDistance?: number;
    maxDistance?: number;
    difficulty?: 'easy' | 'moderate' | 'hard' | 'expert';
    type?: 'loop' | 'out-and-back' | 'linear';
    minPopularity?: number;
  }
): Route[] => {
  return routes.filter((route) => {
    if (filters.minDistance && route.distance < filters.minDistance) return false;
    if (filters.maxDistance && route.distance > filters.maxDistance) return false;
    if (filters.difficulty && route.difficulty !== filters.difficulty) return false;
    if (filters.type && route.type !== filters.type) return false;
    if (filters.minPopularity && route.popularity < filters.minPopularity) return false;
    return true;
  });
};
```

**Route Recommendations**
```typescript
// Recommend routes based on user history
const recommendRoutes = async (
  userId: string,
  limit: number = 5
): Promise<Route[]> => {
  // Get user's fitness level and preferences
  const userProfile = await getUserProfile(userId);
  const recentWorkouts = await getWorkoutHistory(userId, { limit: 20 });

  // Calculate average distance and difficulty
  const avgDistance =
    recentWorkouts.reduce((sum, w) => sum + w.metrics.distance, 0) /
    recentWorkouts.length;
  const userDifficulty = avgDistance < 5 ? 'easy' : avgDistance < 10 ? 'moderate' : 'hard';

  // Get recently run routes (avoid repetition)
  const recentRoutes = new Set(
    recentWorkouts
      .filter((w) => w.routeId)
      .map((w) => w.routeId)
  );

  // Find similar routes user hasn't run
  const userLocation = userProfile.homeLocation;
  const candidates = await findNearbyRoutes(userLocation, 10);

  const recommendations = filterRoutes(candidates, {
    difficulty: userDifficulty,
    minDistance: avgDistance * 0.8,
    maxDistance: avgDistance * 1.2,
    minPopularity: 0.5,
  }).filter((r) => !recentRoutes.has(r.id));

  return recommendations.slice(0, limit);
};
```

### 4. Navigation Features

**Turn-by-Turn Guidance**
```typescript
// Calculate bearing between two points
const calculateBearing = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number => {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const lon1 = (from.longitude * Math.PI) / 180;
  const lon2 = (to.longitude * Math.PI) / 180;

  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (Math.atan2(y, x) * 180) / Math.PI; // 0-360 degrees
};

// Detect when user approaches a waypoint
const useWaypointDetection = (
  currentLocation: GpsPoint,
  waypoints: GpsPoint[]
) => {
  const [nextWaypoint, setNextWaypoint] = useState(waypoints[0]);
  const waypointRadiusM = 50; // Trigger at 50m

  useEffect(() => {
    const distance = calculateHaversineDistance(currentLocation, nextWaypoint);

    if (distance < waypointRadiusM / 1000) {
      // User reached waypoint
      const nextIdx = waypoints.indexOf(nextWaypoint) + 1;
      if (nextIdx < waypoints.length) {
        setNextWaypoint(waypoints[nextIdx]);
        playAudio('waypoint-reached');
      }
    }
  }, [currentLocation]);

  return nextWaypoint;
};

// Generate turn instructions
const generateTurnInstruction = (
  prevBearing: number,
  nextBearing: number,
  distance: number
): string => {
  const angle = nextBearing - prevBearing;
  const normalizedAngle = ((angle + 180) % 360) - 180;

  let direction = '';
  if (normalizedAngle < -45) direction = 'Turn left';
  else if (normalizedAngle < 0) direction = 'Bear left';
  else if (normalizedAngle < 45) direction = 'Continue straight';
  else if (normalizedAngle < 90) direction = 'Bear right';
  else direction = 'Turn right';

  const distanceM = Math.round(distance * 1000);
  return `${direction} in ${distanceM}m`;
};
```

### 5. Elevation Analysis

**Grade Calculation**
```typescript
// Calculate grade (percentage slope) for each segment
const calculateSegmentGrades = (
  routePoints: GpsPoint[]
): { distance: number; grade: number }[] => {
  const grades: { distance: number; grade: number }[] = [];

  for (let i = 1; i < routePoints.length; i++) {
    const distance = calculateHaversineDistance(
      routePoints[i - 1],
      routePoints[i]
    );
    const elevationDelta =
      (routePoints[i].altitude || 0) - (routePoints[i - 1].altitude || 0);
    const grade = (elevationDelta / (distance * 1000)) * 100; // percentage

    grades.push({ distance, grade });
  }

  return grades;
};

// Identify difficult sections
const identifyHillSections = (
  routePoints: GpsPoint[],
  gradeThreshold: number = 4 // >4% is a hill
): { start: number; end: number; avgGrade: number }[] => {
  const grades = calculateSegmentGrades(routePoints);
  const hills: { start: number; end: number; avgGrade: number }[] = [];

  let currentHill: { start: number; grades: number[] } | null = null;
  let distance = 0;

  for (const { distance: segDist, grade } of grades) {
    distance += segDist;

    if (Math.abs(grade) > gradeThreshold) {
      if (!currentHill) {
        currentHill = { start: distance, grades: [grade] };
      } else {
        currentHill.grades.push(grade);
      }
    } else if (currentHill) {
      const avgGrade = currentHill.grades.reduce((a, b) => a + b, 0) /
        currentHill.grades.length;
      hills.push({
        start: currentHill.start,
        end: distance,
        avgGrade,
      });
      currentHill = null;
    }
  }

  return hills;
};

// Route difficulty score
const calculateDifficultyScore = (route: Route): number => {
  const elevationFactor = route.elevationGain / 100; // 100m = 1 point
  const gradeFactor = Math.max(
    ...calculateSegmentGrades(route.points).map((s) => Math.abs(s.grade))
  ) / 2; // Max grade / 2
  const distanceFactor = route.distance / 5; // 5km = 1 point

  return Math.round(elevationFactor + gradeFactor + distanceFactor);
};
```

### 6. Offline Navigation

**Pre-download Routes**
```typescript
// Download route for offline use
const downloadRouteOffline = async (route: Route) => {
  try {
    // 1. Download map tiles for route area
    const tiles = getTileBoundsFromRoute(route);
    await downloadMapTiles(tiles);

    // 2. Store route polyline (simplified)
    const simplified = simplifyRoute(route.points, 0.0001);
    const encoded = encodePolyline(simplified);

    await storage.save(`route_${route.id}`, {
      id: route.id,
      name: route.name,
      encoded,
      bounds: getTileBounds(route.points),
    });

    // 3. Store elevation profile
    await storage.save(`elevation_${route.id}`, {
      elevations: route.points.map((p) => p.altitude),
    });

    return { success: true, size: estimateStorageSize(tiles, encoded) };
  } catch (error) {
    logger.error('Failed to download route:', error);
    return { success: false, error: error.message };
  }
};

// Load offline route
const loadOfflineRoute = async (routeId: string): Promise<Route | null> => {
  try {
    const routeData = await storage.load(`route_${routeId}`);
    const elevationData = await storage.load(`elevation_${routeId}`);

    if (!routeData) return null;

    const points = decodePolyline(routeData.encoded);
    if (elevationData?.elevations) {
      points.forEach((p, i) => {
        p.altitude = elevationData.elevations[i];
      });
    }

    return {
      id: routeId,
      name: routeData.name,
      points,
      // ... other fields
    };
  } catch (error) {
    logger.error('Failed to load offline route:', error);
    return null;
  }
};
```

## Success Criteria

Your work is complete when:
1. Mapping services integrate reliably without breaking map rendering
2. Routes are found and filtered correctly by user preferences
3. Navigation provides clear, timely turn-by-turn guidance
4. Elevation analysis accurately identifies hills and grades
5. Routes can be used offline without network connection
6. Route recommendations match user's fitness level and preferences
7. Performance is optimized (large route polylines don't cause lag)
8. Cross-platform functionality works on iOS and Android
9. Edge cases (GPS signal loss, route updates, offline sync) handled gracefully
