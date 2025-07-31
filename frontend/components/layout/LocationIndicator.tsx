"use client";

import React from "react";
import { useLocationAndCity } from "@/hooks/useLocationAndCity";

export function LocationIndicator() {
  const { currentCity, canRent, isLoading, error, locationMethod } =
    useLocationAndCity();

  // Don't show anything if still loading
  if (isLoading) {
    return (
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
        Detecting...
      </div>
    );
  }

  // Show location status
  return (
    <div className="flex items-center text-xs">
      {canRent && currentCity ? (
        <>
          {/* Success indicator */}
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              error ? "bg-yellow-500" : "bg-green-500"
            }`}
          ></div>
          <div
            className={`${
              error
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            <span className="font-medium">{currentCity.name}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              ({locationMethod === "manual" ? "fallback" : "gps"})
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Error indicator */}
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <div className="text-red-600 dark:text-red-400">No service area</div>
        </>
      )}
    </div>
  );
}
