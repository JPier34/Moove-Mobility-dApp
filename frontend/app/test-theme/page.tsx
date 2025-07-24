"use client";

import React from "react";
import { useTheme } from "@/providers/ThemeProvider";

export default function TestThemePage() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen p-8">
      {/* Debug Info */}
      <div className="mb-8 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
        <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">
          🔍 Theme Debug Info
        </h2>
        <p className="text-yellow-700 dark:text-yellow-300">
          Theme: {theme} | Resolved: {resolvedTheme}
        </p>
        <p className="text-yellow-700 dark:text-yellow-300">
          HTML Classes:{" "}
          {typeof document !== "undefined"
            ? document.documentElement.classList.toString()
            : "Loading..."}
        </p>
        <button
          onClick={toggleTheme}
          className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          Toggle Theme (Test Button)
        </button>
      </div>

      {/* Visual Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Card 1
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Questo testo dovrebbe cambiare colore quando cambi il tema.
          </p>
          <button className="bg-moove-primary text-white px-4 py-2 rounded hover:bg-moove-primary/90">
            Button Test
          </button>
        </div>

        {/* Card 2 */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-300 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Test Card 2
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Anche questo contenuto deve reagire al cambio tema.
          </p>
          <div className="flex space-x-2">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
              Tag 1
            </span>
            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm">
              Tag 2
            </span>
          </div>
        </div>
      </div>

      {/* Extreme Test */}
      <div className="mt-8 p-4 bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 rounded-lg">
        <h3 className="font-bold mb-2">🚨 Extreme Color Test</h3>
        <p>
          Se vedi questo testo ROSSO su sfondo ROSSO CHIARO (light mode) o ROSSO
          CHIARO su sfondo ROSSO SCURO (dark mode), il tema funziona!
        </p>
      </div>
    </div>
  );
}
