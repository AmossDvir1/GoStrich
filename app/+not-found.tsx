import { Link, Stack } from "expo-router";
import { SizableText, YStack } from "tamagui";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        backgroundColor="white"
        padding="$5"
      >
        <SizableText size="$6" fontWeight="700" color="#1e293b">
          {"This screen doesn't exist."}
        </SizableText>
        <Link href="/" style={{ marginTop: 16, paddingVertical: 16 }}>
          <SizableText size="$4" color="$primary">
            Go to home screen
          </SizableText>
        </Link>
      </YStack>
    </>
  );
}
