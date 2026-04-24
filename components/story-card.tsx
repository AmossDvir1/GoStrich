import { Colors } from "@/constants/theme";
import { WorkoutSummary } from "@/types/workout";
import { formatDistance, formatDuration, formatPace } from "@/utils/formatting";
import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Polyline, PROVIDER_DEFAULT } from "react-native-maps";

export const STORY_WIDTH = 405;
export const STORY_HEIGHT = 720;

interface StoryCardProps {
  workout: WorkoutSummary;
  unitSystem: "metric" | "imperial";
}

function routeRegion(coords: { latitude: number; longitude: number }[]) {
  if (coords.length === 0) return undefined;
  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const pad = 0.003;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad * 2, 0.01),
    longitudeDelta: Math.max(maxLon - minLon + pad * 2, 0.01),
  };
}

export const StoryCard = forwardRef<View, StoryCardProps>(
  ({ workout, unitSystem }, ref) => {
    const coords = workout.routeCoords ?? [];
    const region = routeRegion(coords);
    const hasRoute = coords.length > 1;

    const distanceFormatted = formatDistance(workout.distance, unitSystem);
    const distValue = distanceFormatted.split(" ")[0];
    const distUnit = distanceFormatted.split(" ")[1];
    const pace =
      workout.avgPace > 0 ? formatPace(workout.avgPace, unitSystem) : "---";
    const duration = formatDuration(workout.duration);

    const date = new Date(workout.startTime);
    const dateStr = date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <LinearGradient
          colors={["#0B1120", "#053528"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative accent glow */}
        <View style={styles.accentGlow} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandEmoji}>🐦</Text>
            <Text style={styles.appName}>GoStrich</Text>
          </View>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>

        {/* Workout Name */}
        <Text style={styles.workoutName} numberOfLines={1}>
          {workout.name}
        </Text>

        {/* Map Section */}
        <View style={styles.mapContainer}>
          {hasRoute && region ? (
            <MapView
              provider={PROVIDER_DEFAULT}
              style={StyleSheet.absoluteFill}
              initialRegion={region}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
              toolbarEnabled={false}
              liteMode
            >
              <Polyline
                coordinates={coords}
                strokeColor={Colors.light.primary}
                strokeWidth={5}
              />
            </MapView>
          ) : (
            <View style={styles.noMapPlaceholder}>
              <Text style={styles.noMapEmoji}>🏃</Text>
              <Text style={styles.noMapText}>Route not recorded</Text>
            </View>
          )}
          {/* Frosted edge overlay so map blends into card */}
          <LinearGradient
            colors={["transparent", "rgba(5,53,40,0.55)"]}
            start={{ x: 0, y: 0.6 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.heroDistance}>{distValue}</Text>
          <Text style={styles.heroUnit}>{distUnit}</Text>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{duration}</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pace}</Text>
              <Text style={styles.statLabel}>AVG PACE</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>#GoStrich · #Running</Text>
        </View>
      </View>
    );
  },
);

StoryCard.displayName = "StoryCard";

const styles = StyleSheet.create({
  card: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
  },
  accentGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(16,185,129,0.12)",
    bottom: 200,
    right: -60,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  brandEmoji: {
    fontSize: 16,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  dateText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "500",
  },
  workoutName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 28,
    marginBottom: 14,
    marginTop: 8,
    letterSpacing: 0.2,
  },
  mapContainer: {
    marginHorizontal: 20,
    height: 290,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1A2E3B",
  },
  noMapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  noMapEmoji: {
    fontSize: 48,
  },
  noMapText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    fontWeight: "500",
  },
  statsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  heroDistance: {
    color: "#FFFFFF",
    fontSize: 76,
    fontWeight: "900",
    lineHeight: 84,
    letterSpacing: -3,
  },
  heroUnit: {
    color: Colors.light.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statDivider: {
    width: 10,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    alignItems: "center",
    gap: 10,
  },
  footerLine: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  footerText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
