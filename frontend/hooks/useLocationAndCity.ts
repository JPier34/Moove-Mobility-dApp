import { useState, useEffect, useCallback } from "react";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";

interface LocationState {
  currentCity: any | null;
  detectedCity: any | null;
  isLoading: boolean;
  error: string | null;
  canRent: boolean;
  nearbyVehicles: any[];
  location: { lat: number; lng: number } | null;
  showLocationModal: boolean;
  locationMethod: "gps" | "none";
}

interface ExtendedLocationState extends LocationState {
  coordinates: { lat: number; lng: number } | null;
  refreshLocation: () => Promise<void>;
  clearLocation: () => void;
}

export function useLocationAndCity(): ExtendedLocationState {
  const [locationState, setLocationState] = useState<LocationState>({
    currentCity: null,
    detectedCity: null,
    isLoading: true, // Inizia con loading
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
      console.log("🧠 Getting GPS location...");
      const locationStateResult = await geoSystem.getUniversalLocation();

      let coordinates: { lat: number; lng: number } | null = null;
      if (locationStateResult.currentCity?.coordinates) {
        coordinates = locationStateResult.currentCity.coordinates;
      }

      const detectedCity = locationStateResult.currentCity;

      setLocationState((prev) => ({
        ...prev,
        currentCity: detectedCity,
        detectedCity: detectedCity,
        isLoading: false,
        error: locationStateResult.error,
        canRent: locationStateResult.canRent,
        location: coordinates,
        locationMethod: "gps",
        showLocationModal: false,
      }));
    } catch (error: any) {
      console.log("❌ Location failed, showing modal");
      setLocationState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Location access failed",
        canRent: false,
        showLocationModal: true, // Mostra il modal se fallisce
        locationMethod: "none",
      }));
    }
  }, []);

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
    });
    console.log("🗑️ Location cleared");
  }, []);

  // Initialize on mount - SEMPLICE: prova a ottenere la posizione
  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return {
    ...locationState,
    coordinates: locationState.location,
    refreshLocation,
    clearLocation,
  };
}
