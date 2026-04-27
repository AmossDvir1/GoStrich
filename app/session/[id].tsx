import { SessionSpeedChart } from "@/components/session-speed-chart";
import { STORY_HEIGHT, STORY_WIDTH, StoryCard } from "@/components/story-card";
import { BackButton } from "@/components/ui/back-button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Colors, MapStyles } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { shareSessionAsStory } from "@/services/sharing";
import { useAppStore } from "@/stores/appStore";
import { useProfileStore } from "@/stores/profileStore";
import { useWorkoutStore } from "@/stores/workoutStore";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatSpeed,
} from "@/utils/formatting";
import { douglasPeucker } from "@/utils/gps-utils";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState, useMemo } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, type View } from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Popover, SizableText, XStack, YStack } from "tamagui";

const MAP_SHADOW = {
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

const CARD_SHADOW = {
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

const STAT_SHADOW = {
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

const DONE_BTN_SHADOW = {
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
  const { id, isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();
  const isNewSession = isNew === "1";
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const { unitSystem } = useAppStore();
  const weightKg = useProfileStore((s) => s.profile.weightKg);
  const getWorkout = useWorkoutStore((s) => s.getWorkout);
  const removeWorkout = useWorkoutStore((s) => s.removeWorkout);
  const workout = getWorkout(id);
  const insets = useSafeAreaInsets();
  const [discardVisible, setDiscardVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapHeight = useRef(new Animated.Value(200)).current;
  const storyCardRef = useRef<View>(null);

  // Phase 2.1: Memoize polyline simplification (must be before early return)
  const { simplifiedCoords, region } = useMemo(() => {
    const coords = workout?.routeCoords ?? [];
    const simplified =
      coords.length > 10 ? douglasPeucker(coords, 0.00015) : coords;
    const mapRegion = routeRegion(simplified);
    return {
      simplifiedCoords: simplified,
      region: mapRegion,
    };
  }, [workout?.routeCoords]);

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
            <SizableText color="white" fontWeight="700">
              Go back
            </SizableText>
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

  const handleDiscard = () => setDiscardVisible(true);

  const handleShare = () => {
    shareSessionAsStory(
      storyCardRef,
      () => setIsSharing(true),
      () => setIsSharing(false),
    );
  };

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
        paddingBottom="$4"
        alignItems="center"
        justifyContent="space-between"
      >
        <BackButton size={30} />
        <SizableText size="$6" fontWeight="800" color={c.textPrimary}>
          Session Summary
        </SizableText>
        <Pressable
          onPress={handleShare}
          disabled={isSharing}
          style={{
            width: 30,
            height: 30,
            alignItems: "center",
            justifyContent: "center",
            opacity: isSharing ? 0.5 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel="Share session as Instagram Story"
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <Ionicons name="share-outline" size={26} color={c.primary} />
          )}
        </Pressable>
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

        {region != null && simplifiedCoords.length > 1 && (
          <Animated.View
            style={[
              {
                height: mapHeight,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 20,
              },
              MAP_SHADOW,
              { shadowColor: c.textPrimary },
            ]}
          >
            <MapView
              provider={PROVIDER_DEFAULT}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
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
                coordinates={simplifiedCoords}
                strokeColor={c.mapPath}
                strokeWidth={4}
              />
            </MapView>
            {/* Expand / collapse button */}
            <Pressable
              onPress={() => {
                const next = !mapExpanded;
                Animated.timing(mapHeight, {
                  toValue: next ? 360 : 200,
                  duration: 280,
                  useNativeDriver: false,
                }).start();
                setMapExpanded(next);
              }}
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(0,0,0,0.45)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={mapExpanded ? "contract-outline" : "expand-outline"}
                size={18}
                color="white"
              />
            </Pressable>
          </Animated.View>
        )}

        <SessionSpeedChart
          speedSeries={workout.speedSeries}
          pauseIntervals={workout.pauseIntervals}
          unitSystem={unitSystem}
        />

        <YStack
          alignItems="center"
          paddingVertical="$5"
          borderRadius="$4"
          marginBottom="$4"
          backgroundColor={c.surface}
          style={[CARD_SHADOW, { shadowColor: c.textPrimary }]}
        >
          <SizableText
            fontSize={56}
            lineHeight={62}
            fontWeight="900"
            color={c.primary}
          >
            {distanceFormatted.split(" ")[0]}
          </SizableText>
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
                ? formatSpeed(workout.maxSpeed * 3.6, unitSystem)
                : "---"
            }
            c={c}
          />
          <StatCard
            label="Calories"
            value={
              weightKg != null
                ? `${Math.round((workout.distance / 1000) * weightKg * 1.036)} kcal`
                : "--"
            }
            warning={
              weightKg == null
                ? "Set your weight in Profile to see calories burned"
                : undefined
            }
            c={c}
          />
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
              display: isNewSession ? "flex" : "none",
            },
            DONE_BTN_SHADOW,
            { shadowColor: c.primary },
          ]}
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          accessibilityRole="button"
        >
          <SizableText color="white" fontWeight="800" size="$5">
            Save and Done
          </SizableText>
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
          <SizableText size="$3" fontWeight="600" color={c.danger}>
            {isNewSession ? "Discard this run" : "Delete this run"}
          </SizableText>
        </Pressable>
      </ScrollView>

      {/* Off-screen StoryCard — mounted hidden so captureRef can capture it */}
      <YStack
        position="absolute"
        top={0}
        left={-STORY_WIDTH - 20}
        width={STORY_WIDTH}
        height={STORY_HEIGHT}
        opacity={0}
        pointerEvents="none"
      >
        <StoryCard
          ref={storyCardRef}
          workout={workout}
          unitSystem={unitSystem}
        />
      </YStack>
    </YStack>
  );
}

function StatCard({
  label,
  value,
  c,
  warning,
}: {
  label: string;
  value: string;
  c: (typeof Colors)["light"];
  warning?: string;
}) {
  return (
    <YStack
      width="47%"
      paddingVertical="$3"
      paddingHorizontal="$3"
      borderRadius="$4"
      alignItems="center"
      backgroundColor={c.surface}
      style={[STAT_SHADOW, { shadowColor: c.textPrimary }]}
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
      {warning != null && (
        <Popover placement="top" allowFlip>
          <Popover.Trigger asChild>
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Calories info"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 16,
                height: 16,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: c.warning,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SizableText
                size="$1"
                fontWeight="800"
                color={c.warning}
                lineHeight={12}
              >
                !
              </SizableText>
            </Pressable>
          </Popover.Trigger>
          <Popover.Content
            borderWidth={1}
            borderColor={c.warning}
            backgroundColor={c.surface}
            padding="$3"
            borderRadius="$3"
            maxWidth={200}
          >
            <SizableText size="$2" color={c.warning} textAlign="center">
              {warning}
            </SizableText>
          </Popover.Content>
        </Popover>
      )}
    </YStack>
  );
}
