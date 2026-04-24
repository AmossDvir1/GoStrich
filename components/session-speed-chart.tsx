import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    downsampleSpeedSeries,
    prepareSpeedSeries,
    speedMpsToDisplay,
} from "@/services/tracking";
import type { PauseInterval, SpeedPoint } from "@/types/workout";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import {
    Circle,
    Line,
    Path,
    Rect,
    Svg,
    Text as SvgText,
} from "react-native-svg";
import { SizableText, XStack, YStack } from "tamagui";

interface SessionSpeedChartProps {
  speedSeries?: SpeedPoint[];
  pauseIntervals?: PauseInterval[];
  unitSystem: "metric" | "imperial";
}

// Uniform small padding — Y/X labels are rendered inside the plot area or below the SVG
const CHART_HEIGHT = 160;
const PAD = 8;
const PAD_TOP = 14;

function formatTimelineMs(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const totalSeconds = Math.round(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return secs === 0
    ? `${mins}m`
    : `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SessionSpeedChart({
  speedSeries,
  pauseIntervals,
  unitSystem,
}: SessionSpeedChartProps) {
  const scheme = useColorScheme();
  const c = Colors[scheme];
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(320);

  const prepared = useMemo(() => {
    const normalized = prepareSpeedSeries(speedSeries, pauseIntervals);
    return downsampleSpeedSeries(normalized, 80);
  }, [speedSeries, pauseIntervals]);

  const points = useMemo(
    () =>
      prepared.map((point) => ({
        t: point.t,
        speed: speedMpsToDisplay(point.speedMps ?? 0, unitSystem),
      })),
    [prepared, unitSystem],
  );

  useEffect(
    () => () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    },
    [],
  );

  if (points.length < 2) {
    return (
      <YStack
        borderRadius="$4"
        padding="$4"
        backgroundColor={c.surface}
        marginBottom="$4"
      >
        <SizableText size="$4" fontWeight="700" color={c.textPrimary}>
          Speed Timeline
        </SizableText>
        <SizableText size="$3" marginTop="$2" color={c.textSecondary}>
          No speed timeline available for this session.
        </SizableText>
      </YStack>
    );
  }

  const maxT = Math.max(...points.map((p) => p.t));
  const maxSpeed = Math.max(...points.map((p) => p.speed), 1);
  const minSpeed = Math.min(...points.map((p) => p.speed), 0);
  const speedRange = Math.max(0.1, maxSpeed - minSpeed);
  const unitLabel = unitSystem === "imperial" ? "mph" : "km/h";

  // Chart plot area bounds — symmetric small margins, labels live inside the area
  const plotLeft = PAD;
  const plotRight = chartWidth - PAD;
  const plotTop = PAD_TOP;
  const plotBottom = CHART_HEIGHT - PAD;

  const toX = (t: number) =>
    plotLeft + (t / Math.max(1, maxT)) * (plotRight - plotLeft);
  const toY = (speed: number) =>
    plotTop + ((maxSpeed - speed) / speedRange) * (plotBottom - plotTop);

  const linePath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${toX(p.t).toFixed(1)} ${toY(p.speed).toFixed(1)}`,
    )
    .join(" ");

  const maxIndex = points.reduce(
    (best, p, i) => (p.speed > points[best].speed ? i : best),
    0,
  );
  const minIndex = points.reduce(
    (best, p, i) => (p.speed < points[best].speed ? i : best),
    0,
  );

  const highlightIndex = selectedIndex ?? maxIndex;
  const highlightPoint = points[highlightIndex];
  const avgSpeed = points.reduce((sum, p) => sum + p.speed, 0) / points.length;

  const scheduleHideOverlay = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowOverlay(false);
      setSelectedIndex(null);
    }, 2500);
  };

  const handleInteraction = (x: number) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    const clamped = Math.min(Math.max(x, plotLeft), plotRight);
    let nearest = 0;
    let nearestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < points.length; i += 1) {
      const dx = Math.abs(toX(points[i].t) - clamped);
      if (dx < nearestDist) {
        nearestDist = dx;
        nearest = i;
      }
    }
    setSelectedIndex(nearest);
    setShowOverlay(true);
  };

  const onLayout = (event: LayoutChangeEvent) => {
    setChartWidth(Math.max(320, event.nativeEvent.layout.width));
  };

  // Y-axis tick values
  const yTicks = [minSpeed, (minSpeed + maxSpeed) / 2, maxSpeed];
  // Grid line x positions (start, mid, end)
  const xGridTs = [0, maxT / 2, maxT];

  // Peak and valley pixel coords
  const maxPt = { x: toX(points[maxIndex].t), y: toY(points[maxIndex].speed) };
  const minPt = { x: toX(points[minIndex].t), y: toY(points[minIndex].speed) };

  // Clamp peak/valley labels within plot
  const highLabelX = Math.min(maxPt.x + 7, plotRight - 30);
  const highLabelY = Math.max(plotTop + 9, maxPt.y - 6);
  const lowLabelX = Math.min(minPt.x + 7, plotRight - 30);
  const lowLabelY = Math.min(plotBottom - 4, minPt.y + 13);

  // Time row below chart: always 3 items; mid uses opacity so height never changes
  const endLabel = maxT < 500 ? "<1s" : formatTimelineMs(maxT);
  const midLabel = formatTimelineMs(maxT / 2);
  const midSameAsEdge = midLabel === "0s" || midLabel === endLabel;
  const midLabelOpacity = showOverlay && !midSameAsEdge ? 1 : 0;

  // Y-axis label background (matches surface so labels are readable over grid lines)
  const yLabelBg = scheme === "dark" ? "#1E293B" : "#FFFFFF";

  // Floating tooltip inside SVG — single string to avoid SVG whitespace-collapse bug
  const cx = toX(highlightPoint.t);
  const cy = toY(highlightPoint.speed);
  const tipTime = formatTimelineMs(highlightPoint.t);
  const tipSpeed = `${highlightPoint.speed.toFixed(1)} ${unitLabel}`;
  const tipText = tipTime + " · " + tipSpeed;
  const TIP_W = Math.max(64, tipText.length * 5.0 + 14);
  const TIP_H = 18;
  let tipX = cx - TIP_W / 2;
  tipX = Math.max(plotLeft + 2, Math.min(tipX, plotRight - TIP_W - 2));
  let tipY = cy - TIP_H - 10;
  if (tipY < plotTop + 2) tipY = cy + 14;
  // Pill background: matches surface, semi-transparent so chart shows through
  const tipBg =
    scheme === "dark" ? "rgba(30,41,59,0.82)" : "rgba(255,255,255,0.88)";

  return (
    <YStack
      borderRadius="$4"
      padding="$4"
      backgroundColor={c.surface}
      marginBottom="$4"
    >
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$2"
      >
        <SizableText size="$4" fontWeight="700" color={c.textPrimary}>
          Speed Timeline
        </SizableText>
        <SizableText size="$2" color={c.textSecondary}>
          {unitLabel}
        </SizableText>
      </XStack>

      {/* Chart — tap or drag to reveal overlay; tooltip is drawn inside the SVG */}
      <View
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) =>
          handleInteraction(event.nativeEvent.locationX)
        }
        onResponderMove={(event) =>
          handleInteraction(event.nativeEvent.locationX)
        }
        onResponderRelease={scheduleHideOverlay}
        onResponderTerminate={scheduleHideOverlay}
      >
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          {/* ── Axis borders ──────────────────────────────────── */}
          <Line
            x1={plotLeft}
            y1={plotBottom}
            x2={plotRight}
            y2={plotBottom}
            stroke={c.border}
            strokeWidth="1"
          />
          <Line
            x1={plotLeft}
            y1={plotTop}
            x2={plotLeft}
            y2={plotBottom}
            stroke={c.border}
            strokeWidth="1"
          />

          {/* ── Overlay: horizontal grid lines + Y labels (inside chart, left edge) ── */}
          {showOverlay &&
            yTicks.map((speed) => {
              const y = toY(speed);
              const label = speed.toFixed(1);
              const bgW = label.length * 5.2 + 8;
              return (
                <React.Fragment key={`y-${speed}`}>
                  <Line
                    x1={plotLeft}
                    y1={y}
                    x2={plotRight}
                    y2={y}
                    stroke={c.border}
                    strokeWidth="1"
                    strokeDasharray="3 4"
                    opacity={0.7}
                  />
                  {/* Background pill so label is readable over the trend line */}
                  <Rect
                    x={plotLeft + 2}
                    y={y - 7}
                    width={bgW}
                    height={14}
                    rx={3}
                    fill={yLabelBg}
                    opacity={0.88}
                  />
                  <SvgText
                    x={plotLeft + 5}
                    y={y + 4}
                    textAnchor="start"
                    fontSize="9"
                    fill={c.textSecondary}
                  >
                    {label}
                  </SvgText>
                </React.Fragment>
              );
            })}

          {/* ── Overlay: vertical grid lines only (X labels live in XStack below) ── */}
          {showOverlay &&
            xGridTs.map((t) => (
              <Line
                key={`x-${t}`}
                x1={toX(t)}
                y1={plotTop}
                x2={toX(t)}
                y2={plotBottom}
                stroke={c.border}
                strokeWidth="1"
                strokeDasharray="3 4"
                opacity={0.6}
              />
            ))}

          {/* ── Speed trend line ──────────────────────────────── */}
          <Path d={linePath} stroke={c.primary} strokeWidth="2.5" fill="none" />

          {/* ── Overlay: cursor + peak/valley markers ─────────── */}
          {showOverlay && (
            <>
              {/* Vertical cursor line */}
              <Line
                x1={toX(highlightPoint.t)}
                y1={plotTop}
                x2={toX(highlightPoint.t)}
                y2={plotBottom}
                stroke={c.primary}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Cursor dot (filled ring) */}
              <Circle
                cx={toX(highlightPoint.t)}
                cy={toY(highlightPoint.speed)}
                r={5}
                fill={c.primary}
              />
              <Circle
                cx={toX(highlightPoint.t)}
                cy={toY(highlightPoint.speed)}
                r={2.5}
                fill="white"
              />

              {/* Peak marker (primary green) */}
              <Circle cx={maxPt.x} cy={maxPt.y} r={4} fill={c.primary} />
              <SvgText
                x={highLabelX}
                y={highLabelY}
                fontSize="9"
                fill={c.primary}
              >
                ↑{points[maxIndex].speed.toFixed(1)}
              </SvgText>

              {/* Valley marker (amber) — only if different from peak */}
              {minIndex !== maxIndex && (
                <>
                  <Circle cx={minPt.x} cy={minPt.y} r={4} fill={c.warning} />
                  <SvgText
                    x={lowLabelX}
                    y={lowLabelY}
                    fontSize="9"
                    fill={c.warning}
                  >
                    ↓{points[minIndex].speed.toFixed(1)}
                  </SvgText>
                </>
              )}

              {/* Floating tooltip — frosted pill, single string avoids whitespace collapse */}
              <Rect
                x={tipX}
                y={tipY}
                width={TIP_W}
                height={TIP_H}
                rx={4}
                fill={tipBg}
                stroke={c.primary}
                strokeWidth="1"
              />
              <SvgText
                x={tipX + TIP_W / 2}
                y={tipY + 12}
                textAnchor="middle"
                fontSize="9"
                fill={c.primary}
              >
                {tipText}
              </SvgText>
            </>
          )}
        </Svg>
      </View>

      {/* Time row — always rendered (3 items, mid uses opacity) so height never shifts */}
      <XStack justifyContent="space-between" marginTop="$1">
        <SizableText size="$2" color={c.textSecondary}>
          0s
        </SizableText>
        <SizableText
          size="$2"
          color={c.textSecondary}
          opacity={midLabelOpacity}
        >
          {midLabel}
        </SizableText>
        <SizableText size="$2" color={c.textSecondary}>
          {endLabel}
        </SizableText>
      </XStack>

      {/* Always-visible summary stats */}
      <XStack justifyContent="space-between" marginTop="$2">
        <SizableText size="$2" color={c.textSecondary}>
          Avg {avgSpeed.toFixed(1)} {unitLabel}
        </SizableText>
        <SizableText size="$2" color={c.textSecondary}>
          Max {maxSpeed.toFixed(1)} {unitLabel}
        </SizableText>
      </XStack>
    </YStack>
  );
}
