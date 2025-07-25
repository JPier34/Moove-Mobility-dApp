"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { EUROPEAN_CITIES } from "@/config/cities";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";

export const useVehicleAccess = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vehicleSystem = VehicleGeolocationSystem.getInstance();

  const unlockVehicle = async (vehicleId: string, pricingTierId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get vehicle details
      const vehicle = vehicleSystem.getVehicle(vehicleId);
      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      if (!vehicle.isAvailable) {
        throw new Error("Vehicle is not available");
      }

      // Reserve the vehicle
      const reserved = vehicleSystem.reserveVehicle(vehicleId);
      if (!reserved) {
        throw new Error("Failed to reserve vehicle");
      }

      // Generate secure unlock code
      const unlockCode = await generateSecureUnlockCode(vehicleId);

      // Find city info
      const city = EUROPEAN_CITIES.find((c) => c.id === vehicle.cityId);

      return {
        success: true,
        unlockCode,
        vehicleId: vehicle.vehicleId,
        vehicleType: vehicle.vehicleType,
        location: vehicle.coordinates,
        locationName: city?.name || "Unknown City",
        batteryLevel: vehicle.batteryLevel,
        estimatedRange: vehicle.estimatedRange,
        unlockTime: new Date(),
        accessDuration: getAccessDuration(pricingTierId),
        expiresAt: new Date(
          Date.now() + getAccessDuration(pricingTierId) * 60 * 1000
        ),
      };
    } catch (err: any) {
      setError(err.message || "Unlock failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateSecureUnlockCode = async (
    vehicleId: string
  ): Promise<string> => {
    // Simulate blockchain-based secure code generation
    const timestamp = Math.floor(Date.now() / 1000);
    const randomSeed = Math.random().toString(36).substring(2, 15);

    // Create deterministic but secure code
    const codeData = `${vehicleId}-${address}-${timestamp}-${randomSeed}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(codeData);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex.slice(0, 8).toUpperCase(); // 8 character code
  };

  const getAccessDuration = (pricingTierId: string): number => {
    const durations: Record<string, number> = {
      hourly_bike: 60,
      hourly_scooter: 60,
      hourly_monopattino: 60,
      daily_all: 1440, // 24 hours
      monthly_basic: 60,
      monthly_unlimited: 120,
    };
    return durations[pricingTierId] || 60;
  };

  return {
    unlockVehicle,
    loading,
    error,
  };
};
