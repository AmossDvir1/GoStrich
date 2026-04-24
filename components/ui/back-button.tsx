import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

interface BackButtonProps {
  /** Override the default router.back() behaviour */
  onPress?: () => void;
  /** Override the icon tint — defaults to Colors[scheme].primary */
  tintColor?: string;
  /** Size of the touch target (default 36) */
  size?: number;
}

/**
 * A circular, theme-aware back navigation button using a chevron-left icon.
 * Replaces the plain "<" text used elsewhere in the app.
 */
export function BackButton({ onPress, tintColor, size = 36 }: BackButtonProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const color = tintColor ?? c.primary;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pressed ? `${color}1A` : "transparent",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Ionicons name="arrow-back" size={size - 4} color={color} />
    </Pressable>
  );
}
