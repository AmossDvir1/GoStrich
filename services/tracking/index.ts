import type { PauseInterval, SpeedPoint } from "@/types/workout";

function inPausedInterval(
  pointMs: number,
  intervals: PauseInterval[],
): boolean {
  return intervals.some(
    (interval) => pointMs >= interval.startMs && pointMs <= interval.endMs,
  );
}

export function prepareSpeedSeries(
  series: SpeedPoint[] | undefined,
  pauseIntervals: PauseInterval[] | undefined,
): SpeedPoint[] {
  if (!series || series.length === 0) return [];

  const paused = pauseIntervals ?? [];
  const normalized = series
    .filter((point) => point.t >= 0)
    .filter((point) => !inPausedInterval(point.t, paused))
    .map((point) => ({
      t: point.t,
      speedMps:
        point.speedMps != null && point.speedMps >= 0 ? point.speedMps : 0,
    }))
    .sort((a, b) => a.t - b.t);

  return normalized;
}

export function downsampleSpeedSeries(
  series: SpeedPoint[],
  maxPoints: number,
): SpeedPoint[] {
  if (series.length <= maxPoints || maxPoints < 2) return series;

  const step = (series.length - 1) / (maxPoints - 1);
  const sampled: SpeedPoint[] = [];

  for (let i = 0; i < maxPoints; i += 1) {
    sampled.push(series[Math.round(i * step)]);
  }

  return sampled;
}

export function speedMpsToDisplay(
  speedMps: number,
  unitSystem: "metric" | "imperial",
): number {
  return unitSystem === "imperial" ? speedMps * 2.236936 : speedMps * 3.6;
}
