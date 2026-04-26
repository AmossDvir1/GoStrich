import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export type LocationPermissionStatus = "undetermined" | "granted" | "denied";

export interface UseLocationResult {
  permissionStatus: LocationPermissionStatus;
  requestPermission: () => Promise<boolean>;
  currentLocation: Location.LocationObject | null;
  locationName: string | null;
  isLoadingLocation: boolean;
  locationError: string | null;
}

interface UseLocationOptions {
  fetchLocationOnGranted?: boolean;
  resolveAddress?: boolean;
}

export function useLocation(options?: UseLocationOptions): UseLocationResult {
  const fetchLocationOnGranted = options?.fetchLocationOnGranted ?? true;
  const resolveAddress = options?.resolveAddress ?? true;

  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>("undetermined");
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const refreshPermissionStatus = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const mapped = mapStatus(status);
      setPermissionStatus(mapped);

      if (mapped === "granted" && fetchLocationOnGranted) {
        await fetchCurrentLocation(resolveAddress);
      } else {
        setCurrentLocation(null);
        setLocationName(null);
      }
    } catch {
      // Keep existing state if permission lookup fails.
    }
  }, [fetchLocationOnGranted, resolveAddress]);

  // Check existing permission on mount
  useEffect(() => {
    void refreshPermissionStatus();

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          void refreshPermissionStatus();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [refreshPermissionStatus]);

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const mapped = mapStatus(status);
    setPermissionStatus(mapped);
    if (mapped === "granted" && fetchLocationOnGranted) {
      await fetchCurrentLocation(resolveAddress);
      return true;
    }
    return mapped === "granted";
  };

  const fetchCurrentLocation = async (shouldResolveAddress: boolean) => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCurrentLocation(loc);
      if (shouldResolveAddress) {
        void reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      }
    } catch {
      setLocationError("Unable to get your location. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      if (results.length > 0) {
        const r = results[0];
        // Build a readable name: neighbourhood/district + city, or just city
        const parts = [r.district ?? r.subregion, r.city ?? r.region].filter(
          Boolean,
        );
        setLocationName(parts.length > 0 ? parts.join(", ") : null);
      }
    } catch {
      // Silently ignore - location name is optional.
    }
  };

  return {
    permissionStatus,
    requestPermission,
    currentLocation,
    locationName,
    isLoadingLocation,
    locationError,
  };
}

function mapStatus(
  status: Location.PermissionStatus,
): LocationPermissionStatus {
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  if (status === Location.PermissionStatus.DENIED) return "denied";
  return "undetermined";
}
