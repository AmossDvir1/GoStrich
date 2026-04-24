import { RunDrawer } from "@/components/run-drawer";
import { Colors, MapStyles } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { useRunSession } from "@/hooks/use-run-session";
import { useAppStore } from "@/stores/appStore";
import { useProfileStore } from "@/stores/profileStore";
import { formatPace } from "@/utils/formatting";
import { SizableText, YStack } from "tamagui";

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PILL_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
} as const;

const DRAWER_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: -4 },
  elevation: 12,
} as const;

// Fixed drawer heights in pixels
const DRAWER_COLLAPSED_PX = 198; // handle + metrics row + button row
const DRAWER_EXPANDED_PX = 300; // + stats row
const DRAG_THRESHOLD = 40; // px to trigger snap

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const { profile } = useProfileStore();
  const { unitSystem } = useAppStore();

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
  const mapRef = useRef<MapView>(null);

  // true = expanded, false = collapsed
  const [isExpanded, setIsExpanded] = useState(false);

  // Animated drawer height
  const drawerHeight = useSharedValue(DRAWER_COLLAPSED_PX);
  const dragStart = useSharedValue(DRAWER_COLLAPSED_PX);

  const snapTo = useCallback(
    (expanded: boolean) => {
      const target = expanded ? DRAWER_EXPANDED_PX : DRAWER_COLLAPSED_PX;
      drawerHeight.value = withTiming(target, { duration: 250 });
      setIsExpanded(expanded);
    },
    [drawerHeight],
  );

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      dragStart.value = drawerHeight.value;
    })
    .onUpdate((e) => {
      // Dragging up = negative translationY → increases height
      const next = dragStart.value - e.translationY;
      drawerHeight.value = Math.max(
        DRAWER_COLLAPSED_PX,
        Math.min(DRAWER_EXPANDED_PX, next),
      );
    })
    .onEnd((e) => {
      // Snap based on velocity or distance threshold
      const shouldExpand =
        e.velocityY < -200 ||
        drawerHeight.value > DRAWER_COLLAPSED_PX + DRAG_THRESHOLD;
      runOnJS(snapTo)(!shouldExpand ? false : true);
    });

  const drawerAnimStyle = useAnimatedStyle(() => ({
    height: drawerHeight.value,
  }));

  // Map bottom = drawer height (drawer sits at bottom, map ends where drawer starts)
  const mapAnimStyle = useAnimatedStyle(() => ({
    bottom: drawerHeight.value,
  }));

  const centerBtnAnimStyle = useAnimatedStyle(() => ({
    bottom: drawerHeight.value + 16,
  }));

  const paceSecsPerKm = distanceKm > 0 ? elapsed / distanceKm : 0;
  const avgSpeedKmh = elapsed > 0 ? distanceKm / (elapsed / 3600) : 0;

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
    <YStack flex={1} backgroundColor={c.surface}>
      {/* Layer 0: Map — bottom edge tracks the top of the drawer so they never overlap */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
          },
          mapAnimStyle,
        ]}
      >
        {permissionStatus === "granted" ? (
          region ? (
            <MapView
              ref={mapRef}
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
            <YStack flex={1} alignItems="center" justifyContent="center">
              <ActivityIndicator color={c.primary} size="large" />
              <SizableText
                size="$3"
                textAlign="center"
                paddingHorizontal="$8"
                marginTop="$3"
                color={c.textSecondary}
              >
                {isLoadingLocation ? "Locating..." : "Getting location..."}
              </SizableText>
            </YStack>
          )
        ) : (
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            backgroundColor={scheme === "dark" ? "#111827" : "#E5E7EB"}
          >
            <SizableText size="$8">{"📍"}</SizableText>
            <SizableText
              size="$3"
              textAlign="center"
              paddingHorizontal="$8"
              marginTop="$3"
              color={c.textSecondary}
            >
              {permissionStatus === "denied"
                ? "Location access denied. Tap below to open Settings."
                : "Location is needed to show the map."}
            </SizableText>
            <Pressable
              onPress={() =>
                permissionStatus === "denied"
                  ? void Linking.openSettings()
                  : void requestPermission()
              }
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 999,
                marginTop: 16,
                backgroundColor: c.primary,
              }}
              accessibilityRole="button"
            >
              <SizableText size="$3" fontWeight="700" color="white">
                {permissionStatus === "denied"
                  ? "Open Settings"
                  : "Allow Location"}
              </SizableText>
            </Pressable>
          </YStack>
        )}
      </Animated.View>

      {/* Layer 1b: Center-on-me button — bottom-right, above the sheet */}
      {permissionStatus === "granted" && currentLocation && (
        <Animated.View
          style={[{ position: "absolute", right: 16 }, centerBtnAnimStyle]}
        >
          <Pressable
            onPress={() => {
              if (region) {
                mapRef.current?.animateToRegion(region, 400);
              }
            }}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.75 : 1,
              ...PILL_SHADOW,
            })}
            accessibilityRole="button"
            accessibilityLabel="Center map on my location"
          >
            <View
              style={{
                width: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: c.primary,
                  opacity: 0.25,
                  position: "absolute",
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: c.primary,
                }}
              />
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* Gradient fade — darkens map top so profile/GPS buttons are always legible */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          height: 115,
          zIndex: 5,
        }}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "transparent"]}
          style={{ flex: 1 }}
        />
      </View>

      {/* Layer 2: Top overlay — profile button (left) + GPS badge (right) */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Profile avatar button */}
        <Pressable
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={({ pressed }) => [
            {
              width: 55,
              height: 55,
              borderRadius: 99,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
              borderWidth: 1.5,
              borderColor: "rgba(255,255,255,0.35)",
            },
            PILL_SHADOW,
          ]}
        >
          {profile.photoUrl ? (
            <Image
              source={{ uri: profile.photoUrl }}
              style={{ width: 52, height: 52, borderRadius: 99 }}
              contentFit="cover"
            />
          ) : (
            <SizableText size="$2" fontWeight="800" color={c.textPrimary}>
              {initials}
            </SizableText>
          )}
        </Pressable>

        {/* GPS badge */}
        <View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: c.surface,
            },
            PILL_SHADOW,
          ]}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: gpsDotColor,
            }}
          />
          <SizableText size="$1" fontWeight="700" color={c.textSecondary}>
            {permissionStatus === "granted" && currentLocation
              ? "GPS"
              : permissionStatus === "denied"
                ? "No GPS"
                : "GPS..."}
          </SizableText>
        </View>
      </View>

      {/* Bottom drawer — custom absolute panel, no white gap */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: c.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: Math.max(insets.bottom, 16),
              overflow: "hidden",
            },
            DRAWER_SHADOW,
            drawerAnimStyle,
          ]}
        >
          {/* Handle pill — green when expanded, grey when collapsed */}
          <Pressable
            onPress={() => snapTo(!isExpanded)}
            style={{ alignItems: "center", paddingTop: 8, paddingBottom: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Toggle drawer"
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: isExpanded ? c.primary : c.border,
              }}
            />
          </Pressable>

          {/* Run controls */}
          <YStack paddingHorizontal="$7" paddingBottom="$1">
            <RunDrawer
              runState={runState}
              elapsed={elapsed}
              distanceKm={distanceKm}
              unitSystem={unitSystem}
              locationName={locationName}
              locationReady={!!currentLocation}
              onStart={() => void handleStart()}
              onPause={handlePause}
              onResume={() => void handleResume()}
              onEnd={handleEnd}
            />
          </YStack>

          {/* Stats row — always rendered, hidden when collapsed via opacity */}
          <Animated.View
            style={[
              {
                flexDirection: "row",
                borderTopWidth: 1,
                borderTopColor: c.border,
                marginTop: 20,
                paddingTop: 20,
                paddingBottom: 20,
                opacity: isExpanded ? 1 : 0,
              },
            ]}
            pointerEvents={isExpanded ? "auto" : "none"}
          >
            <YStack flex={1} alignItems="center">
              <SizableText size="$7" fontWeight="900" color={c.textPrimary}>
                {paceSecsPerKm > 0 ? formatPace(paceSecsPerKm) : "--"}
              </SizableText>
              <SizableText
                size="$1"
                fontWeight="600"
                marginTop="$1"
                color={c.textSecondary}
                textTransform="uppercase"
                letterSpacing={1}
              >
                Avg Pace
              </SizableText>
            </YStack>
            <View
              style={{
                width: 1,
                height: 30,
                backgroundColor: c.border,
                opacity: 0.5,
                alignSelf: "center",
              }}
            />
            <YStack flex={1} alignItems="center">
              <SizableText size="$7" fontWeight="900" color={c.textPrimary}>
                {avgSpeedKmh > 0 ? avgSpeedKmh.toFixed(1) : "--"}
              </SizableText>
              <SizableText
                size="$1"
                fontWeight="600"
                marginTop="$1"
                color={c.textSecondary}
                textTransform="uppercase"
                letterSpacing={1}
              >
                km/h
              </SizableText>
            </YStack>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </YStack>
  );
}
