import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Link } from "expo-router";
import { SizableText, YStack } from "tamagui";

export default function ModalScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor={c.background}
      padding="$5"
    >
      <SizableText size="$7" fontWeight="700" color={c.textPrimary}>
        Modal
      </SizableText>
      <Link href="/" style={{ marginTop: 16, paddingVertical: 16 }}>
        <SizableText size="$4" color={c.primary}>
          Go to home screen
        </SizableText>
      </Link>
    </YStack>
  );
}
