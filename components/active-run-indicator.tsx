import { RunnerCharacter } from "@/components/ui/runner-character";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/stores/appStore";
import { useTrackingStore } from "@/stores/trackingStore";
import { formatDistance, formatDuration, formatPace } from "@/utils/formatting";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SizableText, XStack, YStack } from "tamagui";

function isRunScreen(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/(tabs)" ||
    pathname.includes("/(tabs)/index")
  );
}

const OSTRICH_SIZE = 78;
const OUTER_MARGIN = 12;
const PANEL_WIDTH = 232;
const PANEL_GAP = 10;

export function ActiveRunIndicator() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const unitSystem = useAppStore((s) => s.unitSystem);
  const status = useTrackingStore((s) => s.status);
  const metrics = useTrackingStore((s) => s.metrics);
  const pauseRun = useTrackingStore((s) => s.pauseRun);
  const resumeRun = useTrackingStore((s) => s.resumeRun);
  const endRun = useTrackingStore((s) => s.endRun);

  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);

  const positionInitialized = useRef(false);
  const { width, height } = Dimensions.get("window");
  const x = useSharedValue(width - OSTRICH_SIZE - OUTER_MARGIN);
  const y = useSharedValue(
    height - Math.max(insets.bottom + 20, 28) - OSTRICH_SIZE,
  );
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const expandedSv = useSharedValue(0);

  useEffect(() => {
    expandedRef.current = expanded;
    expandedSv.value = withSpring(expanded ? 1 : 0, {
      damping: 12,
      mass: 0.9,
      stiffness: 100,
    });
  }, [expanded, expandedSv]);

  useEffect(() => {
    if (positionInitialized.current) return;
    positionInitialized.current = true;
    x.value = width - OSTRICH_SIZE - OUTER_MARGIN;
    y.value = height - Math.max(insets.bottom + 20, 28) - OSTRICH_SIZE;
  }, [height, insets.bottom, width, x, y]);

  const shouldShow =
    (status === "running" || status === "paused") && !isRunScreen(pathname);

  const pace = useMemo(() => {
    if (metrics.distance <= 0 || metrics.duration <= 0) {
      return "--";
    }

    return formatPace(metrics.duration / metrics.distance, unitSystem);
  }, [metrics.distance, metrics.duration, unitSystem]);
  const distanceLabel = formatDistance(
    metrics.distance * 1000,
    unitSystem,
  ).split(" ")[0];

  const minY = insets.top + 8;
  const maxY = height - insets.bottom - OSTRICH_SIZE - 8;
  const minXCollapsed = OUTER_MARGIN;
  const minXExpanded = PANEL_WIDTH + PANEL_GAP + OUTER_MARGIN;
  const maxX = width - OSTRICH_SIZE - OUTER_MARGIN;

  const panGesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .activeOffsetY([-6, 6])
    .onBegin(() => {
      dragStartX.value = x.value;
      dragStartY.value = y.value;
    })
    .onUpdate((event) => {
      const rawX = dragStartX.value + event.translationX;
      const rawY = dragStartY.value + event.translationY;
      const minX = expandedSv.value > 0.5 ? minXExpanded : minXCollapsed;

      x.value = Math.min(Math.max(rawX, minX), maxX);
      y.value = Math.min(Math.max(rawY, minY), maxY);
    })
    .onEnd(() => {
      // Apply spring physics on drag end
      const minX = expandedSv.value > 0.5 ? minXExpanded : minXCollapsed;
      x.value = withSpring(Math.min(Math.max(x.value, minX), maxX), {
        damping: 10,
        mass: 1,
        stiffness: 85,
      });
      y.value = withSpring(Math.min(Math.max(y.value, minY), maxY), {
        damping: 10,
        mass: 1,
        stiffness: 85,
      });
    });

  const handleOstrichPress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpanded(!expandedRef.current);
  };

  const handlePanelPress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(false);
    router.navigate("/");
  };

  const handlePausePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    pauseRun();
  };

  const handleResumePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void resumeRun();
  };

  const handleEndPress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const id = endRun();
    setExpanded(false);
    if (id) {
      router.push(`/session/${id}?isNew=1` as never);
    }
  };

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  const panelAnimStyle = useAnimatedStyle(() => ({
    opacity: expandedSv.value,
    transform: [
      { translateX: (1 - expandedSv.value) * 14 },
      { scale: 0.94 + expandedSv.value * 0.06 },
    ],
  }));

  const ostrichScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + expandedSv.value * 0.06 }],
  }));

  const ringColor = status === "paused" ? c.warning : c.primary;
  const panelGradient: [string, string] =
    status === "paused"
      ? [c.warning, `${c.warning}CC`]
      : [c.primary, `${c.primary}CC`];

  if (!shouldShow) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 95,
        },
        containerAnimStyle,
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            right: OSTRICH_SIZE + PANEL_GAP,
            bottom: 0,
            width: PANEL_WIDTH,
            borderRadius: 18,
            overflow: "hidden",
            shadowColor: c.textPrimary,
            shadowOpacity: scheme === "dark" ? 0.28 : 0.18,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 9,
          },
          panelAnimStyle,
        ]}
        pointerEvents={expanded ? "auto" : "none"}
      >
        <Pressable
          onPress={handlePanelPress}
          style={{ borderRadius: 18 }}
          accessibilityRole="button"
          accessibilityLabel="Return to run screen"
        >
          <LinearGradient
            colors={panelGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 18 }}
          >
            <YStack paddingHorizontal="$4" paddingVertical="$3" gap="$2">
              <XStack alignItems="center" justifyContent="space-between">
                <SizableText
                  color="white"
                  size="$2"
                  fontWeight="800"
                  letterSpacing={0.8}
                >
                  {status === "paused" ? "RUN PAUSED" : "RUN ACTIVE"}
                </SizableText>
              </XStack>

              <XStack alignItems="flex-end" gap="$2">
                <YStack flex={1} alignItems="flex-start">
                  <SizableText color="white" size="$7" fontWeight="900">
                    {formatDuration(metrics.duration)}
                  </SizableText>
                  <SizableText
                    color="rgba(255,255,255,0.88)"
                    size="$1"
                    fontWeight="700"
                  >
                    TIME
                  </SizableText>
                </YStack>

                <YStack flex={1} alignItems="center">
                  <SizableText color="white" size="$6" fontWeight="900">
                    {distanceLabel}
                  </SizableText>
                  <SizableText
                    color="rgba(255,255,255,0.88)"
                    size="$1"
                    fontWeight="700"
                  >
                    {unitSystem === "imperial" ? "MI" : "KM"}
                  </SizableText>
                </YStack>

                <YStack flex={1} alignItems="flex-end">
                  <SizableText color="white" size="$4" fontWeight="900">
                    {pace}
                  </SizableText>
                  <SizableText
                    color="rgba(255,255,255,0.88)"
                    size="$1"
                    fontWeight="700"
                  >
                    PACE
                  </SizableText>
                </YStack>
              </XStack>

              <XStack gap="$2" marginTop="$1">
                {status === "running" ? (
                  <Pressable
                    onPress={handlePausePress}
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      paddingVertical: 8,
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Pause run"
                  >
                    <SizableText color="white" size="$2" fontWeight="800">
                      PAUSE
                    </SizableText>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleResumePress}
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      paddingVertical: 8,
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Resume run"
                  >
                    <SizableText color="white" size="$2" fontWeight="800">
                      RESUME
                    </SizableText>
                  </Pressable>
                )}

                <Pressable
                  onPress={handleEndPress}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    backgroundColor: "rgba(0,0,0,0.18)",
                    paddingVertical: 8,
                    alignItems: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="End run"
                >
                  <SizableText color="white" size="$2" fontWeight="800">
                    END
                  </SizableText>
                </Pressable>
              </XStack>
            </YStack>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={ostrichScaleStyle}>
          <Pressable
            onPress={handleOstrichPress}
            style={{
              width: OSTRICH_SIZE,
              height: OSTRICH_SIZE,
              borderRadius: OSTRICH_SIZE / 2,
              backgroundColor: c.surface,
              borderWidth: 4,
              borderColor: ringColor,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              shadowColor: c.textPrimary,
              shadowOpacity: scheme === "dark" ? 0.32 : 0.2,
              shadowRadius: 9,
              shadowOffset: { width: 0, height: 4 },
              elevation: 10,
            }}
            accessibilityRole="button"
            accessibilityLabel="Active run ostrich indicator"
          >
            <RunnerCharacter
              isRunning={status === "running"}
              size={OSTRICH_SIZE - 8}
            />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
