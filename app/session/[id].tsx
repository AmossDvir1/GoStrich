import { BackButton } from "@/components/ui/back-button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Colors, MapStyles } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/stores/appStore";
import { useWorkoutStore } from "@/stores/workoutStore";
import { formatDistance, formatDuration, formatPace } from "@/utils/formatting";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SizableText, XStack, YStack } from "tamagui";

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
  const { unitSystem } = useAppStore();
  const getWorkout = useWorkoutStore((s) => s.getWorkout);
  const removeWorkout = useWorkoutStore((s) => s.removeWorkout);
  const workout = getWorkout(id);
  const insets = useSafeAreaInsets();
  const [discardVisible, setDiscardVisible] = useState(false);

  if (!workout) {
    return (
      <YStack flex={1} backgroundColor={c.background}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <SizableText size="$4" marginBottom="$1" color={c.textSecondary}>
            Session not found.
          </SizableText>
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 20,
              backgroundColor: c.primary,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Go back</Text>
          </Pressable>
        </YStack>
      </YStack>
    );
  }

  const distanceFormatted = formatDistance(workout.distance, unitSystem);
  const pace =
    workout.avgPace > 0 ? formatPace(workout.avgPace, unitSystem) : "---";
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

  const handleDiscard = () => setDiscardVisible(true);

  return (
    <YStack flex={1} backgroundColor={c.background}>
      <ConfirmModal
        visible={discardVisible}
        title="Discard Session"
        message="This run will be permanently deleted. Are you sure?"
        confirmLabel="Discard"
        confirmDestructive
        onCancel={() => setDiscardVisible(false)}
        onConfirm={() => {
          removeWorkout(id);
          router.replace("/(tabs)");
        }}
        colors={c}
      />
      <XStack
        paddingHorizontal="$5"
        paddingTop={insets.top + 14}
        paddingBottom="$3.5"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor={c.surface}
        borderBottomWidth={StyleSheet.hairlineWidth}
        borderBottomColor={c.border}
      >
        <BackButton />
        <SizableText size="$5" fontWeight="700" color={c.textPrimary}>
          Session Summary
        </SizableText>
        <View style={{ width: 36 }} />
      </XStack>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SizableText
          size="$7"
          fontWeight="800"
          marginBottom="$1"
          color={c.textPrimary}
        >
          {workout.name}
        </SizableText>
        <SizableText size="$3" marginBottom="$5" color={c.textSecondary}>
          {dateStr} · {timeStr}
        </SizableText>

        {region != null && coords.length > 1 && (
          <View
            style={[
              {
                height: 200,
                borderRadius: 20,
                overflow: "hidden",
                marginBottom: 20,
              },
              MAP_SHADOW,
            ]}
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
              customMapStyle={
                scheme === "dark" ? MapStyles.dark : MapStyles.light
              }
            >
              <Polyline
                coordinates={coords}
                strokeColor={c.primary}
                strokeWidth={4}
              />
            </MapView>
          </View>
        )}

        <YStack
          alignItems="center"
          paddingVertical="$5"
          borderRadius="$4"
          marginBottom="$4"
          backgroundColor={c.surface}
          style={CARD_SHADOW}
        >
          <Text
            style={{
              fontSize: 56,
              lineHeight: 62,
              fontWeight: "900",
              color: c.primary,
            }}
          >
            {distanceFormatted.split(" ")[0]}
          </Text>
          <SizableText
            size="$3"
            fontWeight="600"
            marginTop="$1"
            color={c.textSecondary}
          >
            {distanceFormatted.split(" ")[1]}
          </SizableText>
        </YStack>

        <XStack flexWrap="wrap" gap="$3" marginBottom="$5">
          <StatCard
            label="Duration"
            value={formatDuration(workout.duration)}
            c={c}
          />
          <StatCard label="Avg Pace" value={pace} c={c} />
          <StatCard
            label="Max Speed"
            value={
              workout.maxSpeed > 0
                ? `${(unitSystem === "imperial" ? workout.maxSpeed * 2.237 : workout.maxSpeed * 3.6).toFixed(1)} ${unitSystem === "imperial" ? "mph" : "km/h"}`
                : "---"
            }
            c={c}
          />
          <StatCard label="Distance" value={distanceFormatted} c={c} />
        </XStack>

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={[
            {
              paddingVertical: 16,
              borderRadius: 20,
              alignItems: "center",
              marginBottom: 12,
              backgroundColor: c.primary,
            },
            DONE_BTN_SHADOW,
          ]}
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          accessibilityRole="button"
        >
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "800",
            }}
          >
            Save and Done
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDiscard}
          style={{
            paddingVertical: 14,
            borderRadius: 20,
            alignItems: "center",
          }}
          android_ripple={{ color: "rgba(239,68,68,0.1)" }}
          accessibilityRole="button"
          accessibilityLabel="Discard session"
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#EF4444" }}>
            Discard this run
          </Text>
        </Pressable>
      </ScrollView>
    </YStack>
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
    <YStack
      width="47%"
      paddingVertical="$3"
      paddingHorizontal="$3"
      borderRadius="$4"
      alignItems="center"
      backgroundColor={c.surface}
      style={STAT_SHADOW}
    >
      <SizableText
        size="$5"
        fontWeight="800"
        marginBottom="$1"
        color={c.textPrimary}
      >
        {value}
      </SizableText>
      <SizableText size="$2" fontWeight="600" color={c.textSecondary}>
        {label}
      </SizableText>
    </YStack>
  );
}
