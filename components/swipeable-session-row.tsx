import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppStore } from "@/stores/appStore";
import { WorkoutSummary } from "@/types/workout";
import { formatDistance, formatDuration } from "@/utils/formatting";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { SizableText, XStack, YStack } from "tamagui";

const REVEAL_WIDTH = 72;

const SPRING_CONFIG = { damping: 20, stiffness: 200 } as const;

interface SwipeableSessionRowProps {
  item: WorkoutSummary;
  onDeletePress: (id: string, name: string) => void;
}

export function SwipeableSessionRow({
  item,
  onDeletePress,
}: SwipeableSessionRowProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const unitSystem = useAppStore((s) => s.unitSystem);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const distanceLabel = formatDistance(item.distance, unitSystem);
  const dateStr = new Date(item.startTime).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const close = useCallback(() => {
    translateX.value = withSpring(0, SPRING_CONFIG);
  }, [translateX]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      translateX.value = Math.max(
        -REVEAL_WIDTH,
        Math.min(0, startX.value + e.translationX),
      );
    })
    .onEnd((e) => {
      const projected = startX.value + e.translationX;
      if (projected < -REVEAL_WIDTH / 2) {
        translateX.value = withSpring(-REVEAL_WIDTH, SPRING_CONFIG);
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleDeletePress = useCallback(() => {
    close();
    onDeletePress(item.id, item.name);
  }, [item.id, item.name, onDeletePress, close]);

  return (
    <View
      style={{
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: c.textPrimary,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {/* Delete button revealed behind the card */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: REVEAL_WIDTH,
          backgroundColor: c.danger,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={handleDeletePress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete session: ${item.name}`}
          style={{ padding: 12 }}
        >
          <AntDesign name="delete" size={22} color="white" />
        </Pressable>
      </View>

      {/* Swipeable card — slides left to reveal delete */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            cardStyle,
            {
              backgroundColor: c.surface,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 18,
              elevation: 2,
            },
          ]}
        >
          <Pressable
            onPress={() => router.push(`/session/${item.id}` as never)}
            style={{ flex: 1 }}
            android_ripple={{ color: "rgba(0,0,0,0.05)" }}
            accessibilityRole="button"
            accessibilityLabel={`Open session: ${item.name}`}
          >
            <YStack flex={1}>
              <XStack
                alignItems="center"
                justifyContent="space-between"
                marginBottom="$1"
              >
                <SizableText size="$4" fontWeight="700" color={c.textPrimary}>
                  {item.name}
                </SizableText>
                <SizableText size="$2" color={c.textSecondary}>
                  {dateStr}
                </SizableText>
              </XStack>
              <XStack alignItems="center" gap="$2">
                <SizableText size="$3" fontWeight="600" color={c.primary}>
                  {distanceLabel}
                </SizableText>
                <SizableText size="$3" color={c.border}>
                  |
                </SizableText>
                <SizableText size="$3" fontWeight="600" color={c.textSecondary}>
                  {formatDuration(item.duration)}
                </SizableText>
              </XStack>
            </YStack>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
