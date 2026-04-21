---
description: "React Native development standards and best practices for GoStrich"
applyTo: "**/*.tsx, **/*.ts"
---

# React Native Development Instructions

High-performance React Native development standards for GoStrich mobile app on iOS and Android with Expo.

## Project Context

- React Native + Expo framework
- TypeScript for type safety
- iOS and Android target platforms
- Real-time GPS tracking and sensor integration
- Performance-critical rendering (live metrics updates)
- Tailwind CSS for styling
- React Navigation for routing

## Core Architecture

### Navigation Structure

```typescript
// Navigation follows linear flow for running app
const RootNavigator = () => {
  return (
    <Stack.Navigator>
      {/* Auth Stack */}
      <Stack.Group screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      </Stack.Group>

      {/* App Stack */}
      <Stack.Group screenOptions={{ headerShown: true }}>
        <Stack.Screen name="Home" component={BottomTabNavigator} />
        <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
        <Stack.Screen name="RouteSelector" component={RouteSelectorScreen} />
      </Stack.Group>

      {/* Active Workout Modal */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
};
```

### Bottom Tab Navigator

```
Home (Dashboard)
  ├── Workouts History
  ├── Quick Start
  └── Stats Overview

Routes
  ├── Discover Routes
  ├── Saved Routes
  └── Create Route

Profile
  ├── Settings
  ├── Goals
  └── Preferences
```

## Component Architecture

### Functional Components with Hooks

```typescript
// Components should always be functional
const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onPress,
  variant = 'default',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useColorScheme();

  const handlePress = useCallback(() => {
    setIsExpanded(!isExpanded);
    onPress?.(workout.id);
  }, [isExpanded, onPress, workout.id]);

  return (
    <Pressable
      onPress={handlePress}
      accessible={true}
      accessibilityLabel={`Workout ${workout.date}`}
      accessibilityRole="button"
    >
      {/* Component JSX */}
    </Pressable>
  );
};
```

### Component Organization

```
components/
├── common/
│   ├── Button.tsx          # Reusable button
│   ├── Card.tsx            # Reusable card
│   ├── Badge.tsx           # Status badges
│   └── Spinner.tsx         # Loading indicator
├── workout/
│   ├── WorkoutCard.tsx     # Single workout display
│   ├── WorkoutMetrics.tsx  # Metrics display
│   ├── PaceChart.tsx       # Pace visualization
│   └── SplitList.tsx       # Interval splits
├── route/
│   ├── RouteCard.tsx       # Route preview
│   ├── RouteMap.tsx        # Map with route
│   ├── ElevationChart.tsx  # Elevation profile
│   └── RouteStats.tsx      # Distance, difficulty
├── ui/
│   ├── typography.tsx      # Text variants
│   ├── spacing.tsx         # Spacing utilities
│   └── colors.tsx          # Color palette
└── modals/
    ├── WorkoutShareModal.tsx
    └── PermissionModal.tsx
```

## State Management with Hooks

### Custom Hooks Pattern

```typescript
// hooks/useWorkout.ts
interface UseWorkoutResult {
  workout: Workout | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateWorkout: (updates: Partial<Workout>) => Promise<void>;
}

export const useWorkout = (id: string): UseWorkoutResult => {
  const [state, dispatch] = useReducer(workoutReducer, initialState);

  useEffect(() => {
    fetchWorkout(id)
      .then((data) => dispatch({ type: "FETCH_SUCCESS", payload: data }))
      .catch((error) => dispatch({ type: "FETCH_ERROR", payload: error }));
  }, [id]);

  const refetch = useCallback(async () => {
    const data = await fetchWorkout(id);
    dispatch({ type: "FETCH_SUCCESS", payload: data });
  }, [id]);

  return {
    workout: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    updateWorkout: async (updates) => {
      // Implementation
    },
  };
};
```

### Global State with Zustand (Recommended)

```typescript
// stores/workoutStore.ts
import { create } from "zustand";

interface WorkoutState {
  workouts: Workout[];
  activeWorkout: Workout | null;
  addWorkout: (workout: Workout) => void;
  setActiveWorkout: (workout: Workout | null) => void;
  removeWorkout: (id: string) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  workouts: [],
  activeWorkout: null,
  addWorkout: (workout) =>
    set((state) => ({ workouts: [...state.workouts, workout] })),
  setActiveWorkout: (workout) => set({ activeWorkout: workout }),
  removeWorkout: (id) =>
    set((state) => ({
      workouts: state.workouts.filter((w) => w.id !== id),
    })),
}));
```

## Performance Optimization

### Render Optimization

```typescript
// Use React.memo for expensive components
const PaceChart = React.memo(({ data }: { data: number[] }) => {
  return <LineChart data={data} />;
}, (prevProps, nextProps) => {
  // Custom comparison: return true if props are equal
  return prevProps.data === nextProps.data;
});

// Use useMemo for expensive calculations
const stats = useMemo(() => {
  return calculateStats(workoutData);
}, [workoutData]);

// Use useCallback to stabilize function references
const handleWorkoutSelect = useCallback((id: string) => {
  navigation.navigate('WorkoutDetail', { id });
}, [navigation]);
```

### FlatList Optimization for Large Lists

```typescript
// Workouts history list (50+ items)
<FlatList
  data={workouts}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <WorkoutCard workout={item} />}
  removeClippedSubviews={true}
  maxToRenderPerBatch={20}
  updateCellsBatchingPeriod={50}
  initialNumToRender={20}
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5}
  ListEmptyComponent={<EmptyWorkouts />}
/>
```

### Image Optimization

```typescript
// Always specify dimensions for images
<Image
  source={{ uri: routeMapImage }}
  style={{ width: 300, height: 200 }}
  resizeMode="cover"
  progressive={true}
/>

// Use cached images
import { Image as CachedImage } from 'react-native-cached-image';
<CachedImage source={{ uri: imageUrl }} style={styles.image} />
```

## Styling with Tailwind CSS

### React Native Tailwind Setup

```typescript
// Use react-native-tailwindcss library
import { useTailwind } from 'tailwindcss-react-native';

const WorkoutCard = () => {
  const tailwind = useTailwind();

  return (
    <View style={tailwind('flex-1 bg-white rounded-lg p-4 mb-3 shadow-md')}>
      <Text style={tailwind('text-lg font-bold text-gray-900')}>
        5K Easy Run
      </Text>
      <Text style={tailwind('text-sm text-gray-600 mt-1')}>
        2.2 km • 13:45 • Easy
      </Text>
    </View>
  );
};
```

### Custom Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.tsx", "./components/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        // Running app specific colors
        "pace-easy": "#10b981", // Green
        "pace-moderate": "#f59e0b", // Amber
        "pace-hard": "#ef4444", // Red
        "zone-z1": "#86efac", // Light green (easy)
        "zone-z5": "#dc2626", // Dark red (max)
      },
      spacing: {
        metric: "2.5rem",
        card: "1rem",
      },
    },
  },
};
```

### Responsive Utilities

```typescript
// Use conditional rendering for screen sizes
import { useWindowDimensions } from 'react-native';

const WorkoutStats = () => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;

  return (
    <View style={tailwind(isSmallScreen ? 'flex-col' : 'flex-row gap-4')}>
      {/* Stats layout changes based on screen size */}
    </View>
  );
};
```

## Real-time Updates & GPS

### GPS Tracking

```typescript
// Background location service
const useGpsTracking = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState(0);
  const gpsPointsRef = useRef<GpsPoint[]>([]);

  useEffect(() => {
    let subscription: Subscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed for GPS tracking");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Best,
          timeInterval: 1000, // Update every second
          distanceInterval: 5, // Or every 5 meters
        },
        (newLocation) => {
          setLocation(newLocation);
          gpsPointsRef.current.push({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            altitude: newLocation.coords.altitude,
            accuracy: newLocation.coords.accuracy,
            timestamp: newLocation.timestamp,
          });

          // Calculate distance incrementally
          if (gpsPointsRef.current.length > 1) {
            const lastPoint =
              gpsPointsRef.current[gpsPointsRef.current.length - 2];
            const newDist = calculateHaversineDistance(lastPoint, {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
            setDistance((prev) => prev + newDist);
          }
        },
      );
    };

    startTracking();
    return () => subscription?.remove();
  }, []);

  return { location, distance, gpsPoints: gpsPointsRef.current };
};
```

### Real-time Metrics Updates

```typescript
// Update UI every second during active workout
const ActiveWorkoutScreen = () => {
  const [metrics, setMetrics] = useState<WorkoutMetrics>(initialMetrics);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        movingTime: prev.movingTime + 1,
        pace: calculateCurrentPace(prev.distance, prev.movingTime),
      }));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <View>
      <Text style={tailwind('text-4xl font-bold')}>
        {formatPace(metrics.pace)}
      </Text>
      <Text style={tailwind('text-2xl')}>
        {formatDistance(metrics.distance)}
      </Text>
    </View>
  );
};
```

## Accessibility

### ARIA Labels & Roles

```typescript
<Pressable
  onPress={handleStartWorkout}
  accessible={true}
  accessibilityLabel="Start a new run"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
>
  <Text>Start Run</Text>
</Pressable>

<FlatList
  accessible={true}
  accessibilityLabel="List of recent workouts"
  accessibilityRole="list"
  data={workouts}
  renderItem={({ item }) => (
    <View
      accessible={true}
      accessibilityLabel={`Workout from ${item.date}: ${item.distance}km`}
      accessibilityRole="listitem"
    >
      {/* Item content */}
    </View>
  )}
/>
```

## Testing

### Unit Tests

```typescript
describe("calculatePace", () => {
  it("calculates pace correctly", () => {
    const pace = calculatePace(10, 3600); // 10km in 1 hour
    expect(pace).toBe(360); // seconds per km
  });

  it("handles edge cases", () => {
    expect(() => calculatePace(0, 0)).toThrow();
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react-native';

describe('WorkoutCard', () => {
  it('renders workout information', () => {
    const workout = {
      id: '1',
      distance: 5.2,
      pace: 300,
      date: new Date(),
    };

    render(<WorkoutCard workout={workout} />);

    expect(screen.getByText('5.2 km')).toBeOnTheScreen();
  });
});
```

## Platform-Specific Code

### iOS vs Android Differences

```typescript
// Use Platform module for platform-specific code
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? 20 : 0,
  },
});

// Or use platform-specific file extensions
// Button.ios.tsx and Button.android.tsx
```

## Success Criteria

Your work is complete when:

1. Components are functional, not class-based
2. Performance is optimized (no unnecessary re-renders)
3. Accessibility labels are properly set
4. Code follows React Native conventions
5. State management is consistent (Zustand or Context)
6. Styling uses Tailwind CSS utilities
7. Tests pass on both iOS and Android
8. Background tasks (GPS) are properly managed
