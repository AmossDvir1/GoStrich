import { RunDrawer } from "@/components/run-drawer";
import { Colors, MapStyles } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { useRunSession } from "@/hooks/use-run-session";
import { useProfileStore } from "@/stores/profileStore";
import { formatPace } from "@/utils/formatting";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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

const DRAWER_EXTRA_HEIGHT = 96;
const SNAP_SPRING = {
  damping: 50,
  stiffness: 300,
  overshootClamping: true,
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

  const {
    runState,
    elapsed,
    distanceKm,
    routeCoords,
    handleStart,
    handlePause,
    handleResume,
    handleEnd,
  } = useRunSession(locationName);

  const isRunning = runState === "running";

  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const drawerExpansion = useSharedValue(0);
  const dragStart = useSharedValue(0);

  const expandStyle = useAnimatedStyle(() => ({
    height: drawerExpansion.value,
    overflow: "hidden",
  }));

  const paceSecsPerKm = distanceKm > 0 ? elapsed / distanceKm : 0;
  const caloriesKcal = Math.round(
    distanceKm * (profile.weightKg ?? 70) * 1.036,
  );

  const toggleExpanded = useCallback(() => {
    const toExpand = drawerExpansion.value < DRAWER_EXTRA_HEIGHT / 2;
    const target = toExpand ? DRAWER_EXTRA_HEIGHT : 0;
    drawerExpansion.value = withSpring(target, SNAP_SPRING);
    setIsExpanded(toExpand);
  }, [drawerExpansion]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .onBegin(() => {
          dragStart.value = drawerExpansion.value;
        })
        .onUpdate((e) => {
          drawerExpansion.value = Math.max(
            0,
            Math.min(DRAWER_EXTRA_HEIGHT, dragStart.value - e.translationY),
          );
        })
        .onEnd((e) => {
          const shouldExpand =
            drawerExpansion.value > DRAWER_EXTRA_HEIGHT / 2 ||
            e.velocityY < -200;
          const target = shouldExpand ? DRAWER_EXTRA_HEIGHT : 0;
          drawerExpansion.value = withSpring(target, SNAP_SPRING);
          runOnJS(setIsExpanded)(shouldExpand);
        }),
    [drawerExpansion, dragStart],
  );

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
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: c.background }}
    >
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
            <Text
              className="text-sm font-bold"
              style={{ color: c.textPrimary }}
            >
              {initials}
            </Text>
          )}
        </Pressable>

        <View
          className="flex-row items-center gap-x-1.5 px-3.5 py-2 rounded-full overflow-hidden"
          style={[{ backgroundColor: c.surface }, PILL_SHADOW]}
        >
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: gpsDotColor }}
          />
          <Text
            className="text-[13px] font-semibold"
            style={{ color: c.textSecondary }}
          >
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
              customMapStyle={
                scheme === "dark" ? MapStyles.dark : MapStyles.light
              }
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
              <Text
                className="text-[13px] text-center px-8 mt-3"
                style={{ color: c.textSecondary }}
              >
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
          <Text
            className="text-[13px] text-center px-8 mt-3"
            style={{ color: c.textSecondary }}
          >
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
              {permissionStatus === "denied"
                ? "Open Settings"
                : "Allow Location"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Bottom drawer — GestureDetector wraps the whole card so the user can drag from anywhere */}
      <GestureDetector gesture={panGesture}>
        <View
          className="rounded-t-[28px]"
          style={[
            {
              backgroundColor: c.surface,
              paddingBottom: Math.max(insets.bottom, 20),
            },
            DRAWER_SHADOW,
          ]}
        >
          {/* Handle pill — Pressable handles tap; pan is caught by the outer GestureDetector */}
          <Pressable
            onPress={toggleExpanded}
            style={{
              alignSelf: "center",
              paddingVertical: 10,
              paddingHorizontal: 32,
            }}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? "Collapse stats" : "Expand stats"}
            accessibilityState={{ expanded: isExpanded }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: isExpanded ? c.primary : c.border,
              }}
            />
          </Pressable>

          {/* Run controls */}
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

          {/* Stats panel — slides in below controls when card is dragged up */}
          <Animated.View style={expandStyle}>
            <View
              style={{
                marginHorizontal: 28,
                paddingTop: 12,
                paddingBottom: 14,
                borderTopWidth: 1,
                borderTopColor: c.border,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: c.textPrimary,
                  }}
                >
                  {paceSecsPerKm > 0 ? formatPace(paceSecsPerKm) : "--"}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    marginTop: 2,
                    color: c.textSecondary,
                  }}
                >
                  Avg Pace
                </Text>
              </View>
              <View
                style={{ width: 1, height: 40, backgroundColor: c.border }}
              />
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: c.textPrimary,
                  }}
                >
                  {caloriesKcal > 0 ? String(caloriesKcal) : "--"}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    marginTop: 2,
                    color: c.textSecondary,
                  }}
                >
                  kcal
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </SafeAreaView>
  );
}
