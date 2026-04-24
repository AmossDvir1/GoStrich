import * as Sharing from "expo-sharing";
import { RefObject } from "react";
import { Alert, View } from "react-native";
import { captureRef } from "react-native-view-shot";

/**
 * Captures the StoryCard view ref as a PNG and opens the native share sheet.
 * @param ref     - React ref pointing to the mounted StoryCard View
 * @param onStart - Called just before capture begins (e.g. show loading)
 * @param onDone  - Called after share resolves or on error (e.g. hide loading)
 */
export async function shareSessionAsStory(
  ref: RefObject<View | null>,
  onStart?: () => void,
  onDone?: () => void,
): Promise<void> {
  try {
    onStart?.();

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        "Sharing unavailable",
        "Your device does not support file sharing.",
      );
      return;
    }

    // Allow the StoryCard (including MapView tiles) to fully render
    await new Promise<void>((resolve) => setTimeout(resolve, 700));

    const uri = await captureRef(ref, {
      format: "png",
      quality: 1.0,
      result: "tmpfile",
    });

    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle: "Share to Instagram Story",
      UTI: "public.png",
    });
  } catch (error) {
    console.error("[shareSessionAsStory]", error);
    Alert.alert(
      "Could not prepare image",
      "Something went wrong while capturing the session card. Please try again.",
    );
  } finally {
    onDone?.();
  }
}
