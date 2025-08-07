"use client";

import React, { useState } from "react";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";
import { EUROPEAN_CITIES } from "@/config/cities";
import { useLocationAndCity } from "@/hooks/useLocationAndCity";

interface GpsResults {
  city?: string;
  method?: string;
  error?: string | null;
  canRent?: boolean;
  coordinates?: { lat: number; lng: number } | null;
  enhanced?: boolean;
  universal?: boolean;
  fresh?: boolean;
  ip?: boolean;
  forced?: boolean;
  environment?: boolean;
  smart?: boolean;
  detectedCity?: string;
  preferredCity?: string;
  preferredCityMethod?: string;
}

export default function LocationDebug() {
  const [isTesting, setIsTesting] = useState(false);
  const [gpsResults, setGpsResults] = useState<GpsResults>({});
  const locationHook = useLocationAndCity();

  const testLocation = async (lat: number, lng: number, name: string) => {
    setIsTesting(true);
    const geoSystem = new VehicleGeolocationSystem();

    try {
      const coordinates = { lat, lng };

      // Test nearest city
      const nearestCity = geoSystem.findNearestSupportedCity(coordinates);

      // Test fallback
      const fallbackCity = geoSystem.getIntelligentFallbackCity(coordinates);

      // Calculate all distances
      const distances = EUROPEAN_CITIES.map((city) => ({
        city: city.name,
        id: city.id,
        distance: geoSystem.calculateDistance(
          lat,
          lng,
          city.coordinates.lat,
          city.coordinates.lng
        ),
      })).sort((a, b) => a.distance - b.distance);

      setGpsResults({
        city: name,
        method: "manual",
        error: null,
        canRent: true,
        coordinates: coordinates,
        detectedCity: name,
        preferredCity: name,
        preferredCityMethod: "manual",
      });
    } catch (error: any) {
      console.error("Test error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
    } finally {
      setIsTesting(false);
    }
  };

  const testRealGPS = async () => {
    setIsTesting(true);
    const geoSystem = new VehicleGeolocationSystem();

    try {
      console.log("🧭 Testing real GPS location...");

      // Clear cache first
      geoSystem.clearLocationCache();

      // Get fresh location state
      const locationState = await geoSystem.getCurrentLocationState();

      setGpsResults({
        city: locationState.currentCity?.name || "None",
        method: locationState.method,
        error: locationState.error,
        canRent: locationState.canRent,
        coordinates: locationState.currentCity?.coordinates || null,
        detectedCity: locationState.currentCity?.name || "None",
        preferredCity: locationState.currentCity?.name || "None",
        preferredCityMethod: locationState.method || "none",
      });

      console.log("📍 Real GPS results:", locationState);
    } catch (error: any) {
      console.error("GPS test error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
    } finally {
      setIsTesting(false);
    }
  };

  const testFreshGPS = async () => {
    setIsTesting(true);
    const geoSystem = new VehicleGeolocationSystem();

    try {
      console.log("🔄 Testing completely fresh GPS location...");

      // Force fresh GPS location
      const locationState = await geoSystem.forceFreshGPSLocation();

      setGpsResults({
        city: locationState.currentCity?.name || "None",
        method: locationState.method,
        error: locationState.error,
        canRent: locationState.canRent,
        coordinates: locationState.currentCity?.coordinates || null,
        fresh: true,
        detectedCity: locationState.currentCity?.name || "None",
        preferredCity: locationState.currentCity?.name || "None",
        preferredCityMethod: locationState.method || "none",
      });

      console.log("📍 Fresh GPS results:", locationState);
    } catch (error: any) {
      console.error("Fresh GPS test error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
    } finally {
      setIsTesting(false);
    }
  };

  const testEnhancedGPS = async () => {
    setIsTesting(true);
    const geoSystem = new VehicleGeolocationSystem();

    try {
      console.log("🧭 Testing enhanced GPS with Google verification...");

      // Use enhanced GPS method
      const locationState = await geoSystem.getEnhancedGPSLocation();

      setGpsResults({
        city: locationState.currentCity?.name || "None",
        method: locationState.method,
        error: locationState.error,
        canRent: locationState.canRent,
        coordinates: locationState.currentCity?.coordinates || null,
        enhanced: true,
        detectedCity: locationState.currentCity?.name || "None",
        preferredCity: locationState.currentCity?.name || "None",
        preferredCityMethod: locationState.method || "none",
      });

      console.log("📍 Enhanced GPS results:", locationState);
    } catch (error: any) {
      console.error("Enhanced GPS test error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
    } finally {
      setIsTesting(false);
    }
  };

  const testUniversalLocation = async () => {
    setIsTesting(true);
    const geoSystem = new VehicleGeolocationSystem();

    try {
      console.log("🌍 Testing universal location detection...");

      // Use universal location method
      const locationState = await geoSystem.getUniversalLocation();

      setGpsResults({
        city: locationState.currentCity?.name || "None",
        method: locationState.method,
        error: locationState.error,
        canRent: locationState.canRent,
        coordinates: locationState.currentCity?.coordinates || null,
        universal: true,
        detectedCity: locationState.currentCity?.name || "None",
        preferredCity: locationState.currentCity?.name || "None",
        preferredCityMethod: locationState.method || "none",
      });

      console.log("📍 Universal location results:", locationState);
    } catch (error: any) {
      console.error("Universal location test error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
    } finally {
      setIsTesting(false);
    }
  };

  const testIPLocation = async () => {
    setIsTesting(true);
    const geoSystem = new VehicleGeolocationSystem();

    try {
      console.log("🌐 Testing IP geolocation...");

      // Test IP geolocation directly
      const coordinates = await geoSystem.getLocationFromIP();

      if (coordinates) {
        // Calculate distances to all supported cities
        const cityDistances = EUROPEAN_CITIES.map((city) => ({
          city,
          distance: geoSystem.calculateDistance(
            coordinates.lat,
            coordinates.lng,
            city.coordinates.lat,
            city.coordinates.lng
          ),
        })).sort((a, b) => a.distance - b.distance);

        const closestCity = cityDistances[0];

        setGpsResults({
          city: closestCity.city.name,
          method: "ip",
          error: null,
          canRent: true,
          coordinates: coordinates,
          ip: true,
          detectedCity: closestCity.city.name,
          preferredCity: closestCity.city.name,
          preferredCityMethod: "ip",
        });

        console.log("📍 IP location results:", {
          coordinates,
          closestCity: closestCity.city.name,
          distance: closestCity.distance.toFixed(2) + "km",
        });
      } else {
        setGpsResults({ error: "IP geolocation failed" });
      }
    } catch (error: any) {
      console.error("IP location test error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
    } finally {
      setIsTesting(false);
    }
  };

  const testSmartLocation = async () => {
    setIsTesting(true);
    const geoSystem = new VehicleGeolocationSystem();

    try {
      console.log("🧠 Testing smart location detection...");

      // Use universal location with suspicious coordinate detection
      const locationState = await geoSystem.getUniversalLocation();

      setGpsResults({
        city: locationState.currentCity?.name || "None",
        method: locationState.method,
        error: locationState.error,
        canRent: locationState.canRent,
        coordinates: locationState.currentCity?.coordinates || null,
        smart: true,
        detectedCity: locationState.currentCity?.name || "None",
        preferredCity: locationHook.currentCity?.name || "None",
        preferredCityMethod: locationHook.preferredCityMethod || "none",
      });

      console.log("📍 Smart location results:", locationState);
    } catch (error: any) {
      console.error("Smart location test error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
    } finally {
      setIsTesting(false);
    }
  };

  const testPreferredCityLogic = async () => {
    setIsTesting(true);
    try {
      console.log("🎯 Testing preferred city logic...");

      // First, get current state
      const currentState = {
        detectedCity: locationHook.detectedCity?.name || "None",
        preferredCity: locationHook.currentCity?.name || "None",
        preferredCityMethod: locationHook.preferredCityMethod || "none",
      };

      setGpsResults({
        city: currentState.preferredCity,
        method: "preferred",
        error: null,
        canRent: locationHook.canRent,
        coordinates: locationHook.currentCity?.coordinates || null,
        smart: true,
        detectedCity: currentState.detectedCity,
        preferredCity: currentState.preferredCity,
        preferredCityMethod: currentState.preferredCityMethod,
      });

      console.log("🎯 Preferred city logic results:", currentState);
    } catch (error: any) {
      console.error("Preferred city logic test error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
    } finally {
      setIsTesting(false);
    }
  };

  const testManualCitySelection = async (cityId: string) => {
    setIsTesting(true);
    try {
      console.log(`🎯 Testing manual city selection: ${cityId}`);

      // Use the new setPreferredCity function
      locationHook.setPreferredCity(cityId);

      // Wait a bit for state to update
      setTimeout(() => {
        const currentState = {
          detectedCity: locationHook.detectedCity?.name || "None",
          preferredCity: locationHook.currentCity?.name || "None",
          preferredCityMethod: locationHook.preferredCityMethod || "none",
        };

        setGpsResults({
          city: currentState.preferredCity,
          method: "manual",
          error: null,
          canRent: locationHook.canRent,
          coordinates: locationHook.currentCity?.coordinates || null,
          smart: true,
          detectedCity: currentState.detectedCity,
          preferredCity: currentState.preferredCity,
          preferredCityMethod: currentState.preferredCityMethod,
        });

        console.log("🎯 Manual city selection results:", currentState);
        setIsTesting(false);
      }, 100);
    } catch (error: any) {
      console.error("Manual city selection test error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
      setIsTesting(false);
    }
  };

  const forceSanBenedetto = async () => {
    setIsTesting(true);
    const geoSystem = new VehicleGeolocationSystem();

    try {
      console.log("🏖️ Forcing San Benedetto del Tronto...");

      // Set test location to San Benedetto
      const locationState = await geoSystem.setTestLocation("sanbenedetto");

      setGpsResults({
        city: locationState.currentCity?.name || "None",
        method: "manual",
        error: null,
        canRent: locationState.canRent,
        coordinates: locationState.currentCity?.coordinates || null,
        forced: true,
        detectedCity: locationState.currentCity?.name || "None",
        preferredCity: locationState.currentCity?.name || "None",
        preferredCityMethod: "forced",
      });

      console.log("📍 Forced San Benedetto results:", locationState);
    } catch (error: any) {
      console.error("Force San Benedetto error:", error);
      setGpsResults({ error: error.message || "Unknown error" });
    } finally {
      setIsTesting(false);
    }
  };

  const clearCache = () => {
    const geoSystem = new VehicleGeolocationSystem();
    geoSystem.clearLocationCache();
    setGpsResults({}); // Clear all results
    console.log("🗑️ Cache cleared");
  };

  const testEnvironment = () => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("ngrok");

    const environmentInfo = {
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      isLocalhost: isLocalhost,
      userAgent: navigator.userAgent,
      geolocation: !!navigator.geolocation,
      permissions: !!navigator.permissions,
    };

    console.log("🌍 Environment Info:", environmentInfo);

    setGpsResults({
      city: "Environment Test",
      method: "info",
      error: null,
      canRent: false,
      coordinates: null,
      environment: true,
      detectedCity: "Environment",
      preferredCity: "Environment",
      preferredCityMethod: "info",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        🧭 Location Debug Panel
      </h2>

      {/* Current Location State */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📍 Current Location State
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Preferred City:</strong>{" "}
            {locationHook.currentCity?.name || "None"}
            <br />
            <strong>Preferred Method:</strong>{" "}
            {locationHook.preferredCityMethod || "none"}
          </div>
          <div>
            <strong>Detected City:</strong>{" "}
            {locationHook.detectedCity?.name || "None"}
            <br />
            <strong>Location Method:</strong>{" "}
            {locationHook.locationMethod || "none"}
          </div>
          <div>
            <strong>Can Rent:</strong>{" "}
            {locationHook.canRent ? "✅ Yes" : "❌ No"}
            <br />
            <strong>Coordinates:</strong>{" "}
            {locationHook.coordinates
              ? `${locationHook.coordinates.lat.toFixed(
                  4
                )}, ${locationHook.coordinates.lng.toFixed(4)}`
              : "None"}
          </div>
          <div>
            <strong>Error:</strong> {locationHook.error || "None"}
            <br />
            <strong>Loading:</strong>{" "}
            {locationHook.isLoading ? "🔄 Yes" : "✅ No"}
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          🧪 Test Functions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <button
            onClick={() => testEnhancedGPS()}
            disabled={isTesting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            🧭 Enhanced GPS
          </button>
          <button
            onClick={() => testFreshGPS()}
            disabled={isTesting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            🔄 Fresh GPS
          </button>
          <button
            onClick={() => testUniversalLocation()}
            disabled={isTesting}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
          >
            🌍 Universal Location
          </button>
          <button
            onClick={() => testIPLocation()}
            disabled={isTesting}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
          >
            🌐 IP Geolocation
          </button>
          <button
            onClick={() => testSmartLocation()}
            disabled={isTesting}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
          >
            🧠 Smart Location
          </button>
          <button
            onClick={() => testPreferredCityLogic()}
            disabled={isTesting}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
          >
            🎯 Preferred City Logic
          </button>
          <button
            onClick={() => testEnvironment()}
            disabled={isTesting}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            🌍 Test Environment
          </button>
          <button
            onClick={() => clearCache()}
            disabled={isTesting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
          >
            🗑️ Clear Cache
          </button>
        </div>
      </div>

      {/* Manual City Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          🎯 Manual City Selection
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <button
            onClick={() => testManualCitySelection("rome")}
            disabled={isTesting}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            🏛️ Set Rome
          </button>
          <button
            onClick={() => testManualCitySelection("milan")}
            disabled={isTesting}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
          >
            🏢 Set Milan
          </button>
          <button
            onClick={() => testManualCitySelection("paris")}
            disabled={isTesting}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm"
          >
            🗼 Set Paris
          </button>
          <button
            onClick={() => testManualCitySelection("berlin")}
            disabled={isTesting}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm"
          >
            🏛️ Set Berlin
          </button>
          <button
            onClick={() => testManualCitySelection("madrid")}
            disabled={isTesting}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
          >
            🏟️ Set Madrid
          </button>
          <button
            onClick={() => testManualCitySelection("sanbenedetto")}
            disabled={isTesting}
            className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm"
          >
            🏖️ Set San Benedetto
          </button>
        </div>
      </div>

      {/* Test Location Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          🧪 Test Locations
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <button
            onClick={() => locationHook.setTestLocation("rome")}
            disabled={isTesting}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            🏛️ Test Rome
          </button>
          <button
            onClick={() => locationHook.setTestLocation("milan")}
            disabled={isTesting}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
          >
            🏢 Test Milan
          </button>
          <button
            onClick={() => locationHook.setTestLocation("sanbenedetto")}
            disabled={isTesting}
            className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm"
          >
            🏖️ Test San Benedetto
          </button>
          <button
            onClick={() => locationHook.clearLocation()}
            disabled={isTesting}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
          >
            🗑️ Clear Location
          </button>
        </div>
      </div>

      {/* Results Display */}
      {Object.keys(gpsResults).length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📊 Test Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>City:</strong> {gpsResults.city || "None"}
              <br />
              <strong>Method:</strong> {gpsResults.method}
              {gpsResults.enhanced && " (Enhanced)"}
              {gpsResults.universal && " (Universal)"}
              {gpsResults.fresh && " (Fresh)"}
              {gpsResults.ip && " (IP Geolocation)"}
              {gpsResults.forced && " (Forced)"}
              {gpsResults.environment && " (Environment)"}
              {gpsResults.smart && " (Smart)"}
            </div>
            <div>
              <strong>Detected City:</strong>{" "}
              {gpsResults.detectedCity || "None"}
              <br />
              <strong>Preferred City:</strong>{" "}
              {gpsResults.preferredCity || "None"}
              <br />
              <strong>Preferred Method:</strong>{" "}
              {gpsResults.preferredCityMethod || "None"}
            </div>
            <div>
              <strong>Can Rent:</strong>{" "}
              {gpsResults.canRent ? "✅ Yes" : "❌ No"}
              <br />
              <strong>Coordinates:</strong>{" "}
              {gpsResults.coordinates
                ? `${gpsResults.coordinates.lat.toFixed(
                    4
                  )}, ${gpsResults.coordinates.lng.toFixed(4)}`
                : "None"}
            </div>
            <div>
              <strong>Error:</strong> {gpsResults.error || "None"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
