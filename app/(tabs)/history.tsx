import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { useWorkoutStore } from "@/stores/workoutStore";
import { formatDuration } from "@/utils/formatting";
import { router } from "expo-router";
import React from "react";
import { Alert, FlatList, Pressable, Text } from "react-native";
import { SizableText, XStack, YStack } from "tamagui";

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

export default function HistoryScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const workouts = useWorkoutStore((s) => s.workouts);
  const removeWorkout = useWorkoutStore((s) => s.removeWorkout);

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Session", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeWorkout(id),
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <YStack paddingHorizontal="$6" paddingTop="$5" paddingBottom="$3">
        <SizableText size="$9" fontWeight="800" color={c.textPrimary}>
          Sessions
        </SizableText>
        <SizableText size="$3" marginTop="$1" color={c.textSecondary}>
          {workouts.length > 0
            ? `${workouts.length} run${workouts.length !== 1 ? "s" : ""}`
            : "Your past runs"}
        </SizableText>
      </YStack>

      {workouts.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text style={{ fontSize: 48, marginBottom: 12 }}>{"🏃"}</Text>
          <SizableText
            size="$5"
            fontWeight="600"
            marginBottom="$3"
            color={c.textSecondary}
          >
            No runs yet
          </SizableText>
          <SizableText size="$3" color={c.textSecondary}>
            Start your first run to see it here
          </SizableText>
        </YStack>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 32,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const date = new Date(item.startTime);
            const distKm = (item.distance / 1000).toFixed(2);
            return (
              <Pressable
                onPress={() => router.push(`/session/${item.id}` as never)}
                style={[
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 20,
                    paddingVertical: 16,
                    paddingHorizontal: 18,
                    backgroundColor: c.surface,
                  },
                  CARD_SHADOW,
                ]}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                accessibilityRole="button"
                accessibilityLabel={`Open session: ${item.name}`}
              >
                <YStack flex={1}>
                  <SizableText
                    size="$4"
                    fontWeight="700"
                    marginBottom="$1"
                    color={c.textPrimary}
                  >
                    {item.name}
                  </SizableText>
                  <XStack alignItems="center" gap="$2">
                    <SizableText size="$3" fontWeight="600" color={c.primary}>
                      {distKm} km
                    </SizableText>
                    <SizableText size="$3" color={c.border}>
                      |
                    </SizableText>
                    <SizableText
                      size="$3"
                      fontWeight="600"
                      color={c.textSecondary}
                    >
                      {formatDuration(item.duration)}
                    </SizableText>
                  </XStack>
                </YStack>
                <Pressable
                  onPress={() => handleDelete(item.id, item.name)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete session: ${item.name}`}
                  style={{ padding: 6, marginLeft: 4 }}
                >
                  <Text style={{ fontSize: 17 }}>{"🗑"}</Text>
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
}
