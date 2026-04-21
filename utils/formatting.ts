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
  unit: "metric" | "imperial" = "metric"
): string {
  if (unit === "imperial") {
    const miles = meters / 1609.344;
    return `${miles.toFixed(2)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Format pace in seconds per km to min:sec/km or min:sec/mi string.
 */
export function formatPace(
  secondsPerKm: number,
  unit: "metric" | "imperial" = "metric"
): string {
  let pace = secondsPerKm;
  if (unit === "imperial") {
    pace = secondsPerKm * 1.60934;
  }
  const mins = Math.floor(pace / 60);
  const secs = Math.floor(pace % 60);
  const suffix = unit === "imperial" ? "/mi" : "/km";
  return `${mins}:${secs.toString().padStart(2, "0")}${suffix}`;
}
