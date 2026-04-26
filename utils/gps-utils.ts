/**
 * GPS utility functions for Phase 2 enhancements:
 * - Douglas-Peucker path simplification
 * - Vincenty formula for precise distance calculation
 */

/**
 * Phase 2.1: Douglas-Peucker algorithm to simplify polyline.
 * Reduces points while preserving the overall shape of the path.
 * Removes redundant points that lie close to the line segment.
 *
 * @param points GPS points to simplify
 * @param epsilon Distance threshold in degrees (~0.0001 = ~10m at equator)
 * @returns Simplified array of points
 */
export function douglasPeucker(
  points: { latitude: number; longitude: number }[],
  epsilon: number = 0.0001,
): { latitude: number; longitude: number }[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;

  // Find point with maximum distance from line connecting start and end
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1],
    );
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    // Recursively simplify both segments
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    // Remove duplicate point at junction
    return [...left.slice(0, -1), ...right];
  }

  // If max distance is below threshold, just keep start and end
  return [points[0], points[points.length - 1]];
}

/**
 * Calculate perpendicular distance from a point to a line.
 * Used by Douglas-Peucker algorithm.
 *
 * @param point The point to measure from
 * @param lineStart Start of line segment
 * @param lineEnd End of line segment
 * @returns Distance in degrees
 */
function perpendicularDistance(
  point: { latitude: number; longitude: number },
  lineStart: { latitude: number; longitude: number },
  lineEnd: { latitude: number; longitude: number },
): number {
  const x = point.latitude;
  const y = point.longitude;
  const x1 = lineStart.latitude;
  const y1 = lineStart.longitude;
  const x2 = lineEnd.latitude;
  const y2 = lineEnd.longitude;

  const num = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
  const den = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
  return den === 0 ? 0 : num / den;
}

/**
 * Phase 2.3: Vincenty's formula for high-precision distance calculation.
 * Accounts for Earth's oblate spheroid shape, reducing error to 0.5mm over long distances.
 * Use for distances > 5km to improve accuracy over Haversine.
 *
 * @param a Start point (latitude, longitude)
 * @param b End point (latitude, longitude)
 * @returns Distance in kilometers
 */
export function vincenty(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const EQUATORIAL_RADIUS = 6378137; // meters
  const POLAR_RADIUS = 6356752.314245; // meters
  const FLATTENING = 1 / 298.257223563;

  const L = ((b.longitude - a.longitude) * Math.PI) / 180;
  const U1 = Math.atan(
    (1 - FLATTENING) * Math.tan((a.latitude * Math.PI) / 180),
  );
  const U2 = Math.atan(
    (1 - FLATTENING) * Math.tan((b.latitude * Math.PI) / 180),
  );
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);

  let lambda = L;
  let lambdaP = 0;
  let iterLimit = 100;
  let cosSqAlpha = 0;
  let sinSigma = 0;
  let cos2SigmaM = 0;
  let cosSigma = 0;
  let sigma = 0;

  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt(
      (cosU2 * sinLambda) ** 2 +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2,
    );

    if (sinSigma === 0) return 0; // Co-incident points

    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha ** 2;
    cos2SigmaM = cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha;

    // Handle edge case (equatorial line)
    if (isNaN(cos2SigmaM)) cos2SigmaM = 0;

    const C = (FLATTENING / 16) * cosSqAlpha * (4 + FLATTENING * cosSqAlpha);
    lambdaP = lambda;
    lambda =
      L +
      (1 - C) *
        FLATTENING *
        sinAlpha *
        (sigma +
          C *
            sinSigma *
            (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

  if (iterLimit === 0) return 0; // Formula failed to converge

  const uSq =
    (cosSqAlpha * (EQUATORIAL_RADIUS ** 2 - POLAR_RADIUS ** 2)) /
    POLAR_RADIUS ** 2;
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma =
    B *
    sinSigma *
    (cos2SigmaM +
      (B / 4) *
        (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
          (B / 6) *
            cos2SigmaM *
            (-3 + 4 * sinSigma ** 2) *
            (-3 + 4 * cos2SigmaM ** 2)));

  const s = POLAR_RADIUS * A * (sigma - deltaSigma);
  return s / 1000; // Convert to kilometers
}

/**
 * Phase 2.4: Generate pace-based color gradient for polyline segments.
 * Maps speed data to color zones: Blue (slow) → Amber (moderate) → Red (fast).
 *
 * @param speedSeries Array of speed points with timestamps
 * @returns Array of hex color codes matching speed zones
 */
export function generatePaceGradient(
  speedSeries: { t: number; speedMps: number | null }[],
): string[] {
  const PACE_COLORS = {
    slow: "#3B82F6", // Blue (>7:00/km)
    moderate: "#FBBF24", // Amber (5:30-7:00)
    fast: "#EF4444", // Red (<5:30)
  };

  return speedSeries.map((point) => {
    if (point.speedMps == null || point.speedMps <= 0) {
      return PACE_COLORS.moderate; // Default to moderate
    }

    const speedKmh = point.speedMps * 3.6;
    const paceSecPerKm = speedKmh > 0 ? 3600 / speedKmh : 999;

    if (paceSecPerKm > 420) return PACE_COLORS.slow; // >7:00/km
    if (paceSecPerKm > 330) return PACE_COLORS.moderate; // 5:30-7:00/km
    return PACE_COLORS.fast; // <5:30/km
  });
}
