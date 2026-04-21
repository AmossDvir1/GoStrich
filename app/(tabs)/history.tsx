import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWorkoutStore } from "@/stores/workoutStore";
import { formatDuration } from "@/utils/formatting";
import { router } from "expo-router";
import React from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.background }}>
      <View className="px-6 pt-5 pb-3">
        <Text
          className="text-3xl font-extrabold"
          style={{ color: c.textPrimary }}
        >
          Sessions
        </Text>
        <Text className="text-[13px] mt-0.5" style={{ color: c.textSecondary }}>
          {workouts.length > 0
            ? `${workouts.length} run${workouts.length !== 1 ? "s" : ""}`
            : "Your past runs"}
        </Text>
      </View>

      {workouts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-3">{"🏃"}</Text>
          <Text
            className="text-[17px] font-semibold mb-1.5"
            style={{ color: c.textSecondary }}
          >
            No runs yet
          </Text>
          <Text className="text-[13px]" style={{ color: c.textSecondary }}>
            Start your first run to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-8 gap-y-3"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const date = new Date(item.startTime);
            const distKm = (item.distance / 1000).toFixed(2);
            return (
              <Pressable
                onPress={() => router.push(`/session/${item.id}` as never)}
                className="flex-row items-center rounded-2xl py-4 px-[18px]"
                style={[{ backgroundColor: c.surface }, CARD_SHADOW]}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                accessibilityRole="button"
                accessibilityLabel={`Open session: ${item.name}`}
              >
                <View className="flex-1">
                  <Text
                    className="text-[15px] font-bold mb-0.5"
                    style={{ color: c.textPrimary }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    className="text-xs mb-1.5"
                    style={{ color: c.textSecondary }}
                  >
                    {date.toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    ·{" "}
                    {date.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <View className="flex-row items-center gap-x-2">
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: c.primary }}
                    >
                      {distKm} km
                    </Text>
                    <Text className="text-[13px]" style={{ color: c.border }}>
                      |
                    </Text>
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: c.textSecondary }}
                    >
                      {formatDuration(item.duration)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleDelete(item.id, item.name)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete session: ${item.name}`}
                  className="p-1.5 ml-1"
                >
                  <Text className="text-[17px]">{"🗑"}</Text>
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
