import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { useProfileStore } from "@/stores/profileStore";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { GlassEffectView } from "react-native-glass-effect-view";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SizableText, YStack } from "tamagui";

// ─── constants ────────────────────────────────────────────────────────────────
const NAV_PILL_HEIGHT = 62;
const HIGHLIGHT_INSET = 7;
const CIRCLE_SIZE = NAV_PILL_HEIGHT - HIGHLIGHT_INSET * 2; // 48px

/**
 * Vertical clearance that screens must reserve below the nav bar.
 * Use: `paddingTop: insets.top + GLOBAL_NAV_CLEARANCE`
 */
export const GLOBAL_NAV_CLEARANCE = NAV_PILL_HEIGHT + 16; // pill + 8 top pad + 8 bottom pad

type NavItem = "profile" | "run" | "sessions";

interface ItemLayout {
  x: number;
  width: number;
}

function getActiveItem(pathname: string): NavItem | null {
  if (pathname === "/profile") return "profile";
  if (pathname.includes("/history")) return "sessions";
  if (pathname === "/" || pathname.includes("/(tabs)")) return "run";
  // Keep the previous highlight for routes like /session/[id]
  // to avoid a brief wrong-item switch during transitions.
  if (pathname.startsWith("/session/")) return null;
  return "run";
}

// ─── component ────────────────────────────────────────────────────────────────
export function GlobalTopNav() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { profile } = useProfileStore();
  const { permissionStatus } = useLocation({
    fetchLocationOnGranted: false,
    resolveAddress: false,
  });

  const pathname = usePathname();
  const resolvedActive = getActiveItem(pathname);
  const lastActiveRef = useRef<NavItem>("run");
  const activeItem = resolvedActive ?? lastActiveRef.current;

  useEffect(() => {
    if (resolvedActive) {
      lastActiveRef.current = resolvedActive;
    }
  }, [resolvedActive]);

  const initials =
    (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase() ||
    "?";

  const [layouts, setLayouts] = useState<Partial<Record<NavItem, ItemLayout>>>(
    {},
  );

  // Single animated highlight that morphs between circle (profile) and pill
  const highlightX = useSharedValue(-200);
  const highlightWidth = useSharedValue(CIRCLE_SIZE);
  const highlightRadius = useSharedValue(CIRCLE_SIZE / 2);
  const hasPositionedHighlight = useRef(false);

  useEffect(() => {
    const layout = layouts[activeItem];
    if (!layout) return;

    const isProfile = activeItem === "profile";
    const targetX = isProfile
      ? layout.x + (layout.width - CIRCLE_SIZE) / 2
      : layout.x;
    const targetWidth = isProfile ? CIRCLE_SIZE : layout.width;
    const targetRadius = isProfile ? CIRCLE_SIZE / 2 : 22;

    if (!hasPositionedHighlight.current) {
      highlightX.value = targetX;
      highlightWidth.value = targetWidth;
      highlightRadius.value = targetRadius;
      hasPositionedHighlight.current = true;
      return;
    }

    highlightX.value = withTiming(targetX, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
    highlightWidth.value = withTiming(targetWidth, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
    highlightRadius.value = withTiming(targetRadius, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeItem, layouts]); // eslint-disable-line react-hooks/exhaustive-deps

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightX.value }],
    width: highlightWidth.value,
    borderRadius: highlightRadius.value,
  }));

  const gpsDotColor =
    permissionStatus === "granted"
      ? c.success
      : permissionStatus === "denied"
        ? c.danger
        : c.border;

  const glassGradient: [string, string] =
    scheme === "dark"
      ? ["rgb(24, 22, 38)", "rgb(18, 16, 30)"]
      : ["rgb(244, 247, 250)", "rgb(232, 240, 245)"];

  const glassBorder =
    scheme === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgb(223, 231, 236)";

  const liquidGlassTint =
    scheme === "dark" ? "rgba(12, 24, 42, 0.3)" : "rgba(255, 255, 255, 0.34)";

  const glassSheenColors: [string, string] =
    scheme === "dark"
      ? ["rgba(0, 0, 0, 0.65)", "rgba(0, 0, 0, 0.20)"]
      : ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.40)"];

  const activePillColors: [string, string] =
    scheme === "dark" ? [c.primary, c.primary] : [c.primary, c.primary];

  const activePillBorder = scheme === "dark" ? c.primary : c.primary;

  const activePillShadowOpacity = scheme === "dark" ? 0.18 : 0.2;

  const activeLabelColor = scheme === "light" ? "#FFFFFF" : c.textPrimary;
  const inactiveLabelColor = c.textSecondary;

  const shouldUseGlassEffect = false;

  const onItemLayout =
    (item: NavItem) =>
    (e: LayoutChangeEvent): void => {
      const { x, width } = e.nativeEvent.layout;
      setLayouts((prev) => {
        const old = prev[item];
        if (old && old.x === x && old.width === width) return prev;
        return { ...prev, [item]: { x, width } };
      });
    };

  const iconColor = (item: NavItem): string =>
    activeItem === item ? activeLabelColor : inactiveLabelColor;

  const handleNavPress = (item: NavItem): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isOnProfileModal = pathname === "/profile";

    switch (item) {
      case "profile":
        if (activeItem !== "profile") router.push("/profile");
        break;
      case "run":
        if (isOnProfileModal) {
          router.replace("/");
          break;
        }
        if (activeItem !== "run") router.navigate("/");
        break;
      case "sessions":
        if (isOnProfileModal) {
          router.replace("/history");
          break;
        }
        if (activeItem !== "sessions") router.navigate("/history");
        break;
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: insets.top + 8,
        paddingBottom: 8,
      }}
    >
      <View style={{ marginHorizontal: 18 }}>
        {/* Shadow wrapper — no overflow:hidden so shadow renders on Android */}
        <View
          style={{
            borderRadius: 40,
            shadowColor: c.textPrimary,
            shadowOpacity: scheme === "dark" ? 0.28 : 0.1,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
        >
          {/* Glass pill */}
          {shouldUseGlassEffect ? (
            <GlassEffectView
              style={{
                height: NAV_PILL_HEIGHT,
                borderRadius: 40,
                borderWidth: 1,
                borderColor: glassBorder,
                overflow: "hidden",
              }}
              appearance={scheme === "dark" ? "dark" : "light"}
              useNative
              tintColor={liquidGlassTint}
            >
              <LinearGradient
                colors={glassSheenColors}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
              />

              {/* Morphing highlight */}
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    top: HIGHLIGHT_INSET,
                    bottom: HIGHLIGHT_INSET,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: activePillBorder,
                    shadowColor: c.surface,
                    shadowOpacity: activePillShadowOpacity,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 3,
                  },
                  highlightStyle,
                ]}
              >
                <LinearGradient
                  colors={activePillColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Items row */}
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  paddingHorizontal: 6,
                  alignItems: "center",
                }}
              >
                {/* Profile */}
                <Pressable
                  onPress={() => handleNavPress("profile")}
                  onLayout={onItemLayout("profile")}
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  style={{
                    width: 62,
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {profile.photoUrl ? (
                    <Image
                      source={{ uri: profile.photoUrl }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          activeItem === "profile"
                            ? c.primary + "33"
                            : c.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <SizableText
                        size="$2"
                        fontWeight="800"
                        color={
                          activeItem === "profile"
                            ? activeLabelColor
                            : c.textSecondary
                        }
                      >
                        {initials}
                      </SizableText>
                    </View>
                  )}
                </Pressable>

                {/* Run */}
                <Pressable
                  onPress={() => handleNavPress("run")}
                  onLayout={onItemLayout("run")}
                  accessibilityRole="button"
                  accessibilityLabel="Run"
                  style={{
                    flex: 1,
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <YStack
                    alignItems="center"
                    justifyContent="center"
                    gap="$0.5"
                  >
                    <FontAwesome5
                      name="running"
                      size={16}
                      color={iconColor("run")}
                      solid
                    />
                    <SizableText
                      size="$1"
                      color={iconColor("run")}
                      style={{ letterSpacing: 0.3 }}
                    >
                      Run
                    </SizableText>
                  </YStack>
                </Pressable>

                {/* Sessions */}
                <Pressable
                  onPress={() => handleNavPress("sessions")}
                  onLayout={onItemLayout("sessions")}
                  accessibilityRole="button"
                  accessibilityLabel="Sessions"
                  style={{
                    flex: 1,
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <YStack
                    alignItems="center"
                    justifyContent="center"
                    gap="$0.5"
                  >
                    <FontAwesome5
                      name="list-ul"
                      size={16}
                      color={iconColor("sessions")}
                      solid
                    />
                    <SizableText
                      size="$1"
                      color={iconColor("sessions")}
                      style={{ letterSpacing: 0.3 }}
                    >
                      Sessions
                    </SizableText>
                  </YStack>
                </Pressable>

                {/* GPS indicator (passive) */}
                <View
                  style={{
                    width: 58,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: gpsDotColor,
                    }}
                  />
                  <SizableText
                    size="$1"
                    fontWeight="700"
                    color={c.textSecondary}
                  >
                    GPS
                  </SizableText>
                </View>
              </View>
            </GlassEffectView>
          ) : (
            <View
              style={{
                height: NAV_PILL_HEIGHT,
                borderRadius: 40,
                borderWidth: 1,
                borderColor: glassBorder,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={glassGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Morphing highlight */}
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    top: HIGHLIGHT_INSET,
                    bottom: HIGHLIGHT_INSET,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: activePillBorder,
                    shadowColor: c.surface,
                    shadowOpacity: activePillShadowOpacity,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 3,
                  },
                  highlightStyle,
                ]}
              >
                <LinearGradient
                  colors={activePillColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Items row */}
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  paddingHorizontal: 6,
                  alignItems: "center",
                }}
              >
                {/* Profile */}
                <Pressable
                  onPress={() => handleNavPress("profile")}
                  onLayout={onItemLayout("profile")}
                  accessibilityRole="button"
                  accessibilityLabel="Profile"
                  style={{
                    width: 62,
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {profile.photoUrl ? (
                    <Image
                      source={{ uri: profile.photoUrl }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          activeItem === "profile"
                            ? c.primary + "33"
                            : c.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <SizableText
                        size="$2"
                        fontWeight="800"
                        color={
                          activeItem === "profile" ? c.primary : c.textSecondary
                        }
                      >
                        {initials}
                      </SizableText>
                    </View>
                  )}
                </Pressable>

                {/* Run */}
                <Pressable
                  onPress={() => handleNavPress("run")}
                  onLayout={onItemLayout("run")}
                  accessibilityRole="button"
                  accessibilityLabel="Run"
                  style={{
                    flex: 1,
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <YStack
                    alignItems="center"
                    justifyContent="center"
                    gap="$0.5"
                  >
                    <FontAwesome5
                      name="running"
                      size={16}
                      color={iconColor("run")}
                      solid
                    />
                    <SizableText
                      size="$1"
                      color={iconColor("run")}
                      style={{ letterSpacing: 0.3 }}
                    >
                      Run
                    </SizableText>
                  </YStack>
                </Pressable>

                {/* Sessions */}
                <Pressable
                  onPress={() => handleNavPress("sessions")}
                  onLayout={onItemLayout("sessions")}
                  accessibilityRole="button"
                  accessibilityLabel="Sessions"
                  style={{
                    flex: 1,
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <YStack
                    alignItems="center"
                    justifyContent="center"
                    gap="$0.5"
                  >
                    <FontAwesome5
                      name="list-ul"
                      size={16}
                      color={iconColor("sessions")}
                      solid
                    />
                    <SizableText
                      size="$1"
                      color={iconColor("sessions")}
                      style={{ letterSpacing: 0.3 }}
                    >
                      Sessions
                    </SizableText>
                  </YStack>
                </Pressable>

                {/* GPS indicator (passive) */}
                <View
                  style={{
                    width: 58,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: gpsDotColor,
                    }}
                  />
                  <SizableText
                    size="$1"
                    fontWeight="700"
                    color={c.textSecondary}
                  >
                    GPS
                  </SizableText>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
