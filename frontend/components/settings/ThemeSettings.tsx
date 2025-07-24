"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";

export default function ThemeSettings() {
  const [debugMode, setDebugMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hookData, setHookData] = useState<any>(null);

  let themeHook = null;
  try {
    themeHook = useTheme();
    console.log("✅ useTheme hook working:", themeHook);
  } catch (err: any) {
    console.error("❌ useTheme hook error:", err);
    setError(err.message);
  }

  useEffect(() => {
    if (themeHook) {
      setHookData({
        theme: themeHook.theme,
        resolvedTheme: themeHook.resolvedTheme,
        hasSetTheme: typeof themeHook.setTheme === "function",
        hasToggleTheme: typeof themeHook.toggleTheme === "function",
      });
    }
  }, [themeHook?.theme, themeHook?.resolvedTheme]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          ❌ Theme Hook Error
        </h3>
        <p className="text-red-700 dark:text-red-300 text-sm mb-4">{error}</p>
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 p-3 rounded">
          <p>
            <strong>Possibili cause:</strong>
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>ThemeProvider non è wrappato correttamente nel layout</li>
            <li>
              Import path sbagliato: verifica{" "}
              <code>@/providers/ThemeProvider</code>
            </li>
            <li>ThemeProvider non esporta useTheme</li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!themeHook) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          ⚠️ Theme Hook Loading...
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
          ThemeProvider sembra essere presente ma l'hook non è ancora caricato.
        </p>
      </div>
    );
  }

  const { theme, resolvedTheme, setTheme, toggleTheme } = themeHook;

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    console.log(`🎨 ThemeSettings: Changing theme to ${newTheme}`);
    try {
      setTheme(newTheme);
      console.log("✅ Theme change successful");
    } catch (err) {
      console.error("❌ Theme change error:", err);
    }
  };

  const handleToggle = () => {
    console.log(`🎨 ThemeSettings: Toggling theme (current: ${resolvedTheme})`);
    try {
      toggleTheme();
      console.log("✅ Theme toggle successful");
    } catch (err) {
      console.error("❌ Theme toggle error:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Theme Settings
        </h3>
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
        >
          {debugMode ? "Hide" : "Show"} Debug
        </button>
      </div>

      {/* Debug Info */}
      {debugMode && hookData && (
        <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-3 rounded text-xs font-mono">
          <div className="mb-2 font-bold">Hook Data:</div>
          <div>
            Theme:{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {hookData.theme}
            </span>
          </div>
          <div>
            Resolved:{" "}
            <span className="text-green-600 dark:text-green-400">
              {hookData.resolvedTheme}
            </span>
          </div>
          <div>
            SetTheme:{" "}
            <span
              className={
                hookData.hasSetTheme
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {hookData.hasSetTheme ? "✅" : "❌"}
            </span>
          </div>
          <div>
            ToggleTheme:{" "}
            <span
              className={
                hookData.hasToggleTheme
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {hookData.hasToggleTheme ? "✅" : "❌"}
            </span>
          </div>
          <div className="mt-2">
            <div>
              HTML Classes:{" "}
              <span className="text-purple-600 dark:text-purple-400">
                {document.documentElement.classList.toString()}
              </span>
            </div>
            <div>
              LocalStorage:{" "}
              <span className="text-orange-600 dark:text-orange-400">
                {localStorage.getItem("moove-theme") || "null"}
              </span>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => handleThemeChange(mode)}
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
            Current: {resolvedTheme}
            {theme === "system" && " (Auto)"}
          </p>
        </div>

        {/* Test Buttons */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={handleToggle}
            className="w-full bg-moove-primary text-white px-4 py-2 rounded-lg hover:bg-moove-primary/90 transition-colors"
          >
            🔄 Toggle Theme
          </button>

          <button
            onClick={() => {
              console.log("🔍 Manual Check:", {
                theme,
                resolvedTheme,
                htmlClasses: document.documentElement.classList.toString(),
                localStorage: localStorage.getItem("moove-theme"),
              });
            }}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            📊 Log Current State
          </button>
        </div>
      </div>
    </div>
  );
}
