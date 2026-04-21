import * as Location from "expo-location";

export type GpsPoint = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
};

/** Request foreground location permission. Returns true if granted. */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

/** Get the current one-shot position. Throws if permission is not granted. */
export async function getCurrentPosition(): Promise<GpsPoint> {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: location.coords.altitude,
    accuracy: location.coords.accuracy,
    timestamp: location.timestamp,
  };
}

/** Subscribe to position updates. Returns an unsubscribe function. */
export async function watchPosition(
  onUpdate: (point: GpsPoint) => void,
): Promise<() => void> {
  const subscriber = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 2,
    },
    (location) => {
      onUpdate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      });
    },
  );

  return () => subscriber.remove();
}
