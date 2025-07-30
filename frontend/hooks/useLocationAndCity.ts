import { useState, useEffect } from "react";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";
import { EUROPEAN_CITIES } from "@/config/cities";

// Keep your existing interface
interface LocationState {
  currentCity: any | null;
  isLoading: boolean;
  error: string | null;
  canRent: boolean;
}

// ============= YOUR EXISTING HOOK WITH PERSISTENCE =============
function useLocationAndCity(): LocationState {
  const [locationState, setLocationState] = useState<LocationState>({
    currentCity: null,
    isLoading: true,
    error: null,
    canRent: false,
  });

  useEffect(() => {
    let mounted = true;
    const geoSystem = new VehicleGeolocationSystem();

    const initializeLocation = async () => {
      try {
        setLocationState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Try to get location state (uses caching internally)
        const locationStateResult = await geoSystem.getCurrentLocationState();

        if (!mounted) return;

        // Update state based on result
        setLocationState({
          currentCity: locationStateResult.currentCity,
          isLoading: false,
          error: locationStateResult.error,
          canRent: locationStateResult.canRent,
        });

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
            if (!mounted) return;

            setLocationState({
              currentCity: testState.currentCity,
              isLoading: false,
              error: `Dev mode: Using ${testState.currentCity?.name}. Original error: ${locationStateResult.error}`,
              canRent: testState.canRent,
            });
          } catch (testError) {
            console.error("Test location failed:", testError);
          }
        }
      } catch (error: any) {
        if (!mounted) return;

        setLocationState({
          currentCity: null,
          isLoading: false,
          error: error.message || "Location access failed",
          canRent: false,
        });
      }
    };

    initializeLocation();

    return () => {
      mounted = false;
    };
  }, []);

  return locationState;
}

export { useLocationAndCity };
