# 🏃 GoStrich - Offline-First Running Tracker

A high-performance running tracker app for iOS and Android, built with React Native 0.81 + Expo 54, featuring real-time GPS tracking, live metrics, and 100% on-device data storage (offline-first).

**Status**: ✅ MVP Complete (Phases 1-4)

---

## 🎯 Features

- ✅ **Google Sign-In** - Secure authentication with encrypted session
- ✅ **Live GPS Tracking** - Real-time location updates (foreground only, 1 sec / 2 m intervals)
- ✅ **Real-time Metrics** - Distance (Haversine), pace, duration calculated live
- ✅ **Interactive Maps** - Google Maps with live polyline route
- ✅ **Workout History** - View and delete past sessions
- ✅ **Session Summary** - Post-run stats screen with map replay
- ✅ **User Profile** - Name, weight, height, photo management
- ✅ **Dark Mode** - Automatic + manual toggle
- ✅ **Unit System** - Metric/Imperial toggle
- ✅ **Mascot Animation** - Rive ostrich character

---

## 🛠 Technology Stack

| Layer | Tech | Version |
|-------|------|---------|
| **Framework** | React Native + Expo | 0.81 / 54 |
| **Language** | TypeScript | 5.9 |
| **State** | Zustand | 5.0 |
| **Storage** | AsyncStorage + SecureStore | 2.2 / 15.0 |
| **Location** | expo-location | 19.0 |
| **Maps** | react-native-maps | 1.20 |
| **Styling** | NativeWind | 4.1 |
| **Auth** | Google Sign-In | 16.1 |
| **Animation** | Rive + React Native Reanimated | 9.8 / 4.1 |

**See [TECH_STACK.md](.github/TECH_STACK.md)** for comprehensive dependency breakdown.

---

## 📁 Project Structure

```
app/                      # Expo Router (file-based navigation)
├── _layout.tsx           # Root layout + auth guard
├── auth.tsx              # Google Sign-In screen
├── profile.tsx           # Profile settings
├── (tabs)/
│   ├── index.tsx         # Home/Run screen (live map)
│   ├── history.tsx       # Workout history list
│   └── settings.tsx      # App settings
└── session/[id].tsx      # Post-run summary

components/               # Reusable UI components
├── run-drawer.tsx        # Live metrics HUD
└── ui/                   # Icon, character components

hooks/
├── use-run-session.ts    # Core tracking engine
├── use-location.ts       # Permission handling
└── use-color-scheme.ts   # Theme detection

stores/                   # Zustand stores
├── authStore.ts          # Google Sign-In session
├── profileStore.ts       # User profile
├── workoutStore.ts       # Workout history
├── appStore.ts           # Settings
└── trackingStore.ts      # Active run state

services/                 # Business logic
├── gps/                  # GPS service
├── tracking/             # Tracking logic
└── workout/              # Persistence

types/                    # TypeScript interfaces
constants/                # Theme colors
utils/                    # Formatting helpers
assets/                   # Images, ostrich.riv
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- Expo CLI (optional, uses npx)

### Installation

```bash
npm install
```

### Environment Setup

Create `.env` file:
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
```

Get your Google Client ID:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID (Android/iOS)
3. Copy the ID to `.env`

### Running Locally

#### Start Dev Server
```bash
npm start
```

#### Run on Web (Easiest - Windows/Mac/Linux)
```bash
npm run web
# Or press 'w' in the dev server terminal
```

#### Run on iOS Simulator
```bash
npm run ios
```

#### Run on Android Emulator
```bash
npm run android
```

#### Run on Physical Device
1. Install **Expo Go** from App Store / Play Store
2. Keep dev server running: `npm start`
3. Scan QR code with Expo Go app
4. App loads on your phone 📱

---

## 📝 Available Scripts

```bash
npm start              # Start dev server
npm run web           # Web browser (port 8081)
npm run ios           # iOS simulator
npm run android       # Android emulator
npm run lint          # ESLint check
npm run type-check    # TypeScript check (via expo)
```

---

## 🏗 Architecture

### Run Lifecycle

```
idle → [START] → running → [PAUSE] → paused
                              ↓ [RESUME]
                            running
                              ↓ [STOP]
                          Save workout → Session summary
```

### State Management

| Store | Backend | Scope | Persistence |
|-------|---------|-------|-------------|
| `authStore` | SecureStore | Encrypted | Encrypted key/value |
| `profileStore` | SecureStore | Encrypted | Encrypted key/value |
| `workoutStore` | AsyncStorage | Local | Summary only (GPS points stripped) |
| `appStore` | In-memory | Runtime | Settings lost on restart |
| `trackingStore` | In-memory | Runtime | Active run only |

### GPS Tracking

- **Permission**: Foreground location (iOS & Android)
- **Accuracy**: `BestForNavigation`
- **Interval**: 1 second / 2 meter accuracy threshold
- **Distance**: Haversine formula (accounts for Earth curvature)
- **Filtering**: Rejects speed > 50 km/h, accuracy > 100m

### Storage

- **Full Workouts**: Kept in-memory during session for real-time map
- **Workout Summaries**: Persisted to AsyncStorage (GPS points stripped to save space)
- **Auth/Profile**: SecureStore (encrypted, survives app restart)

---

## 🎨 Styling

### NativeWind + Tailwind CSS

```typescript
// Static layout
<View className="flex-1 gap-4 p-4" />

// Dynamic colors
<View style={{ backgroundColor: Colors[scheme].background }} />

// Combined
<Text className="text-lg font-bold dark:text-white">Distance</Text>
```

See [tailwind-css.instructions.md](.github/instructions/tailwind-css.instructions.md) for styling guidelines.

---

## 📱 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **iOS** | ✅ Tested | iOS 14+ required for Google Sign-In |
| **Android** | ✅ Tested | Android 6+ (API 23+) required |
| **Web** | ✅ Works | Limited (no GPS, maps use web backend) |

---

## 🔐 Security & Privacy

- ✅ **100% Offline** - No data leaves your device
- ✅ **Encrypted Auth** - Session stored in SecureStore (encrypted)
- ✅ **No Backend** - No server = no data breach
- ✅ **No Tracking** - No analytics, no telemetry
- ✅ **Open Storage** - All data in local AsyncStorage (user can view/export)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [TECH_STACK.md](.github/TECH_STACK.md) | Comprehensive tech stack breakdown |
| [TECHNICAL_PLAN.md](.github/TECHNICAL_PLAN.md) | Architecture, algorithms, data flow |
| [QUICK_REFERENCE.md](.github/QUICK_REFERENCE.md) | Quick lookup for developers |
| [LOGIC_FLOW.md](.github/LOGIC_FLOW.md) | Data flow diagrams |

---

## 🚦 Current Status

### ✅ Completed (MVP)

| Phase | Feature |
|-------|---------|
| 1 | Setup & Navigation |
| 2 | Map & UI Components |
| 3 | Location Permissions & GPS |
| 4 | Tracking Engine & Calculations |

### 🔄 Future Enhancements

- Background GPS tracking (requires foreground service)
- Analytics dashboard (aggregated stats, streaks)
- Social features (share runs via QR code)
- Data export (CSV, GPX formats)
- Offline map tiles
- Elevation profiles

---

## 🐛 Common Issues

### **Map not rendering on Android**
- Ensure Google Maps API key is set in app.json
- SHA-1 fingerprint must be registered in Google Cloud Console

### **GPS not updating in simulator**
- Xcode: Features → Location → Simulate a route
- Or test on physical device

### **Google Sign-In fails**
- Check `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`
- Ensure correct bundle ID / package name in Google Cloud Console

---

## 📄 License

Private project. All rights reserved.

---

## 🙋 Support

For questions or issues:
1. Check [QUICK_REFERENCE.md](.github/QUICK_REFERENCE.md)
2. Review [TECHNICAL_PLAN.md](.github/TECHNICAL_PLAN.md)
3. Check console logs with `npm start`

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
