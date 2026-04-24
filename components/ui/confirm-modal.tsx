import { Colors } from "@/constants/theme";
import React from "react";
import { Modal, Pressable } from "react-native";
import { SizableText, XStack, YStack } from "tamagui";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** Renders the confirm button in danger color */
  confirmDestructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  colors: (typeof Colors)["light"];
}

const BACKDROP_STYLE = {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center" as const,
  alignItems: "center" as const,
  paddingHorizontal: 32,
} as const;

const CARD_STYLE = {
  width: "100%" as const,
  borderRadius: 20,
  paddingTop: 28,
  paddingHorizontal: 24,
  overflow: "hidden" as const,
} as const;

const BUTTON_STYLE = {
  flex: 1,
  paddingVertical: 15,
  alignItems: "center" as const,
} as const;

/**
 * A fully themed confirmation dialog that respects the app's color scheme.
 * Use instead of the system Alert.alert so dark mode is handled correctly.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  confirmDestructive = false,
  onCancel,
  onConfirm,
  colors,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop — tap outside dismisses */}
      <Pressable style={BACKDROP_STYLE} onPress={onCancel}>
        {/* Inner card — stop taps propagating to backdrop */}
        <Pressable
          style={[CARD_STYLE, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
        >
          <SizableText
            size="$5"
            fontWeight="700"
            marginBottom="$2"
            color={colors.textPrimary}
          >
            {title}
          </SizableText>
          <SizableText
            size="$3"
            lineHeight={20}
            marginBottom="$5"
            color={colors.textSecondary}
          >
            {message}
          </SizableText>

          {/* Horizontal rule */}
          <YStack
            height={0.5}
            marginHorizontal={-24}
            backgroundColor={colors.border}
          />

          <XStack>
            <Pressable
              style={BUTTON_STYLE}
              onPress={onCancel}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <SizableText
                size="$4"
                fontWeight="600"
                color={colors.textSecondary}
              >
                Cancel
              </SizableText>
            </Pressable>

            {/* Vertical rule */}
            <YStack
              width={0.5}
              marginVertical="$1"
              backgroundColor={colors.border}
            />

            <Pressable
              style={BUTTON_STYLE}
              onPress={() => void onConfirm()}
              android_ripple={{
                color: confirmDestructive
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(16,185,129,0.1)",
              }}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <SizableText
                size="$4"
                fontWeight="700"
                color={confirmDestructive ? colors.danger : colors.primary}
              >
                {confirmLabel}
              </SizableText>
            </Pressable>
          </XStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
