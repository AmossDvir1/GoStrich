import { RunDrawer } from "@/components/run-drawer";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { useRunSession } from "@/hooks/use-run-session";
import { useProfileStore } from "@/stores/profileStore";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const PILL_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
} as const;

const DRAWER_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: -8 },
  elevation: 12,
} as const;

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const { profile } = useProfileStore();

  const {
    permissionStatus,
    requestPermission,
    currentLocation,
    locationName,
    isLoadingLocation,
  } = useLocation();

  const { runState, elapsed, distanceKm, routeCoords, handleStart, handlePause, handleResume, handleEnd } =
    useRunSession(locationName);

  const isRunning = runState === "running";

  const gpsDotColor =
    permissionStatus === "granted" && currentLocation
      ? c.primary
      : permissionStatus === "granted"
        ? "#F59E0B"
        : permissionStatus === "denied"
          ? "#EF4444"
          : "#9CA3AF";

  const region = currentLocation
    ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }
    : undefined;

  const initials =
    (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase() ||
    "?";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.background }}>
      {/* Top bar */}
      <View className="flex-row justify-between px-5 pt-2 pb-1">
        <Pressable
          className="flex-row items-center gap-x-1.5 px-3.5 py-2 rounded-full overflow-hidden"
          style={[{ backgroundColor: c.surface }, PILL_SHADOW]}
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          {profile.photoUrl ? (
            <Image
              source={{ uri: profile.photoUrl }}
              style={{ width: 26, height: 26, borderRadius: 13 }}
              contentFit="cover"
            />
          ) : (
            <Text className="text-sm font-bold" style={{ color: c.textPrimary }}>
              {initials}
            </Text>
          )}
        </Pressable>

        <View
          className="flex-row items-center gap-x-1.5 px-3.5 py-2 rounded-full overflow-hidden"
          style={[{ backgroundColor: c.surface }, PILL_SHADOW]}
        >
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: gpsDotColor }} />
          <Text className="text-[13px] font-semibold" style={{ color: c.textSecondary }}>
            {permissionStatus === "granted" && currentLocation
              ? "GPS"
              : permissionStatus === "denied"
                ? "No GPS"
                : "GPS..."}
          </Text>
        </View>
      </View>

      {/* Map */}
      {permissionStatus === "granted" ? (
        <View className="flex-1 overflow-hidden">
          {region ? (
            <MapView
              provider={PROVIDER_DEFAULT}
              style={StyleSheet.absoluteFill}
              initialRegion={region}
              showsUserLocation
              followsUserLocation={isRunning}
              showsMyLocationButton={false}
              showsCompass={false}
              toolbarEnabled={false}
            >
              {routeCoords.length > 1 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={c.primary}
                  strokeWidth={4}
                />
              )}
            </MapView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={c.primary} size="large" />
              <Text className="text-[13px] text-center px-8 mt-3" style={{ color: c.textSecondary }}>
                {isLoadingLocation ? "Locating..." : "Getting location..."}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: scheme === "dark" ? "#111827" : "#E5E7EB" }}
        >
          <Text className="text-3xl">{"📍"}</Text>
          <Text className="text-[13px] text-center px-8 mt-3" style={{ color: c.textSecondary }}>
            {permissionStatus === "denied"
              ? "Location access denied. Tap below to open Settings."
              : "Location is needed to show the map."}
          </Text>
          <Pressable
            onPress={() =>
              permissionStatus === "denied"
                ? void Linking.openSettings()
                : void requestPermission()
            }
            className="px-6 py-3 rounded-full mt-4"
            style={{ backgroundColor: c.primary }}
            accessibilityRole="button"
          >
            <Text className="text-white font-bold text-sm">
              {permissionStatus === "denied" ? "Open Settings" : "Allow Location"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Bottom drawer */}
      <View
        className="rounded-t-[28px] pb-8"
        style={[{ backgroundColor: c.surface }, DRAWER_SHADOW]}
      >
        <View className="self-center w-10 h-1 rounded mt-3 mb-1" style={{ backgroundColor: c.border }} />
        <View className="px-7 pt-2 pb-1">
          <RunDrawer
            runState={runState}
            elapsed={elapsed}
            distanceKm={distanceKm}
            locationName={locationName}
            onStart={() => void handleStart()}
            onPause={handlePause}
            onResume={() => void handleResume()}
            onEnd={handleEnd}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}