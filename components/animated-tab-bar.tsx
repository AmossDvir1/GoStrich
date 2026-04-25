import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur"; // <-- Add this import
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SizableText, YStack } from "tamagui";

interface TabItemLayout {
  x: number;
  width: number;
}

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const [layouts, setLayouts] = useState<Record<string, TabItemLayout>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  const shownRoutes = useMemo(
    () =>
      state.routes.filter(
        (route) => route.name === "index" || route.name === "history",
      ),
    [state.routes],
  );

  useEffect(() => {
    // ... (Keep your existing useEffect for animations) ...
    const activeRoute = state.routes[state.index];
    const layout = layouts[activeRoute.key];
    if (!layout) return;

    const stretched = layout.width + 18;

    pillX.value = withTiming(layout.x, {
      duration: 290,
      easing: Easing.out(Easing.cubic),
    });

    pillWidth.value = withSequence(
      withTiming(stretched, { duration: 130, easing: Easing.out(Easing.quad) }),
      withTiming(layout.width, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [layouts, pillWidth, pillX, state.index, state.routes]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillWidth.value,
  }));

  const activePillColors: [string, string] =
    scheme === "dark"
      ? ["rgba(16, 185, 129, 0.28)", "rgba(5, 150, 105, 0.22)"]
      : ["rgba(16, 185, 129, 0.22)", "rgba(16, 185, 129, 0.14)"];

  const glassBorder =
    scheme === "dark"
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.65)";

  const tabBarBaseHeight = 74;

  return (
    // 1. Make the container Absolute so it floats above all screens
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "transparent",
        paddingBottom: Math.max(insets.bottom, 10), // Pushes pill above phone buttons
        paddingTop: 8,
      }}
    >
      <View style={{ marginHorizontal: 18 }}>
        <View
          style={{
            borderRadius: 40,
            shadowColor: "#000",
            shadowOpacity: scheme === "dark" ? 0.4 : 0.15,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <View
            style={{
              height: tabBarBaseHeight,
              borderRadius: 40,
              borderWidth: 1,
              borderColor: glassBorder,
              overflow: "hidden",
            }}
          >
            {/* 2. Actual frosted glass effect */}
            <BlurView
              intensity={scheme === "dark" ? 35 : 55}
              tint={scheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            {/* 3. Subtle color tint overlay to match theme */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor:
                    scheme === "dark"
                      ? "rgba(15, 28, 50, 0.35)"
                      : "rgba(255, 255, 255, 0.35)",
                },
              ]}
            />

            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  top: 8,
                  bottom: 8,
                  borderRadius: 30,
                  overflow: "hidden",
                },
                animatedPillStyle,
              ]}
            >
              <LinearGradient
                colors={activePillColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            <View
              style={{
                flex: 1,
                flexDirection: "row",
                paddingHorizontal: 6,
                paddingVertical: 6,
              }}
            >
              {shownRoutes.map((route) => {
                const isFocused = state.routes[state.index].key === route.key;

                const onLayout = (e: LayoutChangeEvent) => {
                  const { x, width } = e.nativeEvent.layout;
                  setLayouts((prev) => {
                    const old = prev[route.key];
                    if (old && old.x === x && old.width === width) return prev;
                    return { ...prev, [route.key]: { x, width } };
                  });
                };

                const descriptor = descriptors[route.key];
                const label =
                  typeof descriptor.options.tabBarLabel === "string"
                    ? descriptor.options.tabBarLabel
                    : route.name;

                const onPress = () => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate(route.name, route.params);
                  }
                };

                const iconColor = isFocused ? c.primary : c.textSecondary;

                return (
                  <Pressable
                    key={route.key}
                    onLayout={onLayout}
                    onPress={onPress}
                    style={{ flex: 1, borderRadius: 28 }}
                  >
                    <YStack
                      flex={1}
                      alignItems="center"
                      justifyContent="center"
                      gap="$1"
                      paddingTop="$1"
                    >
                      {route.name === "index" ? (
                        <FontAwesome5
                          name="running"
                          size={18}
                          color={iconColor}
                          solid
                        />
                      ) : (
                        <FontAwesome5
                          name="list-ul"
                          size={18}
                          color={iconColor}
                          solid
                        />
                      )}
                      <SizableText
                        size="$2"
                        color={iconColor}
                        fontWeight="700"
                        style={{ letterSpacing: 0.3 }}
                      >
                        {label === "index"
                          ? "Run"
                          : label === "history"
                            ? "Sessions"
                            : label}
                      </SizableText>
                    </YStack>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
