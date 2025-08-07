import React from "react";
import LocationDebug from "@/components/settings/LocationDebug";
import ThemeSettings from "@/components/settings/ThemeSettings";

export default function LocationTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 Test Tools
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Debug and test location services and theme settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LocationDebug />
          <ThemeSettings />
        </div>
      </div>
    </div>
  );
}
