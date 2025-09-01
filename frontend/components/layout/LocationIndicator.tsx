"use client";

import React from "react";
import { useLocationAndCity } from "@/hooks/useLocationAndCity";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";

export default function LocationIndicator() {
  const {
    currentCity,
    detectedCity,
    isLoading,
    error,
    canRent,
    locationMethod,
    refreshLocation,
  } = useLocationAndCity();

  const handleEnhancedGPS = async () => {
    const geoSystem = new VehicleGeolocationSystem();
    try {
      await geoSystem.getEnhancedGPSLocation();
      refreshLocation();
    } catch (error) {
      console.error("Enhanced GPS failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span>Detecting location...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
        <span>⚠️ Location error</span>
        <button
          onClick={refreshLocation}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  if (!canRent || !currentCity) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <span>📍 Location not available</span>
        <button
          onClick={refreshLocation}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          🔄 Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 text-sm">
      {/* Preferred City Display */}
      <div className="flex items-center space-x-2">
        <span className="text-gray-600 dark:text-gray-400">📍</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {currentCity.name}
        </span>
        {
          // maybe adding it later
          <span className="text-xs hidden bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
            Auto
          </span>
        }
      </div>

      {/* Detected City (if different from preferred) */}
      {detectedCity && detectedCity.id !== currentCity.id && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Detected: {detectedCity.name}</span>
        </div>
      )}
    </div>
  );
}
