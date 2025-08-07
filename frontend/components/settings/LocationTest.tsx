"use client";

import React, { useState, useEffect } from "react";
import { useLocationAndCity } from "@/hooks/useLocationAndCity";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";
import { EUROPEAN_CITIES } from "@/config/cities";

export default function LocationTest() {
  const [testCoordinates, setTestCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const locationHook = useLocationAndCity();

  const testLocationLogic = async (lat: number, lng: number) => {
    setIsTesting(true);
    const geoSystem = new VehicleGeolocationSystem();

    try {
      // Test the findNearestSupportedCity method directly
      const coordinates = { lat, lng };
      const nearestCity = geoSystem.findNearestSupportedCity(coordinates);

      // Test the fallback method
      const fallbackCity = geoSystem.getIntelligentFallbackCity(coordinates);

      // Calculate distances to all cities
      const distances = EUROPEAN_CITIES.map((city) => ({
        city: city.name,
        id: city.id,
        distance: geoSystem.calculateDistance(
          lat,
          lng,
          city.coordinates.lat,
          city.coordinates.lng
        ),
        coordinates: city.coordinates,
        bounds: city.bounds,
      })).sort((a, b) => a.distance - b.distance);

      setTestResults({
        inputCoordinates: { lat, lng },
        nearestCity,
        fallbackCity,
        distances: distances.slice(0, 5), // Top 5 closest
        allDistances: distances,
      });
    } catch (error) {
      console.error("Test error:", error);
      setTestResults({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const testRomeLocation = () => {
    // Roma coordinates
    testLocationLogic(41.9028, 12.4964);
  };

  const testMilanLocation = () => {
    // Milano coordinates
    testLocationLogic(45.4642, 9.19);
  };

  const testSanBenedettoLocation = () => {
    // San Benedetto del Tronto coordinates
    testLocationLogic(42.9448, 13.8833);
  };

  const testCustomLocation = () => {
    if (testCoordinates) {
      testLocationLogic(testCoordinates.lat, testCoordinates.lng);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🧪 Location Test Tool
      </h3>

      {/* Current Hook State */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Current Hook State:
        </h4>
        <div className="text-sm space-y-1">
          <div>
            City:{" "}
            <span className="font-mono">
              {locationHook.currentCity?.name || "None"}
            </span>
          </div>
          <div>
            Coordinates:{" "}
            <span className="font-mono">
              {locationHook.location
                ? `${locationHook.location.lat}, ${locationHook.location.lng}`
                : "None"}
            </span>
          </div>
          <div>
            Can Rent:{" "}
            <span
              className={
                locationHook.canRent ? "text-green-600" : "text-red-600"
              }
            >
              {locationHook.canRent ? "Yes" : "No"}
            </span>
          </div>
          <div>
            Method:{" "}
            <span className="font-mono">{locationHook.locationMethod}</span>
          </div>
          <div>
            Error:{" "}
            <span className="text-red-600">{locationHook.error || "None"}</span>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={testRomeLocation}
            disabled={isTesting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            🏛️ Test Rome (41.9028, 12.4964)
          </button>
          <button
            onClick={testMilanLocation}
            disabled={isTesting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            🏔️ Test Milan (45.4642, 9.19)
          </button>
          <button
            onClick={testSanBenedettoLocation}
            disabled={isTesting}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            🏖️ Test San Benedetto (42.9448, 13.8833)
          </button>
        </div>

        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Coordinates:
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32"
                onChange={(e) =>
                  setTestCoordinates((prev) => ({
                    ...prev,
                    lat: parseFloat(e.target.value),
                  }))
                }
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32"
                onChange={(e) =>
                  setTestCoordinates((prev) => ({
                    ...prev,
                    lng: parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <button
            onClick={testCustomLocation}
            disabled={isTesting || !testCoordinates}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            🎯 Test Custom
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Test Results:
          </h4>

          {testResults.error ? (
            <div className="text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
              Error: {testResults.error}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Input Coordinates */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Input Coordinates:
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {testResults.inputCoordinates.lat},{" "}
                  {testResults.inputCoordinates.lng}
                </div>
              </div>

              {/* Nearest City */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="font-medium text-green-900 dark:text-green-100 mb-1">
                  Nearest City (within 200km):
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {testResults.nearestCity ? (
                    <span>
                      ✅ {testResults.nearestCity.name} (
                      {testResults.nearestCity.id})
                    </span>
                  ) : (
                    <span>❌ None found within 200km</span>
                  )}
                </div>
              </div>

              {/* Fallback City */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <div className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Fallback City:
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  {testResults.fallbackCity ? (
                    <span>
                      🔄 {testResults.fallbackCity.name} (
                      {testResults.fallbackCity.id})
                    </span>
                  ) : (
                    <span>❌ No fallback</span>
                  )}
                </div>
              </div>

              {/* Top 5 Closest Cities */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Top 5 Closest Cities:
                </div>
                <div className="space-y-1">
                  {testResults.distances.map((city: any, index: number) => (
                    <div key={city.id} className="text-sm flex justify-between">
                      <span className={index === 0 ? "font-medium" : ""}>
                        {index + 1}. {city.city}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {city.distance.toFixed(2)}km
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bounds Check */}
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                <div className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Bounds Check (Top 3):
                </div>
                <div className="space-y-1">
                  {testResults.distances.slice(0, 3).map((city: any) => {
                    const inBounds =
                      testResults.inputCoordinates.lat >= city.bounds.south &&
                      testResults.inputCoordinates.lat <= city.bounds.north &&
                      testResults.inputCoordinates.lng >= city.bounds.west &&
                      testResults.inputCoordinates.lng <= city.bounds.east;

                    return (
                      <div key={city.id} className="text-sm">
                        <span
                          className={
                            inBounds ? "text-green-600" : "text-gray-600"
                          }
                        >
                          {inBounds ? "✅" : "❌"} {city.city}:
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          lat: {city.bounds.south.toFixed(2)}-
                          {city.bounds.north.toFixed(2)}, lng:{" "}
                          {city.bounds.west.toFixed(2)}-
                          {city.bounds.east.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hook Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Hook Actions:
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => locationHook.refreshLocation()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
          >
            🔄 Refresh Location
          </button>
          <button
            onClick={() => locationHook.setTestLocation("rome")}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm"
          >
            🏛️ Set Rome
          </button>
          <button
            onClick={() => locationHook.setTestLocation("milan")}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm"
          >
            🏔️ Set Milan
          </button>
          <button
            onClick={() => locationHook.setTestLocation("sanbenedetto")}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm"
          >
            🏖️ Set San Benedetto
          </button>
          <button
            onClick={() => locationHook.clearLocation()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
    </div>
  );
}
