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
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <View style={styles.inner}>
        {/* Branding */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: c.primary }]}>GoStrich</Text>
          <Text style={[styles.tagline, { color: c.textSecondary }]}>
            Track every step
          </Text>
        </View>

        {/* Error */}
        {error !== null && (
          <View
            style={[styles.errorBanner, { backgroundColor: `${c.danger}18` }]}
          >
            <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
          </View>
        )}

        {/* Sign-in buttons */}
        <View style={styles.actions}>
          {loading ? (
            <ActivityIndicator color={c.primary} size="large" />
          ) : (
            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={() => void handleSignIn()}
            />
          )}
        </View>

        <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 32,
  },
  header: { alignItems: "center", gap: 8 },
  logo: { fontSize: 42, fontWeight: "900", letterSpacing: -1 },
  tagline: { fontSize: 16 },

  errorBanner: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "stretch",
  },
  errorText: { fontSize: 13, fontWeight: "600", textAlign: "center" },

  actions: { alignSelf: "stretch", gap: 12, alignItems: "center" },

  disclaimer: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});
