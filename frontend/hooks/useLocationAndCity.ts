import { useState, useEffect, useCallback } from "react";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";
import { EUROPEAN_CITIES } from "@/config/cities";

interface LocationState {
  currentCity: any | null; // This will be the "preferred city" (manually selected or detected)
  detectedCity: any | null; // This will be the "detected city" from GPS/IP
  isLoading: boolean;
  error: string | null;
  canRent: boolean;
  nearbyVehicles: any[];
  location: { lat: number; lng: number } | null; // This is coordinates
  showLocationModal: boolean;
  locationMethod: "gps" | "manual" | "none";
  preferredCityMethod: "manual" | "detected" | "none"; // Track how the preferred city was set
}

interface ExtendedLocationState extends LocationState {
  coordinates: { lat: number; lng: number } | null;
  refreshLocation: () => Promise<void>;
  setTestLocation: (
    cityId: "rome" | "milan" | "paris" | "berlin" | "madrid" | "sanbenedetto"
  ) => Promise<void>;
  clearLocation: () => void;
  setPreferredCity: (cityId: string) => Promise<void>; // New function to manually set preferred city
}

export function useLocationAndCity(): ExtendedLocationState {
  const [locationState, setLocationState] = useState<LocationState>({
    currentCity: null, // Preferred city
    detectedCity: null, // Detected city
    isLoading: true,
    error: null,
    canRent: false,
    nearbyVehicles: [],
    location: null,
    showLocationModal: false,
    locationMethod: "none",
    preferredCityMethod: "none",
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
      // Use smart location detection with suspicious coordinate detection
      console.log("🧠 Getting smart location detection...");
      const locationStateResult = await geoSystem.getUniversalLocation();

      // Get coordinates from the result
      let coordinates: { lat: number; lng: number } | null = null;
      if (locationStateResult.currentCity?.coordinates) {
        coordinates = locationStateResult.currentCity.coordinates;
      }

      // Determine location method based on the result
      let locationMethod: "gps" | "manual" | "none" = "none";
      if (locationStateResult.method === "gps") {
        locationMethod = "gps";
      } else if (locationStateResult.method === "ip") {
        locationMethod = "gps"; // Treat IP as GPS for UI purposes
      } else if (locationStateResult.method === "manual") {
        locationMethod = "manual";
      }

      // Update detected city
      const detectedCity = locationStateResult.currentCity;

      // Determine preferred city logic:
      // 1. If user has manually selected a city before, keep that as preferred
      // 2. If this is the first detection, use the detected city as preferred
      // 3. If user has no manual preference, use detected city as preferred
      let preferredCity = locationState.currentCity; // Keep existing preferred city
      let preferredCityMethod = locationState.preferredCityMethod;

      if (
        preferredCityMethod === "none" ||
        preferredCityMethod === "detected"
      ) {
        // First time or no manual selection, use detected city as preferred
        preferredCity = detectedCity;
        preferredCityMethod = "detected";
      }
      // If preferredCityMethod is "manual", keep the existing preferred city

      setLocationState((prev) => ({
        ...prev,
        currentCity: preferredCity, // Preferred city (manually selected or detected)
        detectedCity: detectedCity, // Always update detected city
        isLoading: false,
        error: locationStateResult.error,
        canRent: locationStateResult.canRent,
        location: coordinates,
        locationMethod: locationMethod,
        showLocationModal: false,
        preferredCityMethod: preferredCityMethod,
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
            detectedCity: testState.currentCity,
            isLoading: false,
            error: `Dev mode: Using ${testState.currentCity?.name}. Original error: ${locationStateResult.error}`,
            canRent: testState.canRent,
            locationMethod: "manual",
            preferredCityMethod: "manual",
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
      cityId: "rome" | "milan" | "paris" | "berlin" | "madrid" | "sanbenedetto"
    ): Promise<void> => {
      setLocationState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const testState = await geoSystem.setTestLocation(cityId);

        // Get city coordinates
        const cityCoordinates = testState.currentCity?.coordinates || null;

        setLocationState((prev) => ({
          ...prev,
          currentCity: testState.currentCity, // Set as preferred city
          detectedCity: testState.currentCity, // Also set as detected city for test
          isLoading: false,
          error: null,
          canRent: testState.canRent,
          location: cityCoordinates,
          locationMethod: "manual",
          preferredCityMethod: "manual", // Mark as manually selected
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

  // New function to manually set preferred city
  const setPreferredCity = useCallback(
    async (cityId: string): Promise<void> => {
      setLocationState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await geoSystem.setPreferredCity(cityId);

        setLocationState((prev) => ({
          ...prev,
          currentCity: result.currentCity, // Set as preferred city
          detectedCity: result.detectedCity, // Keep detected city separate
          canRent: result.canRent,
          location: result.currentCity?.coordinates || null,
          locationMethod:
            result.method === "ip" || result.method === "cached"
              ? "gps"
              : result.method, // Map "ip" and "cached" to "gps" for UI
          preferredCityMethod: result.preferredCityMethod, // Mark as manually selected
          error: result.error,
          isLoading: false,
        }));

        console.log(
          `🎯 Preferred city set to: ${result.currentCity?.name} (${cityId})`
        );
      } catch (error: any) {
        console.error("Failed to set preferred city:", error);
        setLocationState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Failed to set preferred city",
        }));
      }
    },
    []
  );

  const clearLocation = useCallback((): void => {
    geoSystem.clearLocationCache();
    setLocationState({
      currentCity: null,
      detectedCity: null,
      isLoading: false,
      error: null,
      canRent: false,
      nearbyVehicles: [],
      location: null,
      showLocationModal: false,
      locationMethod: "none",
      preferredCityMethod: "none",
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
    setPreferredCity, // New function
  };
}
