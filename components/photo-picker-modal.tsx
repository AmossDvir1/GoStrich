import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SizableText, YStack } from "tamagui";
import { SharedActionSheet } from "./ui/shared-action-sheet";

interface PhotoPickerOption {
  text: string;
  onPress: () => void;
  style?: "default" | "destructive";
}

interface PhotoPickerModalProps {
  visible: boolean;
  options: PhotoPickerOption[];
  onDismiss: () => void;
  title?: string;
}

export function PhotoPickerModal({
  visible,
  options,
  onDismiss,
  title = "Change Profile Photo",
}: PhotoPickerModalProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme];

  return (
    <SharedActionSheet visible={visible} onDismiss={onDismiss} title={title}>
      <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$2">
        {options.map((option, index) => (
          <Pressable
            key={index}
            onPress={() => {
              option.onPress();
              onDismiss();
            }}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: pressed
                  ? scheme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)"
                  : "transparent",
              },
            ]}
          >
            <SizableText
              size="$4"
              fontWeight="600"
              color={option.style === "destructive" ? "#EF4444" : c.textPrimary}
            >
              {option.text}
            </SizableText>
          </Pressable>
        ))}

        <View style={[styles.separator, { backgroundColor: c.border }]} />
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.option,
            {
              backgroundColor: pressed
                ? scheme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.03)"
                : "transparent",
            },
          ]}
        >
          <SizableText size="$4" fontWeight="700" color={c.textSecondary}>
            Cancel
          </SizableText>
        </Pressable>
      </YStack>
    </SharedActionSheet>
  );
}

const styles = StyleSheet.create({
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  separator: {
    height: 1,
    marginVertical: 8,
    opacity: 0.5,
  },
});
