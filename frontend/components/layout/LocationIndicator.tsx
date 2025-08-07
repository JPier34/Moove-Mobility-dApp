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
    preferredCityMethod,
    refreshLocation,
    setTestLocation,
    setPreferredCity,
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

  const handleSetPreferredCity = (cityId: string) => {
    setPreferredCity(cityId);
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
        {preferredCityMethod === "manual" && (
          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
            Manual
          </span>
        )}
        {preferredCityMethod === "detected" && (
          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
            Auto
          </span>
        )}
      </div>

      {/* Detected City (if different from preferred) */}
      {detectedCity && detectedCity.id !== currentCity.id && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Detected: {detectedCity.name}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        <button
          onClick={refreshLocation}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Refresh location"
        >
          🔄
        </button>
        <button
          onClick={handleEnhancedGPS}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Enhanced GPS"
        >
          🌍
        </button>

        {/* Quick City Selection Dropdown */}
        <div className="relative group">
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Set preferred city"
          >
            🎯
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[120px]">
            <div className="py-1">
              <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                Set Preferred City
              </div>
              <button
                onClick={() => handleSetPreferredCity("rome")}
                className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                🏛️ Rome
              </button>
              <button
                onClick={() => handleSetPreferredCity("milan")}
                className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                🏢 Milan
              </button>
              <button
                onClick={() => handleSetPreferredCity("paris")}
                className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                🗼 Paris
              </button>
              <button
                onClick={() => handleSetPreferredCity("berlin")}
                className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                🏛️ Berlin
              </button>
              <button
                onClick={() => handleSetPreferredCity("madrid")}
                className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                🏟️ Madrid
              </button>
              <button
                onClick={() => handleSetPreferredCity("sanbenedetto")}
                className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                🏖️ San Benedetto
              </button>
            </div>
          </div>
        </div>

        {/* Special button for Milan detection */}
        {currentCity.name === "Milan" && (
          <button
            onClick={() => setTestLocation("sanbenedetto")}
            className="text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
            title="Force San Benedetto del Tronto"
          >
            🏖️
          </button>
        )}
      </div>

      {/* Location Method Indicator */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {locationMethod === "gps" && "📱 GPS"}
        {locationMethod === "manual" && "👆 Manual"}
        {locationMethod === "none" && "❌ None"}
      </div>
    </div>
  );
}
