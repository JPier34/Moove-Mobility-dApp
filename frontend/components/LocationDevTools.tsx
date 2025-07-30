"use client";

import React from "react";

interface LocationDevToolsProps {
  onTestLocation: (
    city: "rome" | "milan" | "paris" | "berlin" | "madrid"
  ) => void;
  onClearLocation: () => void;
  currentState: {
    currentCity: any | null;
    locationMethod?: "gps" | "google" | "manual" | "cached";
    coordinates?: { lat: number; lng: number } | null;
  };
}

export function LocationDevTools({
  onTestLocation,
  onClearLocation,
  currentState,
}: LocationDevToolsProps) {
  // Solo in development mode
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const testCities = [
    { id: "rome" as const, name: "Rome", flag: "🇮🇹" },
    { id: "milan" as const, name: "Milan", flag: "🇮🇹" },
    { id: "paris" as const, name: "Paris", flag: "🇫🇷" },
    { id: "berlin" as const, name: "Berlin", flag: "🇩🇪" },
    { id: "madrid" as const, name: "Madrid", flag: "🇪🇸" },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 shadow-lg max-w-xs">
      <div className="text-sm font-bold text-yellow-800 mb-2">
        🏗️ DEV: Location Tools
      </div>

      <div className="text-xs text-gray-600 mb-3">
        <div>City: {currentState.currentCity?.name || "None"}</div>
        <div>Method: {currentState.locationMethod || "manual"}</div>
        {currentState.coordinates && (
          <div className="text-xs text-gray-500">
            Coords: {currentState.coordinates.lat.toFixed(4)},{" "}
            {currentState.coordinates.lng.toFixed(4)}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Test Locations:</div>
        <div className="flex flex-wrap gap-1">
          {testCities.map((city) => (
            <button
              key={city.id}
              onClick={() => onTestLocation(city.id)}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
              title={`Set location to ${city.name}`}
            >
              {city.flag} {city.name}
            </button>
          ))}
        </div>

        <button
          onClick={onClearLocation}
          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 w-full transition-colors"
        >
          🗑️ Clear Location
        </button>

        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-300">
          💡 Tip: Location persists for 30min
        </div>
      </div>
    </div>
  );
}
