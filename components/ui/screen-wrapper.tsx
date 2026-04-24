import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Extra top padding added on top of the safe area inset. Defaults to 0. */
  topPadding?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps a screen with the correct top safe-area inset so the content
 * never slides under the status bar. Use this for screens that have their
 * own custom header (e.g. history, no-back screens).
 *
 * Screens that manage their own safe area (e.g. home, session, profile)
 * should continue doing so via `useSafeAreaInsets()` directly.
 */
export function ScreenWrapper({
  children,
  topPadding = 0,
  style,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const c = Colors[scheme];

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: c.background,
          paddingTop: insets.top + topPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
