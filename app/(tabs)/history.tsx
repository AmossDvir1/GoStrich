import { STORY_HEIGHT, STORY_WIDTH, StoryCard } from "@/components/story-card";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { shareSessionAsStory } from "@/services/sharing";
import { useAppStore } from "@/stores/appStore";
import { useWorkoutStore } from "@/stores/workoutStore";
import { WorkoutSummary } from "@/types/workout";
import { formatDuration } from "@/utils/formatting";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    Text,
    View,
} from "react-native";
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
  const { unitSystem } = useAppStore();

  const [sharingWorkout, setSharingWorkout] = useState<WorkoutSummary | null>(
    null,
  );
  const [isSharing, setIsSharing] = useState(false);
  const storyCardRef = useRef<View | null>(null);

  useEffect(() => {
    if (!sharingWorkout) return;
    shareSessionAsStory(
      storyCardRef,
      () => setIsSharing(true),
      () => {
        setIsSharing(false);
        setSharingWorkout(null);
      },
    );
  }, [sharingWorkout]);

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
                  onPress={() => setSharingWorkout(item)}
                  disabled={isSharing}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Share session: ${item.name}`}
                  style={{ padding: 6, marginLeft: 4 }}
                >
                  {isSharing && sharingWorkout?.id === item.id ? (
                    <ActivityIndicator size="small" color={c.primary} />
                  ) : (
                    <Text style={{ fontSize: 17 }}>{"\uD83D\uDCE4"}</Text>
                  )}
                </Pressable>
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

      {/* Off-screen StoryCard — mounted when a share is triggered */}
      {sharingWorkout && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: -STORY_WIDTH - 20,
            width: STORY_WIDTH,
            height: STORY_HEIGHT,
            opacity: 0,
          }}
          pointerEvents="none"
        >
          <StoryCard
            ref={storyCardRef}
            workout={sharingWorkout}
            unitSystem={unitSystem}
          />
        </View>
      )}
    </ScreenWrapper>
  );
}
