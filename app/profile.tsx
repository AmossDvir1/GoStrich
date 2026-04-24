import { PhotoPickerModal } from "@/components/photo-picker-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
  Switch,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SizableText, XStack, YStack } from "tamagui";

const AVATAR_PRESSABLE_STYLE = {
  width: 80,
  height: 80,
  borderRadius: 40,
  alignSelf: "center" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  overflow: "hidden" as const,
} as const;

const AVATAR_IMAGE_STYLE = {
  width: 80,
  height: 80,
  borderRadius: 40,
} as const;

const LOGOUT_PRESSABLE_STYLE = {
  marginTop: 24,
  borderRadius: 14,
  borderWidth: 1.5,
  paddingVertical: 15,
  alignItems: "center" as const,
} as const;

const FIELD_INPUT_STYLE = {
  flex: 1,
  textAlign: "right" as const,
  paddingLeft: 12,
  fontSize: 15,
} as const;

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const { user, logout } = useAuthStore();
  const { profile, save } = useProfileStore();
  const { darkMode, setDarkMode, unitSystem, setUnitSystem } = useAppStore();
  const insets = useSafeAreaInsets();

  // Local editable state — committed on blur
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [weight, setWeight] = useState(
    profile.weightKg !== null ? String(profile.weightKg) : "",
  );
  const [height, setHeight] = useState(
    profile.heightCm !== null ? String(profile.heightCm) : "",
  );
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

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

  const handleLogout = () => setLogoutModalVisible(true);

  const handleDone = () => {
    void save({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      weightKg: (() => {
        const num = parseFloat(weight);
        return weight.trim() === "" || isNaN(num) ? null : num;
      })(),
      heightCm: (() => {
        const num = parseFloat(height);
        return height.trim() === "" || isNaN(num) ? null : num;
      })(),
    });
    router.back();
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
      // Android: use custom modal
      setPhotoModalVisible(true);
    }
  };

  const handlePhotoAction = async (index: number, hasPhoto: boolean) => {
    // If user cancelled (index 3 on iOS if hasPhoto, 2 otherwise)
    if (index === (hasPhoto ? 3 : 2)) return;

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
    <YStack flex={1} backgroundColor={c.background}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header row */}
        <XStack
          paddingHorizontal="$5"
          paddingTop={insets.top + 12}
          paddingBottom="$3"
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor={c.border}
        >
          <SizableText size="$5" fontWeight="700" color={c.textPrimary}>
            Profile
          </SizableText>
          <Pressable
            onPress={handleDone}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <SizableText size="$4" fontWeight="600" color={c.primary}>
              Done
            </SizableText>
          </Pressable>
        </XStack>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom + 24, 48),
            paddingTop: 28,
            gap: 4,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar — tap to change */}
          <Pressable
            onPress={handleChangePhoto}
            style={[AVATAR_PRESSABLE_STYLE, { backgroundColor: c.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            {profile.photoUrl ? (
              <Image
                source={{ uri: profile.photoUrl }}
                style={AVATAR_IMAGE_STYLE}
                contentFit="cover"
              />
            ) : (
              <SizableText color="white" fontSize={30} fontWeight="800">
                {initials}
              </SizableText>
            )}
          </Pressable>
          <SizableText
            size="$3"
            fontWeight="600"
            textAlign="center"
            marginTop="$2"
            marginBottom="$2"
            color={c.primary}
          >
            {profile.photoUrl ? "Change photo" : "Add profile photo"}
          </SizableText>

          {/* ── Identity ─────────────────────────────────────── */}
          <SizableText
            size="$2"
            fontWeight="700"
            marginTop="$4"
            marginBottom="$1.5"
            marginLeft="$1"
            color={c.textSecondary}
            style={{ letterSpacing: 1.2 }}
          >
            IDENTITY
          </SizableText>
          <YStack
            borderRadius="$4"
            borderWidth={1}
            borderColor={c.border}
            backgroundColor={c.surface}
            overflow="hidden"
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
            <XStack
              paddingHorizontal="$4"
              paddingVertical="$4"
              alignItems="center"
              justifyContent="space-between"
            >
              <SizableText size="$4" fontWeight="500" color={c.textSecondary}>
                Email
              </SizableText>
              <SizableText size="$4" color={c.textPrimary}>
                {user?.email ?? "—"}
              </SizableText>
            </XStack>
          </YStack>

          {/* ── Physical stats ───────────────────────────────── */}
          <SizableText
            size="$2"
            fontWeight="700"
            marginTop="$4"
            marginBottom="$1.5"
            marginLeft="$1"
            color={c.textSecondary}
            style={{ letterSpacing: 1.2 }}
          >
            PHYSICAL STATS
          </SizableText>
          <YStack
            borderRadius="$4"
            borderWidth={1}
            borderColor={c.border}
            backgroundColor={c.surface}
            overflow="hidden"
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
          </YStack>

          {/* ── App settings ─────────────────────────────────── */}
          <SizableText
            size="$2"
            fontWeight="700"
            marginTop="$4"
            marginBottom="$1.5"
            marginLeft="$1"
            color={c.textSecondary}
            style={{ letterSpacing: 1.2 }}
          >
            SETTINGS
          </SizableText>
          <YStack
            borderRadius="$4"
            borderWidth={1}
            borderColor={c.border}
            backgroundColor={c.surface}
            overflow="hidden"
          >
            <XStack
              paddingHorizontal="$4"
              paddingVertical="$4"
              alignItems="center"
              justifyContent="space-between"
            >
              <YStack>
                <SizableText size="$4" fontWeight="500" color={c.textPrimary}>
                  Dark Mode
                </SizableText>
                <SizableText size="$3" marginTop="$0.5" color={c.textSecondary}>
                  {darkMode ? "On" : "Following system"}
                </SizableText>
              </YStack>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </XStack>
            <Divider color={c.border} />
            <XStack
              paddingHorizontal="$4"
              paddingVertical="$4"
              alignItems="center"
              justifyContent="space-between"
            >
              <YStack>
                <SizableText size="$4" fontWeight="500" color={c.textPrimary}>
                  Unit System
                </SizableText>
                <SizableText size="$3" marginTop="$0.5" color={c.textSecondary}>
                  {unitSystem === "metric"
                    ? "Metric (km, kg)"
                    : "Imperial (mi, lb)"}
                </SizableText>
              </YStack>
              <Switch
                value={unitSystem === "imperial"}
                onValueChange={(v) => setUnitSystem(v ? "imperial" : "metric")}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </XStack>
          </YStack>

          {/* ── Log out ──────────────────────────────────────── */}
          <Pressable
            onPress={handleLogout}
            style={[LOGOUT_PRESSABLE_STYLE, { borderColor: c.danger }]}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <SizableText size="$4" fontWeight="700" color={c.danger}>
              Log out
            </SizableText>
          </Pressable>

          <SizableText
            size="$2"
            textAlign="center"
            marginTop="$5"
            color={c.border}
          >
            GoStrich v1.0.0 · 100% Offline-First
          </SizableText>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo picker modal */}
      <PhotoPickerModal
        visible={photoModalVisible}
        onDismiss={() => setPhotoModalVisible(false)}
        title="Change Profile Photo"
        options={[
          {
            text: "Choose from Library",
            onPress: () => void pickFromLibrary(),
          },
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
        ]}
      />
      <ConfirmModal
        visible={logoutModalVisible}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        confirmDestructive
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          await logout();
          router.replace("/auth");
        }}
        colors={c}
      />
    </YStack>
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
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$4"
      alignItems="center"
      justifyContent="space-between"
    >
      <SizableText size="$4" fontWeight="500" color={c.textSecondary}>
        {label}
      </SizableText>
      <TextInput
        style={[FIELD_INPUT_STYLE, { color: c.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={c.border}
        keyboardType={keyboardType}
        returnKeyType="done"
      />
    </XStack>
  );
}

function Divider({ color }: { color: string }) {
  return <YStack height={1} marginLeft="$4" backgroundColor={color} />;
}
