import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/stores/appStore";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const { user, logout } = useAuthStore();
  const { profile, save } = useProfileStore();
  const { darkMode, setDarkMode, unitSystem, setUnitSystem } = useAppStore();

  // Local editable state — committed on blur
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [weight, setWeight] = useState(
    profile.weightKg !== null ? String(profile.weightKg) : "",
  );
  const [height, setHeight] = useState(
    profile.heightCm !== null ? String(profile.heightCm) : "",
  );

  // Keep in sync if the store updates externally
  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setWeight(profile.weightKg !== null ? String(profile.weightKg) : "");
    setHeight(profile.heightCm !== null ? String(profile.heightCm) : "");
  }, [profile]);

  const commitField = (field: keyof typeof profile, raw: string) => {
    if (field === "firstName" || field === "lastName") {
      void save({ [field]: raw.trim() });
    } else if (field === "weightKg" || field === "heightCm") {
      const num = parseFloat(raw);
      void save({ [field]: raw.trim() === "" || isNaN(num) ? null : num });
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth");
        },
      },
    ]);
  };

  // Derive initials for avatar
  const initials =
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "?";

  const handleChangePhoto = () => {
    const options = [
      "Choose from Library",
      "Take Photo",
      "Remove Photo",
      "Cancel",
    ];
    const destructiveIndex = profile.photoUrl ? 2 : -1;
    const cancelIndex = profile.photoUrl ? 3 : 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: profile.photoUrl
            ? options
            : options.slice(0, 2).concat("Cancel"),
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex:
            destructiveIndex > -1 ? destructiveIndex : undefined,
        },
        (i) => void handlePhotoAction(i, !!profile.photoUrl),
      );
    } else {
      // Android: simulate with Alert
      const alertOptions = [
        { text: "Choose from Library", onPress: () => void pickFromLibrary() },
        { text: "Take Photo", onPress: () => void pickFromCamera() },
        ...(profile.photoUrl
          ? [
              {
                text: "Remove Photo",
                style: "destructive" as const,
                onPress: () => void save({ photoUrl: null }),
              },
            ]
          : []),
        { text: "Cancel", style: "cancel" as const },
      ];
      Alert.alert("Change Profile Photo", undefined, alertOptions);
    }
  };

  const handlePhotoAction = async (index: number, hasPhoto: boolean) => {
    if (index === 0) await pickFromLibrary();
    else if (index === 1) await pickFromCamera();
    else if (index === 2 && hasPhoto) await save({ photoUrl: null });
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow access to your photo library to pick a profile picture.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await save({ photoUrl: result.assets[0].uri });
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow camera access to take a profile picture.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await save({ photoUrl: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header row */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>
            Profile
          </Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={[styles.closeBtn, { color: c.primary }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar — tap to change */}
          <Pressable
            onPress={handleChangePhoto}
            style={[styles.avatar, { backgroundColor: c.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            {profile.photoUrl ? (
              <Image
                source={{ uri: profile.photoUrl }}
                style={styles.avatarImg}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </Pressable>
          <Text style={[styles.changePhotoHint, { color: c.primary }]}>
            {profile.photoUrl ? "Change photo" : "Add profile photo"}
          </Text>

          {/* ── Identity ─────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
            IDENTITY
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <FieldRow
              label="First name"
              value={firstName}
              placeholder="Add first name"
              onChangeText={setFirstName}
              onBlur={() => commitField("firstName", firstName)}
              c={c}
            />
            <Divider color={c.border} />
            <FieldRow
              label="Last name"
              value={lastName}
              placeholder="Add last name"
              onChangeText={setLastName}
              onBlur={() => commitField("lastName", lastName)}
              c={c}
            />
            <Divider color={c.border} />
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
                Email
              </Text>
              <Text style={[styles.fieldReadOnly, { color: c.textPrimary }]}>
                {user?.email ?? "—"}
              </Text>
            </View>
          </View>

          {/* ── Physical stats ───────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
            PHYSICAL STATS
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <FieldRow
              label="Weight (kg)"
              value={weight}
              placeholder="Optional"
              onChangeText={setWeight}
              onBlur={() => commitField("weightKg", weight)}
              keyboardType="decimal-pad"
              c={c}
            />
            <Divider color={c.border} />
            <FieldRow
              label="Height (cm)"
              value={height}
              placeholder="Optional"
              onChangeText={setHeight}
              onBlur={() => commitField("heightCm", height)}
              keyboardType="decimal-pad"
              c={c}
            />
          </View>

          {/* ── App settings ─────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
            SETTINGS
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.fieldLabel, { color: c.textPrimary }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.fieldSub, { color: c.textSecondary }]}>
                  {darkMode ? "On" : "Following system"}
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>
            <Divider color={c.border} />
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.fieldLabel, { color: c.textPrimary }]}>
                  Unit System
                </Text>
                <Text style={[styles.fieldSub, { color: c.textSecondary }]}>
                  {unitSystem === "metric"
                    ? "Metric (km, kg)"
                    : "Imperial (mi, lb)"}
                </Text>
              </View>
              <Switch
                value={unitSystem === "imperial"}
                onValueChange={(v) => setUnitSystem(v ? "imperial" : "metric")}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* ── Log out ──────────────────────────────────────── */}
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutBtn, { borderColor: c.danger }]}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Text style={[styles.logoutText, { color: c.danger }]}>
              Log out
            </Text>
          </Pressable>

          <Text style={[styles.version, { color: c.border }]}>
            GoStrich v1.0.0 · 100% Offline-First
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

type ThemeColors = (typeof Colors)["light"];

function FieldRow({
  label,
  value,
  placeholder,
  onChangeText,
  onBlur,
  keyboardType = "default",
  c,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
  onBlur: () => void;
  keyboardType?: "default" | "decimal-pad";
  c: ThemeColors;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        style={[styles.fieldInput, { color: c.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={c.border}
        keyboardType={keyboardType}
        returnKeyType="done"
        textAlign="right"
      />
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  closeBtn: { fontSize: 16, fontWeight: "600" },

  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24, gap: 8 },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "800" },
  changePhotoHint: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 8,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },

  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: { fontSize: 15, fontWeight: "500" },
  fieldReadOnly: { fontSize: 15 },
  fieldInput: { fontSize: 15, flex: 1, textAlign: "right" },
  fieldSub: { fontSize: 12, marginTop: 2 },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },

  logoutBtn: {
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 15,
    alignItems: "center",
  },
  logoutText: { fontSize: 15, fontWeight: "700" },

  version: { fontSize: 11, textAlign: "center", marginTop: 20 },
});
