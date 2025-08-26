"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";

interface LocationPermissionModalProps {
  isOpen: boolean;
  onLocationGranted: (location: { lat: number; lng: number }) => void;
  onLocationDenied: () => void;
}

interface PermissionState {
  isRequesting: boolean;
  hasRequestedBefore: boolean;
  error: string | null;
}

function LocationBenefits() {
  const benefits = [
    {
      icon: "🎯",
      title: "Precise Vehicle Finding",
      description: "See exactly which vehicles are near you",
    },
    {
      icon: "🔐",
      title: "City-Specific Codes",
      description: "Access codes work only in your current city",
    },
    {
      icon: "⚡",
      title: "Instant Availability",
      description: "Real-time updates on nearby vehicles",
    },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
        Why We Need Your Location
      </h4>
      <div className="space-y-3">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            className="flex items-start space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-2xl">{benefit.icon}</span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {benefit.title}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {benefit.description}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function LocationPermissionModal({
  isOpen,
  onLocationGranted,
  onLocationDenied,
}: LocationPermissionModalProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>({
    isRequesting: false,
    hasRequestedBefore: false,
    error: null,
  });

  const handleRequestLocation = async () => {
    setPermissionState({
      isRequesting: true,
      hasRequestedBefore: true,
      error: null,
    });

    try {
      const geoSystem = new VehicleGeolocationSystem();
      const location = await geoSystem.getCurrentLocation();
      onLocationGranted(location);
    } catch (error: any) {
      console.error("Location request failed:", error);
      setPermissionState({
        isRequesting: false,
        hasRequestedBefore: true,
        error: error.message,
      });
    }
  };

  const handleSkipForNow = () => {
    onLocationDenied();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="text-center">
            <motion.div
              className="text-8xl mb-6"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              📍
            </motion.div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Moove
              </span>
            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              To provide the best experience, we need your location
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <LocationBenefits />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  🔒 Your Privacy
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p>• Location used only for vehicle finding</p>
                  <p>• No tracking or storage of your data</p>
                  <p>• You can change this anytime</p>
                  <p>• Required for access code generation</p>
                </div>
              </div>
            </div>

            {permissionState.error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6"
              >
                <div className="text-red-800 dark:text-red-200 font-medium mb-2">
                  Location Access Failed
                </div>
                <div className="text-red-600 dark:text-red-300 text-sm">
                  {permissionState.error}
                </div>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={handleRequestLocation}
                disabled={permissionState.isRequesting}
                className={`bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                  permissionState.isRequesting
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                whileHover={
                  !permissionState.isRequesting ? { scale: 1.05, y: -2 } : {}
                }
                whileTap={!permissionState.isRequesting ? { scale: 0.95 } : {}}
              >
                {permissionState.isRequesting ? (
                  <span className="flex items-center">
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    Getting Location...
                  </span>
                ) : (
                  <span className="flex items-center">
                    📍 Allow Location Access
                    <motion.span
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </span>
                )}
              </motion.button>

              <motion.button
                onClick={handleSkipForNow}
                className="bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-4 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                ⏭️ Skip for now
              </motion.button>
            </div>

            <motion.p
              className="mt-6 text-gray-500 dark:text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              You can enable location access later in settings
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
