---
description: "TypeScript development standards and best practices for GoStrich"
applyTo: "**/*.ts, **/*.tsx"
---

# TypeScript Development Instructions

Type-safe development standards for GoStrich, ensuring maintainability, performance, and reliability through modern TypeScript patterns and best practices.

## Project Context

- TypeScript 5.x with strict mode enabled
- React Native + Expo target platform
- Running/fitness domain application
- Real-time data processing (GPS, heart rate, sensors)
- Performance-critical numerical calculations
- Client-side state management

## Core TypeScript Setup

### Compiler Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["app", "components", "hooks", "utils", "services"],
  "exclude": ["node_modules", "dist"]
}
```

### File Organization

```
src/
├── app/                    # Navigation & screen routing
├── components/             # Reusable UI components
│   ├── common/             # Generic UI components (Button, Card, etc.)
│   ├── workout/            # Workout-specific components
│   ├── route/              # Route-specific components
│   └── ui/                 # Design system components
├── hooks/                  # Custom React hooks
├── utils/                  # Utility functions
│   ├── calculations.ts     # Math: pace, distance, calories
│   ├── formatting.ts       # Format numbers, dates, units
│   └── validation.ts       # Input validation
├── services/               # External API & data services
│   ├── gps.service.ts      # GPS tracking
│   ├── workout.service.ts  # Workout data
│   └── auth.service.ts     # Authentication
├── types/                  # Shared TypeScript types & interfaces
├── constants/              # App constants, configurations
└── stores/                 # State management (Zustand, Redux)
```

## Type Definitions & Interfaces

### Domain Models

```typescript
// types/workout.ts
export interface GpsPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
}

export interface WorkoutMetrics {
  distance: number; // kilometers
  movingTime: number; // seconds
  pace: number; // seconds per km
  elevation: {
    gain: number; // meters
    loss: number;
    max: number;
    min: number;
  };
  heartRate?: {
    current: number;
    average: number;
    max: number;
    min: number;
  };
  cadence?: number; // steps per minute
}

export interface Workout {
  id: string;
  userId: string;
  type: "easy" | "tempo" | "interval" | "long_run" | "recovery";
  startTime: Date;
  endTime: Date;
  metrics: WorkoutMetrics;
  gpsTrack: GpsPoint[];
  notes?: string;
  weather?: WeatherData;
  tags: string[];
}
```

### Strict Typing Rules

#### 1. No `any` Type

❌ Bad:

```typescript
const calculatePace = (data: any) => { ... }
```

✅ Good:

```typescript
interface PaceCalculation {
  distance: number;
  time: number;
}

const calculatePace = (data: PaceCalculation): number => { ... }
```

#### 2. Explicit Return Types

❌ Bad:

```typescript
const formatDistance = (meters: number) => {
  return (meters / 1000).toFixed(2);
};
```

✅ Good:

```typescript
const formatDistance = (meters: number): string => {
  return (meters / 1000).toFixed(2);
};
```

#### 3. Use Discriminated Unions for States

❌ Bad:

```typescript
interface ApiState {
  loading: boolean;
  error: string | null;
  data: Workout | null;
}
```

✅ Good:

```typescript
type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Workout }
  | { status: "error"; error: string };
```

#### 4. Exhaustive Pattern Matching

```typescript
function handleState(state: ApiState): ReactNode {
  switch (state.status) {
    case 'idle':
      return <EmptyState />;
    case 'loading':
      return <LoadingSpinner />;
    case 'success':
      return <WorkoutDetails workout={state.data} />;
    case 'error':
      return <ErrorMessage message={state.error} />;
    // TypeScript error if case is missing!
  }
}
```

## Generic Types & Reusability

### Generic Utility Types

```typescript
// Async operations
type AsyncResult<T> = { ok: true; value: T } | { ok: false; error: Error };

// Optional fields
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// Readonly nested
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// Getters for state
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
```

### Working with Generics

```typescript
// Good generic constraint
function cloneArray<T extends object>(items: T[]): T[] {
  return items.map((item) => ({ ...item }));
}

// Good default generic
function createDefaultState<T = unknown>(initial?: T): T | undefined {
  return initial;
}

// Good generic with multiple constraints
function mergeConfig<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>,
): T {
  return { ...base, ...override };
}
```

## Naming Conventions

### Variables & Functions

- Use camelCase: `currentPace`, `calculateElevation`
- Prefix boolean getters with `is`, `has`, `should`: `isRunning`, `hasPermission`, `shouldRefresh`
- Prefix handlers with `handle`: `handlePaceChange`, `handleRouteSelect`
- Use descriptive names for calculations: `elevationGainPerKm` not `eg`, `averageHeartRate` not `avg_hr`

### Types & Interfaces

- Use PascalCase: `WorkoutMetrics`, `GpsPoint`, `UserPreferences`
- Use `I` prefix only for abstract interfaces: `ILogger`, `ISensorService`
- Suffixes: `*Options`, `*Config`, `*State`, `*Props`
- Example: `WorkoutTrackerOptions`, `SensorConfig`, `WorkoutState`, `WorkoutCardProps`

### Constants

- Use UPPER_SNAKE_CASE: `MAX_HEART_RATE`, `MIN_GPS_ACCURACY`, `DEFAULT_PACE_FORMAT`
- Group related constants in objects:

```typescript
const GPS_CONSTANTS = {
  MAX_AGE_MS: 5000,
  MIN_ACCURACY: 10, // meters
  SIGNAL_LOSS_THRESHOLD: 100,
} as const;

// Usage: GPS_CONSTANTS.MAX_AGE_MS
```

## Error Handling

### Custom Error Types

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

class GpsError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "GpsError";
  }
}

// Usage
if (!isValidPace(pace)) {
  throw new ValidationError("Pace must be positive", "pace");
}
```

### Error Handling Patterns

```typescript
// Pattern 1: Result type
async function fetchWorkout(id: string): Promise<AsyncResult<Workout>> {
  try {
    const data = await api.get(`/workouts/${id}`);
    return { ok: true, value: data };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

// Pattern 2: Discriminated union + exhaustive matching
const result = await fetchWorkout(id);
if (result.ok) {
  displayWorkout(result.value);
} else {
  logger.error(result.error.message);
}
```

## Testing TypeScript Code

### Type Safety in Tests

```typescript
describe("calculatePace", () => {
  it("returns pace in seconds per km", () => {
    const result: number = calculatePace({
      distance: 10,
      time: 3600,
    });
    expect(result).toBe(360);
  });

  it("validates input types at compile time", () => {
    // This won't compile:
    calculatePace({ distance: "10", time: 3600 });
  });
});
```

## Performance Considerations

### Compilation

- Avoid circular dependencies (use `import type` for types)
- Use `--incremental` flag for faster rebuilds
- Keep type definitions close to usage
- Extract shared types to `types/` folder

### Runtime

- Use `const` assertions for literal types:

```typescript
const STATUS = { RUNNING: "running", PAUSED: "paused" } as const;
type RunStatus = (typeof STATUS)[keyof typeof STATUS];
```

- Leverage discriminated unions for efficient pattern matching
- Use branded types for domain values:

```typescript
type Kilometers = number & { readonly __brand: "Kilometers" };

function km(value: number): Kilometers {
  if (value < 0) throw new Error("Distance must be positive");
  return value as Kilometers;
}
```

## Code Quality Standards

### Comments & Documentation

- Explain **why**, not what (code shows what)
- Document public APIs with JSDoc:

```typescript
/**
 * Calculate average pace for a run.
 * @param distance Distance in kilometers
 * @param time Total time in seconds
 * @returns Pace in seconds per kilometer
 * @throws {ValidationError} if inputs are invalid
 */
export function calculatePace(distance: number, time: number): number {
  // ...
}
```

### Imports

- Use absolute imports with path aliases:

```typescript
// tsconfig.json
"paths": {
  "@components/*": ["./components/*"],
  "@hooks/*": ["./hooks/*"],
  "@utils/*": ["./utils/*"],
  "@types/*": ["./types/*"]
}

// Usage
import { Button } from '@components/common';
import { useWorkout } from '@hooks/useWorkout';
import { calculatePace } from '@utils/calculations';
import type { Workout } from '@types/workout';
```

## Success Criteria

Your work is complete when:

1. All types are explicitly defined (no `any` types)
2. Return types are specified for functions
3. Error handling uses discriminated unions or custom error types
4. Tests pass with type checking enabled
5. No TypeScript compilation warnings
6. Code follows naming conventions consistently
7. JSDoc comments document public APIs
