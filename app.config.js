// app.config.js — dynamic Expo config that can read environment variables.
// This replaces app.json. Delete app.json once you've verified the build works.
// Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file (and in EAS secrets for CI).

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: "GoStrich",
  slug: "gostrich",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "gostrich",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.advir.gostrich",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "GoStrich needs your location to track your runs in real-time.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "GoStrich needs background location access to keep tracking your run when the app is in the background.",
      NSLocationAlwaysUsageDescription:
        "GoStrich needs background location access to keep tracking your run when the app is in the background.",
    },
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E9E8E2",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
    ],
    package: "com.advir.gostrich",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-font",
      {
        fonts: [
          "./assets/fonts/Montserrat/Montserrat-Thin.ttf",
          "./assets/fonts/Montserrat/Montserrat-ExtraLight.ttf",
          "./assets/fonts/Montserrat/Montserrat-Light.ttf",
          "./assets/fonts/Montserrat/Montserrat-Regular.ttf",
          "./assets/fonts/Montserrat/Montserrat-Italic.ttf",
          "./assets/fonts/Montserrat/Montserrat-Medium.ttf",
          "./assets/fonts/Montserrat/Montserrat-SemiBold.ttf",
          "./assets/fonts/Montserrat/Montserrat-Bold.ttf",
          "./assets/fonts/Montserrat/Montserrat-ExtraBold.ttf",
          "./assets/fonts/Montserrat/Montserrat-Black.ttf",
        ],
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#E9E8E2",
      },
    ],
    "expo-asset",
    "expo-secure-store",
    "expo-image-picker",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "GoStrich needs background location access to keep tracking your run when the app is in the background.",
        locationAlwaysPermission:
          "GoStrich needs background location access to keep tracking your run.",
        locationWhenInUsePermission:
          "GoStrich needs your location to track your runs in real-time.",
      },
    ],
    "@react-native-google-signin/google-signin",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
