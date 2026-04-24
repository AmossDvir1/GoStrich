import { Colors } from "@/constants/theme";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

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
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Inner card — stop taps propagating to backdrop */}
        <Pressable style={[styles.card, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Horizontal rule */}
          <View style={[styles.dividerH, { backgroundColor: colors.border }]} />

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.button}
              onPress={onCancel}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>

            {/* Vertical rule */}
            <View style={[styles.dividerV, { backgroundColor: colors.border }]} />

            <Pressable
              style={styles.button}
              onPress={() => void onConfirm()}
              android_ripple={{
                color: confirmDestructive
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(16,185,129,0.1)",
              }}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text
                style={[
                  styles.confirmLabel,
                  {
                    color: confirmDestructive
                      ? colors.danger
                      : colors.primary,
                  },
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 24,
    overflow: "hidden",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  dividerH: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -24,
  },
  buttonRow: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  dividerV: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
});
