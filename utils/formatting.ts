export type UnitSystem = "metric" | "imperial";

interface UnitFormatOptions {
  includeUnit?: boolean;
  digits?: number;
}

const METERS_PER_MILE = 1609.344;
const KM_PER_MILE = 1.609344;
const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

function formatUnitValue(value: number, digits: number): string {
  const rounded = Number(value.toFixed(digits));
  return String(rounded);
}

/**
 * Format duration in seconds to mm:ss or hh:mm:ss string.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Format distance in meters to km or mi string based on unit system.
 */
export function formatDistance(
  meters: number,
  unit: UnitSystem = "metric",
): string {
  if (unit === "imperial") {
    const miles = meters / METERS_PER_MILE;
    return `${miles.toFixed(2)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Format pace in seconds per km to min:sec/km or min:sec/mi string.
 * @param secondsPerKm Pace in seconds per kilometer
 * @param unit Unit system (metric or imperial)
 * @param roundTo Optional: round to nearest N seconds (e.g., 30 = "5:30/km", "6:00/km")
 */
export function formatPace(
  secondsPerKm: number,
  unit: UnitSystem = "metric",
  roundTo: number = 0,
): string {
  // Phase 1: Pace display rounding (P1.3) — round to nearest 30s for cognitive ease
  let pace = secondsPerKm;
  if (roundTo > 0) {
    pace = Math.round(pace / roundTo) * roundTo;
  }
  if (unit === "imperial") {
    pace = pace * KM_PER_MILE;
  }
  const mins = Math.floor(pace / 60);
  const secs = Math.round(pace % 60);
  const suffix = unit === "imperial" ? "/mi" : "/km";
  return `${mins}:${secs.toString().padStart(2, "0")}${suffix}`;
}

/**
 * Format speed in km/h or mph based on unit system.
 */
export function formatSpeed(
  speedKmh: number,
  unit: UnitSystem = "metric",
  options: UnitFormatOptions = {},
): string {
  const { includeUnit = true, digits = 1 } = options;
  const value = unit === "imperial" ? speedKmh / KM_PER_MILE : speedKmh;
  const formatted = formatUnitValue(value, digits);
  if (!includeUnit) return formatted;
  return `${formatted} ${unit === "imperial" ? "mph" : "km/h"}`;
}

/**
 * Convert a user-entered weight to canonical kilograms.
 */
export function toMetricWeight(
  value: number,
  unit: UnitSystem = "metric",
): number {
  return unit === "imperial" ? value * KG_PER_LB : value;
}

/**
 * Format stored kilograms as kg or lb based on unit system.
 */
export function formatWeight(
  weightKg: number | null,
  unit: UnitSystem = "metric",
  options: UnitFormatOptions = {},
): string {
  if (weightKg === null) return "";
  const { includeUnit = true, digits = 1 } = options;
  const value = unit === "imperial" ? weightKg / KG_PER_LB : weightKg;
  const formatted = formatUnitValue(value, digits);
  if (!includeUnit) return formatted;
  return `${formatted} ${unit === "imperial" ? "lb" : "kg"}`;
}

/**
 * Convert a user-entered height to canonical centimeters.
 */
export function toMetricHeight(
  value: number,
  unit: UnitSystem = "metric",
): number {
  return unit === "imperial" ? value * CM_PER_IN : value;
}

/**
 * Format stored centimeters as cm or inches based on unit system.
 */
export function formatHeight(
  heightCm: number | null,
  unit: UnitSystem = "metric",
  options: UnitFormatOptions = {},
): string {
  if (heightCm === null) return "";
  const { includeUnit = true, digits = 1 } = options;
  const value = unit === "imperial" ? heightCm / CM_PER_IN : heightCm;
  const formatted = formatUnitValue(value, digits);
  if (!includeUnit) return formatted;
  return `${formatted} ${unit === "imperial" ? "in" : "cm"}`;
}

export function getWeightLabel(unit: UnitSystem = "metric"): string {
  return unit === "imperial" ? "Weight (lb)" : "Weight (kg)";
}

export function getHeightLabel(unit: UnitSystem = "metric"): string {
  return unit === "imperial" ? "Height (in)" : "Height (cm)";
}

export function getUnitSystemDescription(unit: UnitSystem = "metric"): string {
  return unit === "imperial" ? "Imperial (mi, lb, in)" : "Metric (km, kg, cm)";
}
