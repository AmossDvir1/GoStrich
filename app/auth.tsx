import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import { SizableText, YStack } from "tamagui";

// ── Google Sign-In configuration ──────────────────────────────────────────
// webClientId comes from a "Web application" OAuth client in Google Cloud Console.
// It is needed so Google can return a proper ID token.
// Create one at: https://console.cloud.google.com → APIs & Services → Credentials
// → Create Credentials → OAuth client ID → Web application → Save the Client ID
// Then add to .env:  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
  offlineAccess: false,
});

export default function AuthScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const { loginWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();
      if (response.type !== "success") return;
      const { user } = response.data;
      await loginWithGoogle({
        email: user.email,
        name: user.name ?? null,
        photoUrl: user.photo ?? null,
      });
      // Pre-populate profile with Google name + photo on first login
      const profile = useProfileStore.getState().profile;
      if (!profile.firstName && !profile.lastName) {
        await useProfileStore.getState().save({
          firstName: user.givenName ?? "",
          lastName: user.familyName ?? "",
          photoUrl: user.photo ?? null,
        });
      }
      router.replace("/(tabs)");
    } catch (e) {
      if (isErrorWithCode(e)) {
        if (e.code === statusCodes.SIGN_IN_CANCELLED) return; // user dismissed
        if (e.code === statusCodes.IN_PROGRESS) return; // already signing in
        if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError("Google Play Services not available.");
          return;
        }
      }
      const msg = isErrorWithCode(e)
        ? `Sign-in failed (code: ${e.code})`
        : e instanceof Error
          ? `Sign-in failed: ${e.message}`
          : "Sign-in failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack
      flex={1}
      backgroundColor={c.background}
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="$8"
      gap="$8"
    >
      {/* Branding */}
      <YStack alignItems="center" gap="$2">
        <SizableText
          size="$10"
          fontWeight="900"
          color={c.primary}
          style={{ letterSpacing: -1 }}
        >
          GoStrich
        </SizableText>
        <SizableText size="$5" color={c.textSecondary}>
          Track every step
        </SizableText>
      </YStack>

      {/* Error */}
      {error !== null && (
        <YStack
          borderRadius="$3"
          paddingHorizontal="$4"
          paddingVertical="$3"
          alignSelf="stretch"
          backgroundColor={`${c.danger}18`}
        >
          <SizableText
            size="$3"
            fontWeight="600"
            textAlign="center"
            color={c.danger}
          >
            {error}
          </SizableText>
        </YStack>
      )}

      {/* Sign-in buttons */}
      <YStack alignSelf="stretch" gap="$3" alignItems="center">
        {loading ? (
          <ActivityIndicator color={c.primary} size="large" />
        ) : (
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={() => void handleSignIn()}
          />
        )}
      </YStack>

      <SizableText
        size="$2"
        textAlign="center"
        color={c.textSecondary}
        style={{ lineHeight: 16 }}
      >
        By continuing you agree to our Terms of Service and Privacy Policy.
      </SizableText>
    </YStack>
  );
}
