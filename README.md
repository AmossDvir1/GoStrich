# 🏃 GoStrich - Offline-First Running Tracker

A high-performance running tracker app built with React Native + Expo, featuring real-time GPS tracking, live metrics, and local-only data storage (100% offline-first).

## 🎯 Project Status

**Current Phase**: Phase 1 ✅ Complete (Setup & Navigation)

- ✅ Expo project initialized
- ✅ React Navigation (tab-based)
- ✅ TypeScript strict mode
- ✅ Zustand state management
- ✅ Tailwind CSS styling
- 🔄 Phase 2: Map & UI Components (coming next)

## 📁 Project Structure

```
src/
├── App.tsx                    # Root component
├── screens/                   # Screen components
│   ├── HomeScreen.tsx        # Active run tracking
│   ├── HistoryScreen.tsx     # Workout history
│   ├── SettingsScreen.tsx    # App settings
│   └── WorkoutDetailScreen.tsx
├── components/
│   └── navigation/            # Navigation setup
├── types/                     # TypeScript types
├── stores/                    # Zustand stores
├── hooks/                     # Custom React hooks
├── services/                  # Business logic (Phase 2+)
├── utils/                     # Utility functions
└── database/                  # Database setup (Phase 5)
```

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Running Locally

```bash
npm start
```

Then choose your platform:
- **Press `w`** → Web browser (easiest on Windows)
- **Press `i`** → iOS simulator
- **Press `a`** → Android emulator

### Running on Your Phone

#### Option 1: Scan QR Code (Recommended)
1. Download **Expo Go** app:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Keep terminal running: `npm start`
3. Open Expo Go app and **scan the QR code** shown in terminal
4. App loads on your phone! 📱

#### Option 2: Same WiFi (Android)
1. Phone on same WiFi as computer
2. Run: `npm start`
3. Press `a` in terminal
4. App opens on Android device

#### Option 3: Tunnel (Works Anywhere)
```bash
npm start -- --tunnel
```
Creates remote tunnel - works even without same WiFi

## 📝 Available Scripts

```bash
npm start              # Start dev server
npm run android        # Open Android emulator
npm run ios           # Open iOS simulator
npm run web           # Open web browser
npm run type-check    # Check TypeScript errors
npm run lint          # Run ESLint
npm test              # Run tests
npm test:watch        # Run tests in watch mode
```

## 🎨 Technology Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript (strict mode)
- **State**: Zustand
- **Styling**: Tailwind CSS (react-native-tailwindcss)
- **Navigation**: React Navigation 6
- **Maps**: react-native-maps (Phase 2+)
- **GPS**: expo-location (Phase 3)
- **Database**: WatermelonDB (Phase 5)

## 📱 App Features

### Current (Phase 1)
- ✅ Bottom tab navigation (Run, History, Settings)
- ✅ Active run tracking screen
- ✅ Settings panel with preferences
- ✅ Workout history placeholder
- ✅ Full TypeScript typing

### Coming Soon
- 🔄 Live GPS tracking with map
- 🔄 Real-time metrics (distance, pace, duration)
- 🔄 Workout history with analytics
- 🔄 Offline data persistence
- 🔄 Performance optimization

## 🧪 Testing

### Manual Testing Checklist
- [ ] App starts without errors
- [ ] Can tap between tabs (Run, History, Settings)
- [ ] Run tab shows Start button
- [ ] Tap Start → button changes to Pause/Stop
- [ ] Tap Pause → button changes to Resume
- [ ] Tap Stop → back to Start
- [ ] Settings show unit toggle
- [ ] History tab loads placeholder

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🔧 Development Workflow

1. **Make code changes**
   - TypeScript catches errors before runtime
   - Auto-reload on save

2. **Check types**
   ```bash
   npm run type-check
   ```

3. **Check linting**
   ```bash
   npm run lint
   ```

4. **Test on device**
   - Expo Go app for real device testing
   - Web browser for quick testing

## 🗺️ Roadmap

### Phase 1: ✅ Complete
- Project setup & navigation
- Basic screens and state management

### Phase 2: Map & UI Components
- MapView integration
- MetricsDisplay component
- TrackingControls component
- UI component library

### Phase 3: GPS & Permissions
- Location permission handling
- Real-time GPS tracking
- GPS point validation

### Phase 4: Tracking Engine
- Start/pause/stop logic
- Metrics calculations
- Real-time updates

### Phase 5: Database
- WatermelonDB setup
- Workout persistence
- History loading

### Phase 6: Polyline Drawing
- Real-time map updates
- Route visualization
- Polyline simplification

### Phase 7: History & Analytics
- Workout list
- Detailed analytics
- Historical data display

### Phase 8: Optimization
- Performance tuning
- Battery optimization
- Polish & refinement

## 🐛 Troubleshooting

### `npm install` fails
```bash
npm cache clean --force
npm install
```

### App won't start
```bash
npx expo prebuild --clean
npm start
```

### TypeScript errors
```bash
npm run type-check
# Fix reported issues in source files
```

### Connection issues
- Ensure phone and computer are on same WiFi
- Try clearing Expo cache: `npx expo-cli web --reset-cache`
- Use tunnel mode: `npm start -- --tunnel`

## 📚 Documentation

- [TECHNICAL_PLAN.md](.github/TECHNICAL_PLAN.md) - Architecture & tech stack
- [LOGIC_FLOW.md](.github/LOGIC_FLOW.md) - Data flow diagrams
- [QUICK_REFERENCE.md](.github/QUICK_REFERENCE.md) - Quick lookup guide
- [PHASE_1_COMPLETE_SUMMARY.md](.github/PHASE_1_COMPLETE_SUMMARY.md) - Phase 1 details

## 📦 Dependencies

See `package.json` for complete list. Key dependencies:
- expo@54.0.33
- react@19.1.0
- react-native@0.81.5
- zustand@4.4.0
- react-native-tailwindcss@1.2.0

## 🙋 Support

For questions about:
- **Architecture**: See TECHNICAL_PLAN.md
- **Data flow**: See LOGIC_FLOW.md
- **Implementation**: See relevant phase guide

## 📄 License

This project is part of GoStrich development.

---

**Built with ❤️ for runners, by Copilot**

🏃‍♂️ Get out there and crush those runs! 🏃‍♀️
