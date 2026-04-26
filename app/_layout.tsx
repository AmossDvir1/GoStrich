import { ActiveRunIndicator } from "@/components/active-run-indicator";
import { GlobalTopNav } from "@/components/global-top-nav";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { TamaguiProvider, YStack } from "tamagui";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/stores/appStore";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import appTamaguiConfig from "../tamagui.config";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const c = Colors[scheme];
  const pathname = usePathname();
  const themeVariant = useAppStore((s) => s.themeVariant);
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const hydrateProfile = useProfileStore((s) => s.hydrate);

  const showGlobalNav =
    isLoggedIn &&
    (pathname === "/" ||
      pathname.includes("/history") ||
      pathname === "/profile");

  const [fontsLoaded, fontError] = useFonts({
    // Montserrat fonts
    "Montserrat-Thin": require("../assets/fonts/Montserrat/Montserrat-Thin.ttf"),
    "Montserrat-ExtraLight": require("../assets/fonts/Montserrat/Montserrat-ExtraLight.ttf"),
    "Montserrat-Light": require("../assets/fonts/Montserrat/Montserrat-Light.ttf"),
    "Montserrat-Regular": require("../assets/fonts/Montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Italic": require("../assets/fonts/Montserrat/Montserrat-Italic.ttf"),
    "Montserrat-Medium": require("../assets/fonts/Montserrat/Montserrat-Medium.ttf"),
    "Montserrat-SemiBold": require("../assets/fonts/Montserrat/Montserrat-SemiBold.ttf"),
    "Montserrat-Bold": require("../assets/fonts/Montserrat/Montserrat-Bold.ttf"),
    "Montserrat-ExtraBold": require("../assets/fonts/Montserrat/Montserrat-ExtraBold.ttf"),
    "Montserrat-Black": require("../assets/fonts/Montserrat/Montserrat-Black.ttf"),
    // KoHo fonts
    "KoHo-Light": require("../assets/fonts/KoHo/KoHo-Light.ttf"),
    "KoHo-LightItalic": require("../assets/fonts/KoHo/KoHo-LightItalic.ttf"),
    "KoHo-Regular": require("../assets/fonts/KoHo/KoHo-Regular.ttf"),
    "KoHo-Italic": require("../assets/fonts/KoHo/KoHo-Italic.ttf"),
    "KoHo-Medium": require("../assets/fonts/KoHo/KoHo-Medium.ttf"),
    "KoHo-MediumItalic": require("../assets/fonts/KoHo/KoHo-MediumItalic.ttf"),
    "KoHo-SemiBold": require("../assets/fonts/KoHo/KoHo-SemiBold.ttf"),
    "KoHo-SemiBoldItalic": require("../assets/fonts/KoHo/KoHo-SemiBoldItalic.ttf"),
    "KoHo-Bold": require("../assets/fonts/KoHo/KoHo-Bold.ttf"),
    "KoHo-BoldItalic": require("../assets/fonts/KoHo/KoHo-BoldItalic.ttf"),
  });

  useEffect(() => {
    void hydrate();
    void hydrateProfile();
  }, [hydrate, hydrateProfile]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const tamaguiThemeName = `${themeVariant}_${scheme}` as
    | "ostrich_light"
    | "ostrich_dark"
    | "classic_light"
    | "classic_dark";

  return (
    <TamaguiProvider
      key={tamaguiThemeName}
      config={appTamaguiConfig}
      defaultTheme={tamaguiThemeName}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {isHydrating ? (
          <YStack flex={1} backgroundColor={c.background} />
        ) : (
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="profile"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="session/[id]"
                options={{ headerShown: false, animation: "slide_from_bottom" }}
              />
              <Stack.Screen
                name="palette"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="theme"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            {showGlobalNav && <GlobalTopNav />}
            {isLoggedIn && <ActiveRunIndicator />}
            {!isLoggedIn && <Redirect href="/auth" />}
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          </ThemeProvider>
        )}
      </GestureHandlerRootView>
    </TamaguiProvider>
  );
}
