import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCallback, useEffect, useRef } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";

interface RunCountdownProps {
  visible: boolean;
  onFinish: () => void;
}

// How long "GO!" stays visible before the overlay closes and the run starts (ms)
const GO_DISPLAY_MS = 650;

export function RunCountdown({ visible, onFinish }: RunCountdownProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const onFinishRef = useRef(onFinish);
  const completedRef = useRef(false);
  onFinishRef.current = onFinish;

  // Safety: if the component unmounts while the timeout is pending, clear it
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    completedRef.current = false;
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [visible]);

  const finishCountdown = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onFinishRef.current();
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/*
         * key changes each time visible flips true → false → true,
         * so CountdownCircleTimer always restarts fresh.
         */}
        <CountdownCircleTimer
          key={visible ? "active" : "idle"}
          isPlaying={visible}
          duration={3}
          colors={c.primary as `#${string}`}
          size={180}
          strokeWidth={14}
          trailColor="rgba(255,255,255,0.15)"
          onComplete={() => {
            timeoutRef.current = setTimeout(finishCountdown, GO_DISPLAY_MS);
          }}
        >
          {({ remainingTime }) => (
            <Text
              style={{
                fontSize: remainingTime === 0 ? 52 : 72,
                fontWeight: "900",
                color: remainingTime === 0 ? c.primary : c.textPrimary,
                letterSpacing: remainingTime === 0 ? 2 : 0,
              }}
            >
              {remainingTime === 0 ? "GO!" : String(remainingTime)}
            </Text>
          )}
        </CountdownCircleTimer>

        <Pressable
          onPress={finishCountdown}
          accessibilityRole="button"
          accessibilityLabel="Skip countdown"
          style={({ pressed }) => ({
            marginTop: 22,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.25)",
            backgroundColor: pressed
              ? "rgba(255,255,255,0.12)"
              : "rgba(255,255,255,0.06)",
          })}
        >
          <Text
            style={{
              color: c.textPrimary,
              fontSize: 15,
              fontWeight: "700",
              letterSpacing: 0.4,
            }}
          >
            Skip
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
