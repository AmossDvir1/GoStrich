import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet, SizableText, YStack } from "tamagui";

interface SharedActionSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: React.ReactNode;
}

export function SharedActionSheet({
  visible,
  onDismiss,
  title,
  children,
}: SharedActionSheetProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Sheet
      modal={true}
      open={visible}
      onOpenChange={(open: boolean) => {
        if (!open) onDismiss();
      }}
      dismissOnSnapToBottom
      snapPoints={[42]}
      zIndex={200_000}
    >
      <Sheet.Overlay
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.45)"
      />
      <Sheet.Frame
        backgroundColor={c.surface}
        borderTopLeftRadius={28}
        borderTopRightRadius={28}
        paddingBottom={Math.max(insets.bottom, 20)}
      >
        {/* Handle inside frame — green, tappable to dismiss */}
        <Pressable
          onPress={onDismiss}
          style={{ alignItems: "center", paddingTop: 14, paddingBottom: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: c.primary,
            }}
          />
        </Pressable>

        {title && (
          <YStack paddingHorizontal="$5" paddingTop="$4" paddingBottom="$2">
            <SizableText
              size="$5"
              fontWeight="700"
              color={c.textPrimary}
              textAlign="center"
            >
              {title}
            </SizableText>
          </YStack>
        )}
        {children}
      </Sheet.Frame>
    </Sheet>
  );
}
