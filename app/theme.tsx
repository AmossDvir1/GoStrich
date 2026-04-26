import { BackButton } from "@/components/ui/back-button";
import {
  Colors,
  ThemeColors,
  ThemePalettes,
  ThemeVariant,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/stores/appStore";
import { Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SizableText, XStack, YStack } from "tamagui";

const PREVIEW_KEYS: (
  | "primary"
  | "background"
  | "surface"
  | "textPrimary"
  | "textSecondary"
  | "success"
)[] = [
  "primary",
  "background",
  "surface",
  "textPrimary",
  "textSecondary",
  "success",
];

export default function ThemeSettingsScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const themeVariant = useAppStore((s) => s.themeVariant);
  const setThemeVariant = useAppStore((s) => s.setThemeVariant);

  return (
    <YStack flex={1} backgroundColor={c.background}>
      <XStack
        paddingHorizontal="$5"
        paddingTop={insets.top + 14}
        paddingBottom="$4"
        alignItems="center"
        justifyContent="space-between"
      >
        <BackButton size={30} />
        <SizableText size="$6" fontWeight="800" color={c.textPrimary}>
          Theme
        </SizableText>
        <YStack width={30} />
      </XStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom + 24, 36),
          gap: 16,
        }}
      >
        <SizableText size="$3" color={c.textSecondary}>
          Choose your color style. Ostrich is the default brand theme.
        </SizableText>

        <ThemeCard
          variant="ostrich"
          title="Ostrich"
          subtitle="Default"
          selected={themeVariant === "ostrich"}
          onSelect={setThemeVariant}
          screenColors={c}
        />

        <ThemeCard
          variant="classic"
          title="Classic"
          subtitle="Original"
          selected={themeVariant === "classic"}
          onSelect={setThemeVariant}
          screenColors={c}
        />
      </ScrollView>
    </YStack>
  );
}

function ThemeCard({
  variant,
  title,
  subtitle,
  selected,
  onSelect,
  screenColors,
}: {
  variant: ThemeVariant;
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: (variant: ThemeVariant) => void;
  screenColors: ThemeColors;
}) {
  const palette = ThemePalettes[variant];
  const light = palette.light;
  const dark = palette.dark;

  return (
    <Pressable
      onPress={() => onSelect(variant)}
      accessibilityRole="button"
      accessibilityLabel={`Select ${title} theme`}
      style={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? screenColors.primary : screenColors.border,
        borderRadius: 16,
        backgroundColor: screenColors.surface,
        padding: 14,
      }}
    >
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$3"
      >
        <YStack>
          <SizableText
            size="$5"
            fontWeight="800"
            color={screenColors.textPrimary}
          >
            {title}
          </SizableText>
          <SizableText size="$3" color={screenColors.textSecondary}>
            {subtitle}
          </SizableText>
        </YStack>
        <YStack
          width={20}
          height={20}
          borderRadius={10}
          borderWidth={2}
          borderColor={selected ? screenColors.primary : screenColors.border}
          alignItems="center"
          justifyContent="center"
          backgroundColor={selected ? screenColors.primary : "transparent"}
        >
          {selected && (
            <YStack
              width={8}
              height={8}
              borderRadius={4}
              backgroundColor={screenColors.surface}
            />
          )}
        </YStack>
      </XStack>

      <XStack gap="$2">
        <PreviewPanel label="Light" palette={light as ThemeColors} />
        <PreviewPanel label="Dark" palette={dark as ThemeColors} />
      </XStack>
    </Pressable>
  );
}

function PreviewPanel({
  label,
  palette,
}: {
  label: string;
  palette: ThemeColors;
}) {
  return (
    <YStack
      flex={1}
      borderRadius="$3"
      borderWidth={1}
      borderColor={palette.border}
      backgroundColor={palette.background}
      padding="$2"
      gap="$2"
    >
      <SizableText size="$1" fontWeight="700" color={palette.textSecondary}>
        {label}
      </SizableText>
      <XStack gap="$1.5" flexWrap="wrap">
        {PREVIEW_KEYS.map((key) => (
          <YStack
            key={key}
            width={16}
            height={16}
            borderRadius={8}
            borderWidth={1}
            borderColor={palette.border}
            backgroundColor={palette[key]}
          />
        ))}
      </XStack>
      <SizableText size="$1" color={palette.textPrimary}>
        Aa
      </SizableText>
    </YStack>
  );
}
