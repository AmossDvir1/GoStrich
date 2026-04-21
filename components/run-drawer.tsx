import { RunnerCharacter } from "@/components/ui/runner-character";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { RunState } from "@/hooks/use-run-session";
import { formatDuration } from "@/utils/formatting";
import React from "react";
import { Pressable, Text, View } from "react-native";

const OSTRICH_D = 80;
const OSTRICH_OVERLAP = 28;
const BTN_HEIGHT = 60;

const OSTRICH_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 8,
} as const;

const ACTION_BTN_SHADOW = {
  shadowColor: "#10B981",
  shadowOpacity: 0.35,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
} as const;

interface RunDrawerProps {
  runState: RunState;
  elapsed: number;
  distanceKm: number;
  locationName: string | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export function RunDrawer({
  runState,
  elapsed,
  distanceKm,
  locationName,
  onStart,
  onPause,
  onResume,
  onEnd,
}: RunDrawerProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const metricsRow = (
    <View className="flex-row items-center mb-4">
      <View className="flex-1 items-center">
        <Text
          className="text-[32px] font-extrabold"
          style={{ color: c.textPrimary }}
        >
          {formatDuration(elapsed)}
        </Text>
        <Text
          className="text-[11px] font-semibold mt-0.5"
          style={{ color: c.textSecondary }}
        >
          Time
        </Text>
      </View>
      <View className="w-px h-10 mx-2" style={{ backgroundColor: c.border }} />
      <View className="flex-1 items-center">
        <Text
          className="text-[32px] font-extrabold"
          style={{ color: c.textPrimary }}
        >
          {distanceKm.toFixed(2)}
        </Text>
        <Text
          className="text-[11px] font-semibold mt-0.5"
          style={{ color: c.textSecondary }}
        >
          km
        </Text>
      </View>
    </View>
  );

  function btnRow(
    isRunningAnim: boolean,
    onPress: () => void,
    btnColor: string,
    label: string,
  ) {
    return (
      <View className="flex-row items-center">
        <View
          className="rounded-full overflow-hidden z-[2] border-2 border-white"
          style={[
            { width: OSTRICH_D, height: OSTRICH_D, backgroundColor: "#EDE8DF" },
            OSTRICH_SHADOW,
          ]}
          pointerEvents="none"
        >
          <RunnerCharacter isRunning={isRunningAnim} size={OSTRICH_D} />
        </View>
        <Pressable
          onPress={onPress}
          className="flex-1 rounded-full items-center justify-center z-[1]"
          style={[
            {
              height: BTN_HEIGHT,
              marginLeft: -OSTRICH_OVERLAP,
              paddingLeft: OSTRICH_OVERLAP + 8,
              backgroundColor: btnColor,
            },
            ACTION_BTN_SHADOW,
          ]}
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text
            className="text-white text-[15px] font-extrabold"
            style={{ letterSpacing: 1.5 }}
          >
            {label}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (runState === "idle") {
    return (
      <>
        <Text
          className="text-3xl font-extrabold mb-1"
          style={{ color: c.textPrimary }}
        >
          Ready to run
        </Text>
        <View className="flex-row items-center mb-5 min-h-[20px]">
          {locationName ? (
            <>
              <Text className="text-[13px]" style={{ color: c.primary }}>
                {"📍 "}
              </Text>
              <Text className="text-[13px]" style={{ color: c.textSecondary }}>
                {locationName}
              </Text>
            </>
          ) : null}
        </View>
        {btnRow(false, onStart, c.primary, "START RUN")}
      </>
    );
  }

  if (runState === "running") {
    return (
      <>
        {metricsRow}
        {btnRow(true, onPause, "#F59E0B", "PAUSE")}
      </>
    );
  }

  // paused
  return (
    <>
      {metricsRow}
      {btnRow(false, onResume, c.primary, "RESUME")}
      <Pressable
        onPress={onEnd}
        className="mt-2.5 py-3 rounded-full items-center"
        style={{ borderWidth: 1.5, borderColor: "#EF4444" }}
        android_ripple={{ color: "rgba(239,68,68,0.1)" }}
        accessibilityRole="button"
        accessibilityLabel="End session"
      >
        <Text
          className="text-sm font-bold"
          style={{ color: "#EF4444", letterSpacing: 0.5 }}
        >
          End Session
        </Text>
      </Pressable>
    </>
  );
}
