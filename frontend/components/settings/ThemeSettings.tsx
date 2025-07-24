"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export default function ThemeSettings() {
  const { theme, resolvedTheme, config, setTheme, updateConfig } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Theme Settings
      </h3>

      {/* Theme Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["light", "dark", "system"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                  theme === mode
                    ? "border-moove-primary bg-moove-primary/10 text-moove-primary"
                    : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="text-2xl mb-1">
                  {mode === "light" ? "☀️" : mode === "dark" ? "🌙" : "🔄"}
                </div>
                {mode}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Current: {resolvedTheme} {theme === "system" && "(Auto)"}
          </p>
        </div>

        {/* Auto Switch Settings */}
        {theme === "system" && (
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.autoSwitch}
                onChange={(e) => updateConfig({ autoSwitch: e.target.checked })}
                className="rounded border-gray-300 text-moove-primary focus:ring-moove-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-switch based on time
              </span>
            </label>

            {config.autoSwitch && (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Dark starts at
                  </label>
                  <select
                    value={config.darkStart}
                    onChange={(e) =>
                      updateConfig({ darkStart: parseInt(e.target.value) })
                    }
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Light starts at
                  </label>
                  <select
                    value={config.darkEnd}
                    onChange={(e) =>
                      updateConfig({ darkEnd: parseInt(e.target.value) })
                    }
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
