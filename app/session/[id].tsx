import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWorkoutStore } from "@/stores/workoutStore";
import { formatDuration, formatPace } from "@/utils/formatting";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const MAP_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

const STAT_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

const DONE_BTN_SHADOW = {
  shadowColor: "#10B981",
  shadowOpacity: 0.3,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;

function routeRegion(coords: { latitude: number; longitude: number }[]) {
  if (coords.length === 0) return undefined;
  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const pad = 0.002;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad * 2, 0.008),
    longitudeDelta: Math.max(maxLon - minLon + pad * 2, 0.008),
  };
}

export default function SessionSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const getWorkout = useWorkoutStore((s) => s.getWorkout);
  const removeWorkout = useWorkoutStore((s) => s.removeWorkout);
  const workout = getWorkout(id);

  if (!workout) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: c.background }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-base mb-4" style={{ color: c.textSecondary }}>
            Session not found.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="px-6 py-3 rounded-full"
            style={{ backgroundColor: c.primary }}
          >
            <Text className="text-white font-bold">Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const distKm = (workout.distance / 1000).toFixed(2);
  const pace = workout.avgPace > 0 ? formatPace(workout.avgPace) : "---";
  const date = new Date(workout.startTime);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const coords = workout.routeCoords ?? [];
  const region = routeRegion(coords);

  const handleDiscard = () => {
    Alert.alert(
      "Discard Session",
      "This run will be permanently deleted. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            removeWorkout(id);
            router.replace("/(tabs)");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.background }}>
      <View
        className="flex-row items-center justify-between px-5 py-3.5"
        style={{
          backgroundColor: c.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: "#E2E8F0",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text className="text-[22px] font-bold w-8" style={{ color: c.primary }}>{"<"}</Text>
        </Pressable>
        <Text className="text-[17px] font-bold" style={{ color: c.textPrimary }}>
          Session Summary
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[22px] font-extrabold mb-1" style={{ color: c.textPrimary }}>
          {workout.name}
        </Text>
        <Text className="text-[13px] mb-5" style={{ color: c.textSecondary }}>
          {dateStr} · {timeStr}
        </Text>

        {region != null && coords.length > 1 && (
          <View
            className="h-[200px] rounded-[20px] overflow-hidden mb-5"
            style={MAP_SHADOW}
          >
            <MapView
              provider={PROVIDER_DEFAULT}
              style={StyleSheet.absoluteFill}
              initialRegion={region}
              scrollEnabled
              zoomEnabled
              rotateEnabled={false}
              pitchEnabled={false}
              showsMyLocationButton={false}
              showsCompass={false}
              toolbarEnabled={false}
            >
              <Polyline
                coordinates={coords}
                strokeColor={c.primary}
                strokeWidth={4}
              />
            </MapView>
          </View>
        )}

        <View
          className="items-center py-8 rounded-3xl mb-5"
          style={[{ backgroundColor: c.surface }, CARD_SHADOW]}
        >
          <Text
            className="font-black"
            style={{ fontSize: 72, lineHeight: 80, color: c.primary }}
          >
            {distKm}
          </Text>
          <Text className="text-base font-semibold mt-1" style={{ color: c.textSecondary }}>
            kilometres
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3 mb-8">
          <StatCard label="Duration" value={formatDuration(workout.duration)} c={c} />
          <StatCard label="Avg Pace" value={pace} c={c} />
          <StatCard
            label="Max Speed"
            value={workout.maxSpeed > 0 ? `${(workout.maxSpeed * 3.6).toFixed(1)} km/h` : "---"}
            c={c}
          />
          <StatCard
            label="Distance"
            value={`${(workout.distance / 1000).toFixed(2)} km`}
            c={c}
          />
        </View>

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className="py-4 rounded-full items-center mb-3"
          style={[{ backgroundColor: c.primary }, DONE_BTN_SHADOW]}
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          accessibilityRole="button"
        >
          <Text className="text-white text-base font-extrabold">Save and Done</Text>
        </Pressable>

        <Pressable
          onPress={handleDiscard}
          className="py-3.5 rounded-full items-center"
          android_ripple={{ color: "rgba(239,68,68,0.1)" }}
          accessibilityRole="button"
          accessibilityLabel="Discard session"
        >
          <Text className="text-sm font-semibold" style={{ color: "#EF4444" }}>
            Discard this run
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: (typeof Colors)["light"];
}) {
  return (
    <View
      className="w-[47%] py-5 px-4 rounded-2xl items-center"
      style={[{ backgroundColor: c.surface }, STAT_SHADOW]}
    >
      <Text className="text-[22px] font-extrabold mb-1" style={{ color: c.textPrimary }}>
        {value}
      </Text>
      <Text className="text-xs font-semibold" style={{ color: c.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}