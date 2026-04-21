import { RunnerCharacter } from "@/components/ui/runner-character";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { RunState } from "@/hooks/use-run-session";
import { formatDuration } from "@/utils/formatting";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// ─── constants ────────────────────────────────────────────────────────────────
const THUMB_SIZE = 80;
const TRACK_HEIGHT = 60;
const TRACK_TOP = (THUMB_SIZE - TRACK_HEIGHT) / 2; // vertical offset to center track
const OSTRICH_OVERLAP = 28; // px the thumb visually overlaps the track edge
const THUMB_PAD = THUMB_SIZE - OSTRICH_OVERLAP; // 52 — padding to center labels past thumb
const END_BTN_WIDTH = 90;
const SLIDE_THRESHOLD = 0.75; // fraction of max to trigger start
const SPRING = { damping: 15, stiffness: 450, mass: 0.9 } as const;

const THUMB_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 8,
} as const;

// ─── shimmer ─────────────────────────────────────────────────────────────────
function SlideShimmer() {
  const translateX = useSharedValue(-200);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(400, { duration: 1600, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(translateX);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animStyle,
        { position: "absolute", top: 0, bottom: 0, width: 180 },
      ]}
    >
      <LinearGradient
        colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

// ─── types ────────────────────────────────────────────────────────────────────
interface RunDrawerProps {
  runState: RunState;
  elapsed: number;
  distanceKm: number;
  locationName: string | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────
export function RunDrawer({
  runState,
  elapsed,
  distanceKm,
  locationName,
  onStart,
  onPause,
  onResume,
  onEnd,
}: RunDrawerProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const isIdle = runState === "idle";
  const isRunning = runState === "running";
  const isPaused = runState === "paused";

  // Shared animated value: thumb position (0 = left, max = right)
  const containerWidth = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const gestureStartX = useSharedValue(0);

  // Stable ref so the onLayout callback always sees the latest runState
  const runStateRef = useRef(runState);
  runStateRef.current = runState;

  // Animate thumb when state changes
  useEffect(() => {
    if (isRunning && containerWidth.value > 0) {
      thumbX.value = withSpring(containerWidth.value - THUMB_SIZE, SPRING);
    } else if (!isRunning) {
      thumbX.value = withSpring(0, SPRING);
    }
  }, [runState]); // eslint-disable-line react-hooks/exhaustive-deps

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    containerWidth.value = w;
    // Snap thumb immediately if already running when layout fires (e.g., navigating back)
    if (runStateRef.current === "running") {
      thumbX.value = w - THUMB_SIZE;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable wrapper so runOnJS works correctly
  const triggerStart = useCallback(() => onStart(), [onStart]);

  // Pan gesture — only active in idle state
  const panGesture = Gesture.Pan()
    .enabled(isIdle)
    .activeOffsetX(10) // require intentional horizontal swipe
    .onBegin(() => {
      gestureStartX.value = thumbX.value;
    })
    .onUpdate((e) => {
      const max = containerWidth.value - THUMB_SIZE;
      thumbX.value = Math.max(
        0,
        Math.min(gestureStartX.value + e.translationX, max),
      );
    })
    .onEnd(() => {
      const max = containerWidth.value - THUMB_SIZE;
      if (max > 0 && thumbX.value >= SLIDE_THRESHOLD * max) {
        // Snap to right edge and start the run
        thumbX.value = withSpring(max, SPRING);
        runOnJS(triggerStart)();
      } else {
        // Snap back to start
        thumbX.value = withSpring(0, SPRING);
      }
    });

  const thumbAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Top section: idle heading OR live metrics */}
      {isIdle ? (
        <View>
          <Text
            className="text-3xl font-extrabold mb-1"
            style={{ color: c.textPrimary }}
          >
            Ready to run
          </Text>
          <View className="flex-row items-center mb-5 min-h-[20px]">
            {locationName ? (
              <>
                <Text className="text-[13px]" style={{ color: c.primary }}>
                  {"📍 "}
                </Text>
                <Text
                  className="text-[13px]"
                  style={{ color: c.textSecondary }}
                >
                  {locationName}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      ) : (
        <View className="flex-row items-center mb-4">
          <View className="flex-1 items-center">
            <Text
              className="text-[32px] font-extrabold"
              style={{ color: c.textPrimary }}
            >
              {formatDuration(elapsed)}
            </Text>
            <Text
              className="text-[11px] font-semibold mt-0.5"
              style={{ color: c.textSecondary }}
            >
              Time
            </Text>
          </View>
          <View
            className="w-px h-10 mx-2"
            style={{ backgroundColor: c.border }}
          />
          <View className="flex-1 items-center">
            <Text
              className="text-[32px] font-extrabold"
              style={{ color: c.textPrimary }}
            >
              {distanceKm.toFixed(2)}
            </Text>
            <Text
              className="text-[11px] font-semibold mt-0.5"
              style={{ color: c.textSecondary }}
            >
              km
            </Text>
          </View>
        </View>
      )}

      {/* ── Button / slider row ──────────────────────────────────────────────
          The GestureDetector wraps the entire row. RunnerCharacter stays at
          the same tree position (inside Animated.View) so it never remounts. */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={{ height: THUMB_SIZE, position: "relative" }}
          onLayout={onLayout}
        >
          {/* IDLE: full-width green track, label "SLIDE TO START ›"
              The track is non-pressable — only the slide gesture matters. */}
          {isIdle && (
            <View
              style={{
                position: "absolute",
                top: TRACK_TOP,
                left: 0,
                right: 0,
                height: TRACK_HEIGHT,
                borderRadius: TRACK_HEIGHT / 2,
                backgroundColor: c.primary,
                justifyContent: "center",
                alignItems: "center",
                paddingLeft: THUMB_PAD,
                paddingRight: 16,
                overflow: "hidden",
              }}
            >
              <SlideShimmer />
              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 14,
                  fontWeight: "800",
                  letterSpacing: 1.5,
                }}
              >
                {"SLIDE TO START  ›"}
              </Text>
            </View>
          )}

          {/* RUNNING: amber PAUSE button, ostrich is at the right end.
              paddingRight reserves space so label centers in the visible area. */}
          {isRunning && (
            <Pressable
              onPress={onPause}
              style={{
                position: "absolute",
                top: TRACK_TOP,
                left: 0,
                right: 0,
                height: TRACK_HEIGHT,
                borderRadius: TRACK_HEIGHT / 2,
                backgroundColor: c.warning,
                justifyContent: "center",
                alignItems: "center",
                paddingRight: THUMB_PAD,
              }}
              android_ripple={{ color: "rgba(255,255,255,0.25)" }}
              accessibilityRole="button"
              accessibilityLabel="Pause run"
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 15,
                  fontWeight: "800",
                  letterSpacing: 1.5,
                }}
              >
                PAUSE
              </Text>
            </Pressable>
          )}

          {/* PAUSED: RESUME (green pill, flex-1) + END (outlined red pill) side by side */}
          {isPaused && (
            <View
              style={{
                position: "absolute",
                top: TRACK_TOP,
                left: 0,
                right: 0,
                height: TRACK_HEIGHT,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Pressable
                onPress={onResume}
                style={{
                  flex: 1,
                  paddingLeft: THUMB_PAD,
                  borderRadius: TRACK_HEIGHT / 2,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: c.primary,
                }}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                accessibilityRole="button"
                accessibilityLabel="Resume run"
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 15,
                    fontWeight: "800",
                    letterSpacing: 1.5,
                  }}
                >
                  RESUME
                </Text>
              </Pressable>
              <Pressable
                onPress={onEnd}
                style={{
                  width: END_BTN_WIDTH,
                  borderRadius: TRACK_HEIGHT / 2,
                  borderWidth: 1.5,
                  borderColor: c.danger,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}
                android_ripple={{ color: "rgba(239,68,68,0.1)" }}
                accessibilityRole="button"
                accessibilityLabel="End session"
              >
                <Text
                  style={{
                    color: c.danger,
                    fontSize: 13,
                    fontWeight: "800",
                    letterSpacing: 0.5,
                  }}
                >
                  END
                </Text>
              </Pressable>
            </View>
          )}

          {/* Thumb (ostrich) — always at this tree position so RunnerCharacter
              never unmounts and Rive animation never restarts. */}
          <Animated.View
            style={[
              thumbAnimStyle,
              THUMB_SHADOW,
              {
                position: "absolute",
                top: 0,
                left: 0,
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: "#EDE8DF",
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "white",
                zIndex: 2,
              },
            ]}
          >
            <RunnerCharacter isRunning={isRunning} size={THUMB_SIZE} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}
