import { SwipeableSessionRow } from "@/components/swipeable-session-row";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWorkoutStore } from "@/stores/workoutStore";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { SizableText, YStack } from "tamagui";

type SortKey =
  | "recent"
  | "oldest"
  | "farthest"
  | "nearest"
  | "longest"
  | "shortest";

// Each group: [default/desc option, toggled/asc option]
const CHIP_GROUPS: [SortKey, SortKey, string, string][] = [
  ["recent", "oldest", "Recent", "Oldest"],
  ["farthest", "nearest", "Farthest", "Nearest"],
  ["longest", "shortest", "Longest", "Shortest"],
];

export default function HistoryScreen() {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const workouts = useWorkoutStore((s) => s.workouts);
  const removeWorkout = useWorkoutStore((s) => s.removeWorkout);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const sortedWorkouts = useMemo(() => {
    const copy = [...workouts];
    switch (sortBy) {
      case "oldest":
        return copy.sort((a, b) => a.startTime - b.startTime);
      case "farthest":
        return copy.sort((a, b) => b.distance - a.distance);
      case "nearest":
        return copy.sort((a, b) => a.distance - b.distance);
      case "longest":
        return copy.sort((a, b) => b.duration - a.duration);
      case "shortest":
        return copy.sort((a, b) => a.duration - b.duration);
      default:
        return copy.sort((a, b) => b.startTime - a.startTime);
    }
  }, [workouts, sortBy]);

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

      {workouts.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 24,
            paddingBottom: 12,
            gap: 8,
          }}
        >
          {CHIP_GROUPS.map(([keyA, keyB, labelA, labelB]) => {
            const active = sortBy === keyA || sortBy === keyB;
            const label = sortBy === keyB ? labelB : labelA;
            return (
              <Pressable
                key={keyA}
                onPress={() => {
                  if (sortBy === keyA) setSortBy(keyB);
                  else if (sortBy === keyB) setSortBy(keyA);
                  else setSortBy(keyA);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: active ? c.primary : c.surface,
                  borderWidth: 1,
                  borderColor: active ? c.primary : c.border,
                  alignSelf: "flex-start",
                }}
              >
                <SizableText
                  size="$2"
                  fontWeight="600"
                  color={active ? "white" : c.textSecondary}
                >
                  {label}
                </SizableText>
              </Pressable>
            );
          })}
        </View>
      )}
      {workouts.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <SizableText fontSize={48} marginBottom="$3">
            {"🏃"}
          </SizableText>
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
          data={sortedWorkouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 32,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SwipeableSessionRow
              item={item}
              onDeletePress={(id, name) => setDeleteTarget({ id, name })}
            />
          )}
        />
      )}

      <ConfirmModal
        visible={deleteTarget !== null}
        title="Delete Session"
        message={`Delete "${deleteTarget?.name ?? ""}"? This run will be permanently deleted.`}
        confirmLabel="Delete"
        confirmDestructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removeWorkout(deleteTarget.id);
          setDeleteTarget(null);
        }}
        colors={c}
      />
    </ScreenWrapper>
  );
}
