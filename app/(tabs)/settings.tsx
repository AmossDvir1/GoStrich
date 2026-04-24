import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/stores/appStore";
import { Switch } from "react-native";
import { SizableText, XStack, YStack } from "tamagui";

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const { darkMode, setDarkMode } = useAppStore();

  return (
    <YStack
      flex={1}
      backgroundColor={c.background}
      paddingHorizontal="$6"
      paddingTop="$4"
    >
      <SizableText size="$9" fontWeight="800" color={c.textPrimary}>
        Settings
      </SizableText>
      <SizableText
        size="$3"
        marginTop="$1"
        marginBottom="$6"
        color={c.textSecondary}
      >
        App preferences
      </SizableText>

      <YStack gap="$3">
        {/* Dark mode */}
        <XStack
          borderRadius="$4"
          padding="$4"
          backgroundColor={c.surface}
          borderWidth={1}
          borderColor={c.border}
          alignItems="center"
          justifyContent="space-between"
        >
          <YStack>
            <SizableText size="$4" fontWeight="600" color={c.textPrimary}>
              Dark Mode
            </SizableText>
            <SizableText size="$3" marginTop="$1" color={c.textSecondary}>
              {darkMode ? "On" : "Off — following system"}
            </SizableText>
          </YStack>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor="#fff"
          />
        </XStack>

        {/* Unit system */}
        <XStack
          borderRadius="$4"
          padding="$4"
          backgroundColor={c.surface}
          borderWidth={1}
          borderColor={c.border}
          alignItems="center"
          justifyContent="space-between"
        >
          <YStack>
            <SizableText size="$4" fontWeight="600" color={c.textPrimary}>
              Unit System
            </SizableText>
            <SizableText size="$3" marginTop="$1" color={c.textSecondary}>
              Metric (km)
            </SizableText>
          </YStack>
        </XStack>

        {/* Map style */}
        <XStack
          borderRadius="$4"
          padding="$4"
          backgroundColor={c.surface}
          borderWidth={1}
          borderColor={c.border}
          alignItems="center"
          justifyContent="space-between"
        >
          <YStack>
            <SizableText size="$4" fontWeight="600" color={c.textPrimary}>
              Map Style
            </SizableText>
            <SizableText size="$3" marginTop="$1" color={c.textSecondary}>
              Standard
            </SizableText>
          </YStack>
        </XStack>
      </YStack>

      {/* App info */}
      <YStack marginTop="auto" alignItems="center" paddingBottom="$4">
        <SizableText size="$3" color={c.textSecondary}>
          GoStrich v1.0.0
        </SizableText>
        <SizableText size="$2" marginTop="$1" color={c.border}>
          100% Offline-First
        </SizableText>
      </YStack>
    </YStack>
  );
}
