import * as Location from "expo-location";
import { useEffect, useState } from "react";

export type LocationPermissionStatus = "undetermined" | "granted" | "denied";

export interface UseLocationResult {
  permissionStatus: LocationPermissionStatus;
  requestPermission: () => Promise<boolean>;
  currentLocation: Location.LocationObject | null;
  locationName: string | null;
  isLoadingLocation: boolean;
  locationError: string | null;
}

export function useLocation(): UseLocationResult {
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>("undetermined");
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Check existing permission on mount
  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then(({ status }) => {
        const mapped = mapStatus(status);
        setPermissionStatus(mapped);
        if (mapped === "granted") {
          void fetchCurrentLocation();
        }
      })
      .catch(() => null);
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const mapped = mapStatus(status);
    setPermissionStatus(mapped);
    if (mapped === "granted") {
      await fetchCurrentLocation();
      return true;
    }
    return false;
  };

  const fetchCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCurrentLocation(loc);
      void reverseGeocode(loc.coords.latitude, loc.coords.longitude);
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
      // Silently ignore â€” location name is optional
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
