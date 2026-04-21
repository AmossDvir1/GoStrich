---
description: "Tailwind CSS styling standards for React Native GoStrich app"
applyTo: "**/*.tsx"
---

# Tailwind CSS for React Native Instructions

Tailwind CSS styling standards for consistent, maintainable design system in GoStrich using react-native-tailwindcss.

## Project Context

- react-native-tailwindcss library
- Utility-first CSS approach
- Dark mode support (optional)
- Running app design system
- Mobile-first responsive design

## Setup & Configuration

### Installation

```bash
npm install tailwindcss react-native-tailwindcss
npx tailwindcss init -p
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.tsx", "./components/**/*.tsx", "./screens/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        // Running app brand colors
        primary: "#ff6b35", // Orange - action/CTA
        secondary: "#004e89", // Dark blue - secondary actions
        success: "#10b981", // Green - positive state
        warning: "#f59e0b", // Amber - caution
        error: "#ef4444", // Red - error/danger

        // Fitness-specific colors
        "zone-z1": "#86efac", // Z1 (easy) - light green
        "zone-z2": "#4ade80", // Z2 (light) - medium green
        "zone-z3": "#facc15", // Z3 (moderate) - yellow
        "zone-z4": "#fb923c", // Z4 (hard) - orange
        "zone-z5": "#dc2626", // Z5 (max) - red

        // Neutral scale
        "slate-50": "#f8fafc",
        "slate-900": "#0f172a",
      },
      spacing: {
        card: "1rem",
        metric: "2.5rem",
        section: "1.5rem",
      },
      fontSize: {
        metric: "2.25rem", // Large numbers (pace, distance)
        label: "0.75rem", // Small labels
      },
      borderRadius: {
        card: "0.75rem",
        button: "0.5rem",
      },
      shadows: {
        card: "0 1px 3px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
```

## Core Design Patterns

### Spacing System

```typescript
// Consistent spacing scale
const spacing = {
  xs: 0.25,  // 4px
  sm: 0.5,   // 8px
  md: 1,     // 16px
  lg: 1.5,   // 24px
  xl: 2,     // 32px
  '2xl': 3,  // 48px
};

// Usage
<View style={tailwind('p-4')}>        {/* 16px padding */}
<View style={tailwind('mb-3')}>       {/* 12px margin bottom */}
<View style={tailwind('gap-2')}>      {/* 8px gap */}
```

### Typography Hierarchy

```typescript
// Headings
<Text style={tailwind('text-2xl font-bold text-slate-900')}>
  Main Title
</Text>

// Subheadings
<Text style={tailwind('text-lg font-semibold text-slate-800')}>
  Section Title
</Text>

// Body text
<Text style={tailwind('text-base text-slate-700')}>
  Regular body text with detail information
</Text>

// Small text / labels
<Text style={tailwind('text-sm text-slate-600')}>
  Supporting text or label
</Text>

// Tiny text
<Text style={tailwind('text-xs text-slate-500')}>
  Metadata or secondary information
</Text>
```

### Color Semantics

```typescript
// Use semantic color names, not literal names
❌ Bad:
<Text style={tailwind('text-red-500')}>Error message</Text>

✅ Good:
<Text style={tailwind('text-error')}>Error message</Text>

// Context-aware colors
<View style={tailwind('bg-success')}>     {/* Success state */}
<View style={tailwind('bg-warning')}>     {/* Warning state */}
<View style={tailwind('bg-error')}>       {/* Error state */}
```

## Component Patterns

### Card Layout

```typescript
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View style={tailwind('bg-white rounded-card p-card shadow-card mb-section')}>
      {children}
    </View>
  );
};

// Usage
<Card>
  <Text style={tailwind('text-lg font-semibold')}>Workout Summary</Text>
  <Text style={tailwind('text-metric font-bold text-primary mt-2')}>
    5.2 km
  </Text>
</Card>
```

### Button Styles

```typescript
// Primary CTA button
<Pressable style={tailwind('bg-primary px-4 py-3 rounded-button')}>
  <Text style={tailwind('text-white font-semibold text-center')}>
    Start Workout
  </Text>
</Pressable>

// Secondary button
<Pressable style={tailwind('bg-slate-100 px-4 py-3 rounded-button border border-slate-300')}>
  <Text style={tailwind('text-slate-900 font-semibold text-center')}>
    Cancel
  </Text>
</Pressable>

// Ghost button (text only)
<Pressable>
  <Text style={tailwind('text-primary font-semibold')}>Learn More</Text>
</Pressable>
```

### Badge / Status Indicator

```typescript
// Zone badges
const ZoneBadge: React.FC<{ zone: 'z1' | 'z2' | 'z3' | 'z4' | 'z5' }> = ({ zone }) => {
  const colors = {
    z1: 'bg-zone-z1 text-slate-900',
    z2: 'bg-zone-z2 text-slate-900',
    z3: 'bg-zone-z3 text-slate-900',
    z4: 'bg-zone-z4 text-white',
    z5: 'bg-zone-z5 text-white',
  };

  return (
    <View style={tailwind(`${colors[zone]} px-2 py-1 rounded`)}>
      <Text style={tailwind('text-xs font-bold')}>{zone.toUpperCase()}</Text>
    </View>
  );
};
```

### Metric Display

```typescript
// Primary metric display (large numbers)
<View style={tailwind('items-center mb-section')}>
  <Text style={tailwind('text-metric font-bold text-primary')}>
    5:42
  </Text>
  <Text style={tailwind('text-sm text-slate-600 mt-1')}>
    Pace per km
  </Text>
</View>

// Metric row (multiple metrics)
<View style={tailwind('flex-row justify-around bg-slate-50 rounded-card p-4')}>
  <View style={tailwind('items-center')}>
    <Text style={tailwind('text-lg font-semibold text-slate-600')}>Distance</Text>
    <Text style={tailwind('text-metric font-bold text-slate-900 mt-1')}>
      5.2 km
    </Text>
  </View>
  <View style={tailwind('items-center')}>
    <Text style={tailwind('text-lg font-semibold text-slate-600')}>Time</Text>
    <Text style={tailwind('text-metric font-bold text-slate-900 mt-1')}>
      32:15
    </Text>
  </View>
</View>
```

## Layout Patterns

### Flexbox Layout

```typescript
// Column layout (default)
<View style={tailwind('flex-1 flex-col')}>
  <View style={tailwind('mb-4')}>Header</View>
  <View style={tailwind('flex-1')}>Content</View>
  <View style={tailwind('mt-4')}>Footer</View>
</View>

// Row layout with spacing
<View style={tailwind('flex-row justify-between items-center gap-4')}>
  <View style={tailwind('flex-1')}>Left content</View>
  <View style={tailwind('flex-1')}>Right content</View>
</View>

// Centered content
<View style={tailwind('flex-1 justify-center items-center')}>
  <Text style={tailwind('text-lg')}>Centered Text</Text>
</View>
```

### Safe Area & Screen Margins

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ScreenComponent = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={tailwind('flex-1 bg-white')} style={{ paddingTop: insets.top }}>
      <View style={tailwind('px-4 py-section')}>
        {/* Screen content */}
      </View>
    </View>
  );
};
```

## Dark Mode Support (Optional)

### Configuration

```typescript
// Check for dark mode preference
import { useColorScheme } from 'react-native';

const ColorContext = React.createContext<'light' | 'dark'>('light');

export const ColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(scheme || 'light');

  return (
    <ColorContext.Provider value={colorScheme}>
      {children}
    </ColorContext.Provider>
  );
};
```

### Dark Mode Styles

```typescript
const DarkModeCard = () => {
  const colorScheme = useContext(ColorContext);
  const darkStyles = colorScheme === 'dark'
    ? 'bg-slate-900 text-white'
    : 'bg-white text-slate-900';

  return (
    <View style={tailwind(`${darkStyles} rounded-card p-4`)}>
      <Text>Content adapts to light/dark mode</Text>
    </View>
  );
};
```

## Responsive Design

### Mobile-First Approach

```typescript
// Start with mobile, then consider larger screens
// React Native primarily mobile, but consider tablet layouts

import { useWindowDimensions } from 'react-native';

const ResponsiveLayout = () => {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  return (
    <View style={tailwind(isTablet ? 'flex-row gap-4' : 'flex-col gap-2')}>
      <View style={tailwind(isTablet ? 'flex-1' : 'w-full')}>
        Column 1
      </View>
      <View style={tailwind(isTablet ? 'flex-1' : 'w-full')}>
        Column 2
      </View>
    </View>
  );
};
```

## Common Component Styles

### List Item

```typescript
<Pressable style={tailwind('flex-row items-center justify-between bg-white px-4 py-3 border-b border-slate-200')}>
  <View style={tailwind('flex-1')}>
    <Text style={tailwind('font-semibold text-slate-900')}>Item Title</Text>
    <Text style={tailwind('text-sm text-slate-600 mt-1')}>Subtitle</Text>
  </View>
  <Text style={tailwind('text-primary font-semibold')}>Detail</Text>
</Pressable>
```

### Input Field

```typescript
<View style={tailwind('mb-4')}>
  <Text style={tailwind('text-sm font-semibold text-slate-700 mb-2')}>
    Label
  </Text>
  <TextInput
    style={tailwind('bg-slate-50 border border-slate-300 rounded-button px-3 py-2 text-slate-900')}
    placeholder="Enter value..."
    placeholderTextColor="#999"
  />
</View>
```

### Empty State

```typescript
<View style={tailwind('flex-1 justify-center items-center px-4')}>
  <Text style={tailwind('text-2xl font-bold text-slate-900 mb-2')}>
    No Workouts Yet
  </Text>
  <Text style={tailwind('text-slate-600 text-center mb-6')}>
    Start your first run to see it appear here
  </Text>
  <Pressable style={tailwind('bg-primary px-6 py-3 rounded-button')}>
    <Text style={tailwind('text-white font-semibold')}>Start Now</Text>
  </Pressable>
</View>
```

### Loading State

```typescript
<View style={tailwind('flex-1 justify-center items-center')}>
  <ActivityIndicator size="large" color={tailwind('text-primary').color} />
  <Text style={tailwind('text-slate-600 mt-4')}>Loading workouts...</Text>
</View>
```

## Performance Considerations

### Avoid Inline Styles

❌ Bad:

```typescript
<Text style={{ color: '#000', fontSize: 16 }}>Text</Text>
```

✅ Good:

```typescript
<Text style={tailwind('text-slate-900 text-base')}>Text</Text>
```

### Reusable Style Objects

```typescript
// Define at module level, not in component
const styles = {
  card: tailwind('bg-white rounded-card p-4 shadow-card'),
  metric: tailwind('text-metric font-bold text-primary'),
  label: tailwind('text-xs text-slate-500 uppercase tracking-wide'),
};

// Usage in component
<View style={styles.card}>
  <Text style={styles.metric}>5.2</Text>
  <Text style={styles.label}>Distance</Text>
</View>
```

## Success Criteria

Your work is complete when:

1. All styles use Tailwind utility classes
2. Colors use semantic names from design system
3. Spacing follows consistent scale
4. Typography hierarchy is clear and consistent
5. Components are responsive and adaptable
6. Dark mode is supported (if required)
7. Performance optimizations are applied
8. Accessibility contrast ratios are met (WCAG AA)
