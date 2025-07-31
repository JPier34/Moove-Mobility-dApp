import { useState, useEffect, useCallback } from "react";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";
import { EUROPEAN_CITIES } from "@/config/cities";

interface LocationState {
  currentCity: any | null;
  isLoading: boolean;
  error: string | null;
  canRent: boolean;
  nearbyVehicles: any[];
  location: { lat: number; lng: number } | null; // This is coordinates
  showLocationModal: boolean;
  locationMethod: "gps" | "manual" | "none";
}

// Extended interface with functions
interface ExtendedLocationState extends LocationState {
  coordinates: { lat: number; lng: number } | null; // Alias for location
  refreshLocation: () => Promise<void>;
  setTestLocation: (
    cityId: "rome" | "milan" | "paris" | "berlin" | "madrid"
  ) => Promise<void>;
  clearLocation: () => void;
}

export function useLocationAndCity(): ExtendedLocationState {
  const [locationState, setLocationState] = useState<LocationState>({
    currentCity: null,
    isLoading: true,
    error: null,
    canRent: false,
    nearbyVehicles: [],
    location: null,
    showLocationModal: false,
    locationMethod: "none",
  });

  const geoSystem = new VehicleGeolocationSystem();

  const refreshLocation = useCallback(async (): Promise<void> => {
    setLocationState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      showLocationModal: false,
    }));

    try {
      const locationStateResult = await geoSystem.getCurrentLocationState();

      // Get fresh coordinates for location field
      let coordinates: { lat: number; lng: number } | null = null;
      try {
        const freshLocation = await geoSystem.getCurrentLocation();
        coordinates = freshLocation;
      } catch (coordError) {
        // If coordinates fail, try to use city coordinates as fallback
        if (locationStateResult.currentCity?.coordinates) {
          coordinates = locationStateResult.currentCity.coordinates;
        }
      }

      // Determine location method based on the result
      let locationMethod: "gps" | "manual" | "none" = "none";
      if (locationStateResult.method === "gps") {
        locationMethod = locationStateResult.error ? "manual" : "gps"; // Manual if fallback was used
      } else if (locationStateResult.method === "manual") {
        locationMethod = "manual";
      }

      setLocationState((prev) => ({
        ...prev,
        currentCity: locationStateResult.currentCity,
        isLoading: false,
        error: locationStateResult.error,
        canRent: locationStateResult.canRent,
        location: coordinates,
        locationMethod: locationMethod,
        showLocationModal: false,
      }));

      // Development fallback
      if (
        process.env.NODE_ENV === "development" &&
        !locationStateResult.canRent &&
        locationStateResult.error
      ) {
        console.log(
          "🏗️ Development mode: Auto-setting Rome as test location..."
        );

        try {
          const testState = await geoSystem.setTestLocation("rome");
          setLocationState((prev) => ({
            ...prev,
            currentCity: testState.currentCity,
            isLoading: false,
            error: `Dev mode: Using ${testState.currentCity?.name}. Original error: ${locationStateResult.error}`,
            canRent: testState.canRent,
            locationMethod: "manual",
            showLocationModal: false,
          }));
        } catch (testError) {
          console.error("Test location failed:", testError);
        }
      }
    } catch (error: any) {
      setLocationState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Location access failed",
        canRent: false,
        showLocationModal: true, // Show modal on error
        locationMethod: "none",
      }));
    }
  }, []);

  const setTestLocation = useCallback(
    async (
      cityId: "rome" | "milan" | "paris" | "berlin" | "madrid"
    ): Promise<void> => {
      setLocationState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const testState = await geoSystem.setTestLocation(cityId);

        // Get city coordinates
        const cityCoordinates = testState.currentCity?.coordinates || null;

        setLocationState((prev) => ({
          ...prev,
          currentCity: testState.currentCity,
          isLoading: false,
          error: null,
          canRent: testState.canRent,
          location: cityCoordinates,
          locationMethod: "manual",
          showLocationModal: false,
        }));

        console.log(`🧪 Test location set: ${cityId}`);
      } catch (error: any) {
        setLocationState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
          locationMethod: "none",
        }));
      }
    },
    []
  );

  const clearLocation = useCallback((): void => {
    geoSystem.clearLocationCache();
    setLocationState({
      currentCity: null,
      isLoading: false,
      error: null,
      canRent: false,
      nearbyVehicles: [],
      location: null,
      showLocationModal: false,
      locationMethod: "none",
    });
    console.log("🗑️ Location cleared");
  }, []);

  // Initialize on mount
  useEffect(() => {
    let mounted = true;

    const initialize = async (): Promise<void> => {
      if (!mounted) return;
      await refreshLocation();
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [refreshLocation]);

  // Return extended state with both location and coordinates (same value)
  return {
    ...locationState,
    coordinates: locationState.location, // Alias for compatibility
    refreshLocation,
    setTestLocation,
    clearLocation,
  };
}
