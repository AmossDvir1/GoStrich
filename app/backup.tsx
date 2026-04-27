import { BackButton } from "@/components/ui/back-button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBackup } from "@/hooks/use-backup";
import { useAppStore } from "@/stores/appStore";
import { useWorkoutStore } from "@/stores/workoutStore";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SizableText, XStack, YStack } from "tamagui";

export default function BackupScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const { workouts } = useWorkoutStore();
  const { autoBackup, setAutoBackup } = useAppStore();
  const {
    backup,
    restore,
    importFromFile,
    status: backupStatus,
    errorMessage: backupError,
    lastBackupAt,
  } = useBackup();

  const [restoreConfirmVisible, setRestoreConfirmVisible] = useState(false);

  const backupStatusLabel = (() => {
    if (backupStatus === "uploading") return "Backing up...";
    if (backupStatus === "error") return backupError ?? "Backup failed";
    if (lastBackupAt) {
      const mins = Math.round((Date.now() - lastBackupAt) / 60000);
      if (mins < 2) return "Backed up just now";
      if (mins < 60) return `Backed up ${mins}m ago`;
      return `Backed up ${Math.floor(mins / 60)}h ago`;
    }
    return "Not backed up yet";
  })();

  const handleExportWorkouts = async () => {
    if (workouts.length === 0) {
      Alert.alert("No Data", "You have no workouts to export.");
      return;
    }
    try {
      const payload = JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          count: workouts.length,
          workouts,
        },
        null,
        2,
      );
      await Share.share({ message: payload, title: "GoStrich Backup" });
    } catch {
      Alert.alert("Export Failed", "Could not open the share sheet.");
    }
  };

  return (
    <YStack flex={1} backgroundColor={c.background}>
      <ConfirmModal
        visible={restoreConfirmVisible}
        title="Restore Backup?"
        message="This will merge your Google Drive backup into your current history. Existing sessions will not be deleted."
        confirmLabel="Restore"
        onCancel={() => setRestoreConfirmVisible(false)}
        onConfirm={async () => {
          setRestoreConfirmVisible(false);
          const count = await restore();
          Alert.alert(
            "Restore complete",
            count > 0
              ? `${count} session${count !== 1 ? "s" : ""} restored.`
              : "Nothing new to restore.",
          );
        }}
        colors={c}
      />

      <XStack
        paddingHorizontal="$5"
        paddingTop={insets.top + 14}
        paddingBottom="$4"
        alignItems="center"
        justifyContent="space-between"
      >
        <BackButton size={30} />
        <SizableText size="$6" fontWeight="800" color={c.textPrimary}>
          Data & Backup
        </SizableText>
        <YStack width={30} />
      </XStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom + 24, 48),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cloud Backup */}
        <SizableText
          size="$2"
          fontWeight="700"
          marginTop="$4"
          marginBottom="$1.5"
          marginLeft="$1"
          color={c.textSecondary}
          style={{ letterSpacing: 1.2 }}
        >
          CLOUD BACKUP
        </SizableText>
        <YStack
          borderRadius="$4"
          borderWidth={1}
          borderColor={c.border}
          backgroundColor={c.surface}
          overflow="hidden"
        >
          <Pressable
            onPress={() => {
              if (backupStatus === "error" && backupError) {
                Alert.alert("Backup Error", backupError);
                return;
              }
              void backup();
            }}
            disabled={backupStatus === "uploading"}
            accessibilityRole="button"
            accessibilityLabel="Back up now"
            style={{ paddingHorizontal: 16, paddingVertical: 16 }}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <SizableText size="$4" fontWeight="500" color={c.textPrimary}>
                  Back Up Now
                </SizableText>
                <SizableText
                  size="$3"
                  marginTop="$0.5"
                  color={backupStatus === "error" ? c.danger : c.textSecondary}
                >
                  {backupStatusLabel}
                </SizableText>
              </YStack>
              <SizableText size="$6" color={c.primary}>
                {backupStatus === "uploading" ? "..." : ">"}
              </SizableText>
            </XStack>
          </Pressable>
          <Divider color={c.border} />
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$4"
            alignItems="center"
            justifyContent="space-between"
          >
            <YStack flex={1} marginRight="$4">
              <SizableText size="$4" fontWeight="500" color={c.textPrimary}>
                Auto-Backup After Run
              </SizableText>
              <SizableText size="$3" marginTop="$0.5" color={c.textSecondary}>
                {autoBackup ? "Backs up to Google Drive automatically" : "Manual backups only"}
              </SizableText>
            </YStack>
            <Switch
              value={autoBackup}
              onValueChange={setAutoBackup}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={scheme === "dark" ? c.textPrimary : c.surface}
            />
          </XStack>
        </YStack>

        {/* Restore */}
        <SizableText
          size="$2"
          fontWeight="700"
          marginTop="$4"
          marginBottom="$1.5"
          marginLeft="$1"
          color={c.textSecondary}
          style={{ letterSpacing: 1.2 }}
        >
          RESTORE
        </SizableText>
        <YStack
          borderRadius="$4"
          borderWidth={1}
          borderColor={c.border}
          backgroundColor={c.surface}
          overflow="hidden"
        >
          <Pressable
            onPress={() => setRestoreConfirmVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Restore from backup"
            style={{ paddingHorizontal: 16, paddingVertical: 16 }}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <SizableText size="$4" fontWeight="500" color={c.textPrimary}>
                  Restore from Google Drive
                </SizableText>
                <SizableText size="$3" marginTop="$0.5" color={c.textSecondary}>
                  Merges backup into current history
                </SizableText>
              </YStack>
              <SizableText size="$6" color={c.primary}>{">"}</SizableText>
            </XStack>
          </Pressable>
        </YStack>

        {/* Data Transfer */}
        <SizableText
          size="$2"
          fontWeight="700"
          marginTop="$4"
          marginBottom="$1.5"
          marginLeft="$1"
          color={c.textSecondary}
          style={{ letterSpacing: 1.2 }}
        >
          DATA TRANSFER
        </SizableText>
        <YStack
          borderRadius="$4"
          borderWidth={1}
          borderColor={c.border}
          backgroundColor={c.surface}
          overflow="hidden"
        >
          <Pressable
            onPress={() => {
              void importFromFile()
                .then((count) => {
                  Alert.alert(
                    "Import complete",
                    count > 0
                      ? `${count} session${count !== 1 ? "s" : ""} imported.`
                      : "Nothing new to import.",
                  );
                  if (count > 0) void backup();
                })
                .catch((e: unknown) => {
                  Alert.alert(
                    "Import failed",
                    e instanceof Error ? e.message : "Could not read file.",
                  );
                });
            }}
            accessibilityRole="button"
            accessibilityLabel="Import from JSON file"
            style={{ paddingHorizontal: 16, paddingVertical: 16 }}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <SizableText size="$4" fontWeight="500" color={c.textPrimary}>
                  Import from File
                </SizableText>
                <SizableText size="$3" marginTop="$0.5" color={c.textSecondary}>
                  Merge a GoStrich JSON export
                </SizableText>
              </YStack>
              <SizableText size="$6" color={c.primary}>{">"}</SizableText>
            </XStack>
          </Pressable>
          <Divider color={c.border} />
          <Pressable
            onPress={() => void handleExportWorkouts()}
            accessibilityRole="button"
            accessibilityLabel="Export workouts as JSON"
            style={{ paddingHorizontal: 16, paddingVertical: 16 }}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <YStack>
                <SizableText size="$4" fontWeight="500" color={c.textPrimary}>
                  Export as JSON
                </SizableText>
                <SizableText size="$3" marginTop="$0.5" color={c.textSecondary}>
                  {workouts.length} workout{workouts.length !== 1 ? "s" : ""}
                </SizableText>
              </YStack>
              <SizableText size="$6" color={c.primary}>{">"}</SizableText>
            </XStack>
          </Pressable>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

function Divider({ color }: { color: string }) {
  return <YStack height={1} marginLeft="$4" backgroundColor={color} />;
}
