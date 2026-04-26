import { BackButton } from "@/components/ui/back-button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SizableText, XStack, YStack } from "tamagui";

type ThemeKey = "light" | "dark";

const SWATCH_KEYS: (
  | "primary"
  | "background"
  | "surface"
  | "textPrimary"
  | "textSecondary"
  | "border"
  | "warning"
  | "danger"
  | "mapPath"
)[] = [
  "primary",
  "background",
  "surface",
  "textPrimary",
  "textSecondary",
  "border",
  "warning",
  "danger",
  "mapPath",
];

export default function PalettePreviewScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <YStack flex={1} backgroundColor={c.background}>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$5"
        paddingTop={insets.top + 14}
        paddingBottom="$4"
      >
        <BackButton />
        <SizableText size="$6" fontWeight="800" color={c.textPrimary}>
          Palette Preview
        </SizableText>
        <YStack width={34} />
      </XStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom + 28, 36),
          gap: 16,
        }}
      >
        <SizableText size="$3" color={c.textSecondary}>
          Quick in-app review of the ostrich palette in both modes.
        </SizableText>

        <PreviewCard themeKey="light" />
        <PreviewCard themeKey="dark" />

        <YStack
          borderRadius="$4"
          borderWidth={1}
          borderColor={c.border}
          backgroundColor={c.surface}
          padding="$4"
          gap="$2"
        >
          <SizableText size="$4" fontWeight="700" color={c.textPrimary}>
            Live Theme Sample
          </SizableText>
          <SizableText size="$3" color={c.textSecondary}>
            Secondary text should remain readable against the active background.
          </SizableText>
          <XStack gap="$2" marginTop="$2">
            <YStack
              borderRadius="$3"
              paddingHorizontal="$3"
              paddingVertical="$2"
              backgroundColor={c.primary}
            >
              <SizableText size="$2" color="white" fontWeight="700">
                Primary CTA
              </SizableText>
            </YStack>
            <YStack
              borderRadius="$3"
              paddingHorizontal="$3"
              paddingVertical="$2"
              borderWidth={1}
              borderColor={c.border}
              backgroundColor={c.surface}
            >
              <SizableText size="$2" color={c.textPrimary} fontWeight="600">
                Surface Control
              </SizableText>
            </YStack>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

function PreviewCard({ themeKey }: { themeKey: ThemeKey }) {
  const palette = Colors[themeKey];

  return (
    <YStack
      borderRadius="$4"
      borderWidth={1}
      borderColor={palette.border}
      backgroundColor={palette.surface}
      padding="$4"
      gap="$3"
    >
      <SizableText size="$5" fontWeight="800" color={palette.textPrimary}>
        {themeKey === "light" ? "Light Theme" : "Dark Theme"}
      </SizableText>
      <YStack gap="$2">
        {SWATCH_KEYS.map((key) => (
          <SwatchRow
            key={key}
            name={key}
            value={palette[key]}
            textColor={palette.textPrimary}
          />
        ))}
      </YStack>
    </YStack>
  );
}

function SwatchRow({
  name,
  value,
  textColor,
}: {
  name: string;
  value: string;
  textColor: string;
}) {
  return (
    <XStack alignItems="center" justifyContent="space-between">
      <XStack alignItems="center" gap="$3">
        <YStack
          width={24}
          height={24}
          borderRadius="$2"
          borderWidth={1}
          borderColor="rgba(0,0,0,0.15)"
          backgroundColor={value}
        />
        <SizableText size="$3" fontWeight="600" color={textColor}>
          {name}
        </SizableText>
      </XStack>
      <SizableText size="$2" color={textColor}>
        {value}
      </SizableText>
    </XStack>
  );
}
