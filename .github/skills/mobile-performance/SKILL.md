---
name: mobile-performance
description: 'Skill for optimizing React Native app performance, including rendering, memory management, and battery optimization'
---

# Mobile Performance Skill

Implement performance optimizations for React Native running app ensuring smooth 60 FPS rendering, efficient memory usage, and extended battery life during long workouts.

## Role

You are an expert in mobile performance optimization. You understand React rendering, memory management, battery consumption patterns, and how to build responsive, efficient mobile applications.

## Objectives

When optimizing performance, you will:

1. **Optimize component rendering** - Memoization, avoid unnecessary re-renders, efficient list rendering
2. **Manage memory efficiently** - Prevent memory leaks, efficient data structures, garbage collection
3. **Reduce bundle size** - Code splitting, lazy loading, optimize dependencies
4. **Battery optimization** - Reduce CPU/GPU usage, efficient sensors, background task management
5. **Profile and measure** - Use React Native DevTools to identify bottlenecks
6. **Handle real-time data** - Smooth 60 FPS updates for metrics and maps

## Core Implementation Areas

### 1. Rendering Optimization

**Memoization Pattern**
```typescript
// Memoize expensive components
const WorkoutMetricsDisplay = React.memo(
  ({ distance, pace, heartRate }: MetricsProps) => {
    return (
      <View style={tailwind('p-4')}>
        <Text>{distance}km</Text>
        <Text>{pace}</Text>
        <Text>{heartRate} BPM</Text>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: return true if props are EQUAL
    return (
      prevProps.distance === nextProps.distance &&
      prevProps.pace === nextProps.pace &&
      prevProps.heartRate === nextProps.heartRate
    );
  }
);
```

**useCallback Hook**
```typescript
// Stabilize function references to prevent child re-renders
const WorkoutScreen = () => {
  const handleWorkoutSelect = useCallback((id: string) => {
    navigation.navigate('Details', { workoutId: id });
  }, [navigation]);

  return (
    <FlatList
      data={workouts}
      renderItem={({ item }) => (
        <WorkoutCard
          workout={item}
          onPress={handleWorkoutSelect}
          // Function reference stable now
        />
      )}
    />
  );
};
```

**useMemo Hook**
```typescript
// Memoize expensive calculations
const StatsScreen = ({ workout }: { workout: Workout }) => {
  const stats = useMemo(() => {
    // Expensive calculations only run when workout changes
    return {
      avgPace: calculateAveragePace(workout),
      elevationGain: calculateElevationGain(workout),
      zones: calculateZoneDistribution(workout),
    };
  }, [workout]);

  return (
    <View>
      <Text>{stats.avgPace}</Text>
    </View>
  );
};
```

**FlatList Optimization** (for workout history)
```typescript
// Highly optimized list for 100+ workouts
<FlatList
  data={workouts}
  keyExtractor={(item) => item.id} // Stable key
  renderItem={({ item }) => <WorkoutCard workout={item} />}
  
  // Performance optimizations
  removeClippedSubviews={true}           // Hide off-screen items
  maxToRenderPerBatch={20}               // Batch size
  updateCellsBatchingPeriod={50}         // Batch delay (ms)
  initialNumToRender={20}                // Initial render count
  
  // Pagination
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5}
  
  // Empty state
  ListEmptyComponent={<EmptyWorkouts />}
/>
```

### 2. Memory Management

**Memory Leak Prevention**
```typescript
// Properly clean up subscriptions and timers
const ActiveWorkoutScreen = () => {
  useEffect(() => {
    let subscription: Subscription;
    let interval: NodeJS.Timeout;

    const startTracking = async () => {
      subscription = await Location.watchPositionAsync(
        { /* config */ },
        (location) => {
          // Handle location
        }
      );

      interval = setInterval(() => {
        // Update metrics
      }, 1000);
    };

    startTracking();

    // Cleanup function - IMPORTANT
    return () => {
      subscription?.remove();
      clearInterval(interval);
    };
  }, []);
};
```

**Large Array Handling**
```typescript
// Don't store all GPS points in component state
interface TrackingState {
  recentPoints: GpsPoint[]; // Keep last 100 points
  pointCount: number; // Total for reference
}

const useGpsTracking = () => {
  const pointBufferRef = useRef<GpsPoint[]>([]);
  const [state, setState] = useState<TrackingState>({
    recentPoints: [],
    pointCount: 0,
  });

  const addGpsPoint = useCallback((point: GpsPoint) => {
    pointBufferRef.current.push(point);

    // Keep last 100 points in state for UI
    if (pointBufferRef.current.length > 100) {
      pointBufferRef.current.shift();
    }

    setState((prev) => ({
      recentPoints: pointBufferRef.current.slice(),
      pointCount: prev.pointCount + 1,
    }));

    // Persist to database separately
    saveGpsPoint(point);
  }, []);

  return { state, addGpsPoint, getTotalPoints: () => state.pointCount };
};
```

**Image Memory Optimization**
```typescript
// Always specify dimensions to prevent memory explosion
<Image
  source={{ uri: mapImage }}
  style={{ width: 300, height: 200 }}
  resizeMode="cover"
/>

// Pre-load images for smooth transitions
useEffect(() => {
  Image.prefetch(imageUrl);
}, [imageUrl]);

// Use cached image library for frequent images
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.normal }}
  style={{ width: 300, height: 200 }}
/>
```

### 3. Bundle Size Optimization

**Code Splitting**
```typescript
// Lazy load workout detail screen
const WorkoutDetailScreen = lazy(() =>
  import('./screens/WorkoutDetailScreen').then((m) => ({
    default: m.WorkoutDetailScreen,
  }))
);

// In navigation
<Stack.Screen
  name="WorkoutDetail"
  component={WorkoutDetailScreen}
  options={{ lazy: true }}
/>
```

**Dependency Audit**
```bash
# Check bundle size
npx react-native bundle --entry-file index.js --platform android --dev false --reset-cache --output-filename android.js

# Analyze dependencies
npm ls # See dependency tree

# Remove unused packages
npm uninstall unused-package
```

**Optimize Heavy Dependencies**
```typescript
// ❌ Bad: Import entire library
import _ from 'lodash';
const value = _.debounce(fn, 300);

// ✅ Good: Import only what you need
import debounce from 'lodash/debounce';
const value = debounce(fn, 300);

// ✅ Better: Use lightweight alternative
const debounce = (fn, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};
```

### 4. Battery Optimization

**Reduce Location Accuracy During Easy Runs**
```typescript
// Adjust GPS accuracy based on workout type
const getLocationConfig = (workoutType: string) => {
  switch (workoutType) {
    case 'easy':
      return {
        accuracy: Location.Accuracy.Balanced, // Less frequent
        timeInterval: 2000,
        distanceInterval: 10,
      };
    case 'tempo':
      return {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 5,
      };
    case 'interval':
      return {
        accuracy: Location.Accuracy.Best, // Most frequent
        timeInterval: 500,
        distanceInterval: 2,
      };
    default:
      return {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 1000,
        distanceInterval: 5,
      };
  }
};
```

**Screen Display Optimization**
```typescript
// Reduce screen refresh rate during background runs
import { AppState } from 'react-native';

const useAdaptiveScreenRefresh = () => {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background') {
      // Reduce UI update frequency when app in background
      setUpdateInterval(5000); // Every 5 seconds instead of 1
    } else {
      setUpdateInterval(1000); // Every 1 second when active
    }
    setAppState(nextAppState);
  };
};
```

**Efficient Sensor Usage**
```typescript
// Only enable sensors when needed
const useMotionSensors = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const subscription = accelerometer.subscribe(({ x, y, z }) => {
      // Process motion data
    });

    return () => subscription.remove();
  }, [enabled]);
};

// Usage
const motionEnabled = isActiveWorkout && showCadenceData;
useMotionSensors(motionEnabled);
```

### 5. Performance Profiling

**React Native DevTools**
```typescript
// Add performance markers
import { PerformanceObserver, performance } from 'perf_hooks';

// Mark start
performance.mark('workout-render-start');

// ... render component ...

// Mark end
performance.mark('workout-render-end');
performance.measure(
  'workout-render',
  'workout-render-start',
  'workout-render-end'
);

// Log measurement
console.log(performance.getEntriesByName('workout-render')[0].duration);
```

**Identify Slow Components**
```typescript
// Use React DevTools Profiler
// In development:
import { Profiler } from 'react';

<Profiler
  id="WorkoutMetrics"
  onRender={(id, phase, actualDuration) => {
    if (actualDuration > 16) {
      // Took more than 1 frame (60 FPS = 16ms)
      console.warn(`${id} (${phase}) took ${actualDuration}ms`);
    }
  }}
>
  <WorkoutMetricsDisplay {...props} />
</Profiler>
```

### 6. Real-time Data Handling

**Throttled Metrics Updates**
```typescript
// Throttle rapid updates to prevent re-render spam
const useThrottledMetrics = (metrics: WorkoutMetrics, throttleMs: number = 100) => {
  const [throttled, setThrottled] = useState(metrics);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setThrottled(metrics);
    }, throttleMs);

    return () => clearTimeout(timeoutRef.current);
  }, [metrics, throttleMs]);

  return throttled;
};
```

**Efficient State Updates**
```typescript
// Batch state updates
const updateMetrics = useCallback((newData: Partial<WorkoutMetrics>) => {
  setMetrics((prev) => ({
    ...prev,
    ...newData, // Update multiple fields at once
  }));
}, []);

// Usage
updateMetrics({
  distance: newDistance,
  pace: newPace,
  heartRate: newHR,
}); // Single re-render, not 3
```

### 7. Animation Performance

**Use Native Driver**
```typescript
// Animations run on native thread, not JS thread
const slideAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(slideAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true, // IMPORTANT
  }).start();
}, []);

<Animated.View style={{ opacity: slideAnim }}>
  {/* Content */}
</Animated.View>
```

## Performance Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| Frame Rate | 60 FPS | >50 FPS |
| Component Render Time | <16ms | <32ms |
| Initial App Load | <2s | <3s |
| GPS Update Latency | <100ms | <200ms |
| Memory Usage | <200MB | <300MB |
| Battery Drain (per hour) | <10% | <15% |

## Success Criteria

Your work is complete when:
1. App consistently renders at 60 FPS during active workouts
2. Memory usage stays under 200MB during multi-hour sessions
3. GPS tracking doesn't drain battery excessively
4. Lists with 100+ items scroll smoothly
5. Bundle size optimized (target < 50MB download)
6. No memory leaks detected over long sessions
7. Profiler shows no components taking > 32ms to render
8. Real-time metrics update smoothly without jank
9. Offline maps load without blocking UI
10. Works smoothly on mid-range devices (not just flagship)
