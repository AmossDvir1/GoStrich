import { RunCountdown } from "@/components/run-countdown";
import { RunDrawer } from "@/components/run-drawer";
import { Colors, MapStyles } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { useRunSession } from "@/hooks/use-run-session";
import { useAppStore } from "@/stores/appStore";
import { formatPace, formatSpeed } from "@/utils/formatting";
import { SizableText, YStack } from "tamagui";

import { LinearGradient } from "expo-linear-gradient";
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
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
} as const;

const DRAWER_SHADOW = {
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
  const { unitSystem, countdownEnabled, setCountdownEnabled } = useAppStore();

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

  const [showCountdown, setShowCountdown] = useState(false);

  const handleCountdownFinish = useCallback(() => {
    setShowCountdown(false);
    void handleStart();
  }, [handleStart]);

  const handleStartPress = useCallback(() => {
    if (countdownEnabled) {
      setShowCountdown(true);
      return;
    }
    void handleStart();
  }, [countdownEnabled, handleStart]);

  const handleToggleCountdown = useCallback(() => {
    setCountdownEnabled(!countdownEnabled);
  }, [countdownEnabled, setCountdownEnabled]);

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
    bottom: drawerHeight.value + Math.max(insets.bottom, 12) + 24,
  }));

  const paceSecsPerKm = distanceKm > 0 ? elapsed / distanceKm : 0;
  const avgSpeedKmh = elapsed > 0 ? distanceKm / (elapsed / 3600) : 0;
  const avgSpeedDisplay =
    avgSpeedKmh > 0
      ? formatSpeed(avgSpeedKmh, unitSystem, { includeUnit: false })
      : "--";
  const avgSpeedUnit = unitSystem === "imperial" ? "mph" : "km/h";

  const region = currentLocation
    ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }
    : undefined;

  return (
    <YStack flex={1} backgroundColor={c.surface}>
      {/* Layer 0: Map — fills full screen behind the floating nav */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
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
            backgroundColor={c.background}
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
          style={[
            { position: "absolute", right: 16, zIndex: 15 },
            centerBtnAnimStyle,
          ]}
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
              shadowColor: c.textPrimary,
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

      {/* Subtle gradient to help the glass nav read over the map */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + 90,
          zIndex: 5,
        }}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.22)", "transparent"]}
          style={{ flex: 1 }}
        />
      </View>

      {/* Bottom drawer — custom absolute panel, no white gap */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: Math.max(insets.bottom, 12),
              left: 0,
              right: 0,
              backgroundColor: c.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingBottom: 16,
              overflow: "hidden",
            },
            DRAWER_SHADOW,
            { shadowColor: c.textPrimary },
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
              countdownEnabled={countdownEnabled}
              onToggleCountdown={handleToggleCountdown}
              onStart={handleStartPress}
              onPause={handlePause}
              onResume={() => void handleResume()}
              onEnd={handleEnd}
            />
          </YStack>

          {/* Countdown overlay — shown after slide, before run starts */}
          <RunCountdown
            visible={showCountdown}
            onFinish={handleCountdownFinish}
          />

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
                {paceSecsPerKm > 0
                  ? formatPace(paceSecsPerKm, unitSystem)
                  : "--"}
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
                {avgSpeedDisplay}
              </SizableText>
              <SizableText
                size="$1"
                fontWeight="600"
                marginTop="$1"
                color={c.textSecondary}
                textTransform="uppercase"
                letterSpacing={1}
              >
                {avgSpeedUnit}
              </SizableText>
            </YStack>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </YStack>
  );
}
