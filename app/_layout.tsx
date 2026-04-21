import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const hydrateProfile = useProfileStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
    void hydrateProfile();
  }, [hydrate, hydrateProfile]);

  // Show a blank splash-coloured screen while reading from SecureStore
  if (isHydrating) {
    return <View style={{ flex: 1, backgroundColor: "#FF6B35" }} />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      {!isLoggedIn && <Redirect href="/auth" />}
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
