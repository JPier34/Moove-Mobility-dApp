"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { EUROPEAN_CITIES, VehicleType } from "../../config/cities";
import type { NearbyVehicle } from "@/utils/vehicleGeoLocation";
import { parsePrice } from "@/utils/helpers";
import { VehicleOption, VEHICLE_OPTIONS } from "@/config/vehicles";

interface LocationState {
  currentCity: any | null;
  isLoading: boolean;
  error: string | null;
  canRent: boolean;
  location: any | null;
  showLocationModal: boolean;
  locationMethod: "gps" | "manual" | "none";
}

function PremiumVehicleCard({
  vehicle,
  onSelect,
  userHasPass,
  citySpecificAvailability,
}: {
  vehicle: VehicleOption;
  onSelect: () => void;
  userHasPass: boolean;
  citySpecificAvailability: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -10, transition: { type: "spring", stiffness: 300 } }}
      className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer"
      onClick={onSelect}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${vehicle.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-8xl group-hover:scale-110 transition-transform duration-500">
            {vehicle.icon}
          </div>
        </div>

        {userHasPass && (
          <div className="absolute top-4 right-4">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
            >
              ✓ Owned
            </motion.span>
          </div>
        )}

        {/* City-specific availability indicator */}
        <div className="absolute top-4 left-4">
          <div className="bg-blue-500/90 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            {citySpecificAvailability} available
          </div>
        </div>

        <div className="absolute bottom-4 left-4">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {vehicle.priceEth}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              30 days access
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
          {vehicle.name}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
          {vehicle.description}
        </p>

        <div className="space-y-2 mb-6">
          {vehicle.features.slice(0, 2).map((feature: string, idx: number) => (
            <div
              key={idx}
              className="flex items-center text-sm text-gray-600 dark:text-gray-300"
            >
              <motion.span
                className="text-green-500 mr-2"
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                ✓
              </motion.span>
              {feature}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
          <span>Range: {vehicle.range}</span>
          <span>30 days access</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
            userHasPass
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
          }`}
        >
          {userHasPass ? "Generate Code" : "Get Access Pass"}
        </motion.button>
      </div>
    </motion.div>
  );
}

function NearbyVehiclesSection({ vehicles }: { vehicles: NearbyVehicle[] }) {
  return (
    <motion.div
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-gray-700/20"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🗺️ Vehicles Near You
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          {vehicles.length} vehicles available within 2km
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.slice(0, 6).map((vehicle, index) => (
          <motion.div
            key={vehicle.vehicleId}
            className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <motion.span
                  className="text-2xl mr-3"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                >
                  {vehicle.vehicleType === "bike"
                    ? "🚲"
                    : vehicle.vehicleType === "scooter"
                    ? "🛴"
                    : "🛵"}
                </motion.span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {vehicle.vehicleId.split("-").pop()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {vehicle.distance?.toFixed(1)}km away
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${
                    vehicle.batteryLevel > 70
                      ? "text-green-600"
                      : vehicle.batteryLevel > 30
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {vehicle.batteryLevel}% battery
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ~{vehicle.estimatedRange}km range
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Last updated: {new Date(vehicle.lastUpdate).toLocaleTimeString()}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          💡 Get a Moove Pass to unlock any compatible vehicle instantly
        </p>
        <Link href="/marketplace">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl font-medium"
          >
            🛒 Get Access Pass
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function VehicleSection({
  locationState,
  onRentVehicle,
}: {
  locationState: LocationState;
  onRentVehicle: (vehicle: VehicleOption) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const { currentCity, canRent } = locationState;

  return (
    <motion.section
      ref={ref}
      className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-7xl mx-auto px-6">
        {canRent && currentCity ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Available in{" "}
                <span className="text-green-600">{currentCity.name}</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose your preferred vehicle type and get instant access to our
                premium fleet
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.2 },
                },
              }}
              initial="hidden"
              animate={isInView ? "show" : "hidden"}
            >
              {VEHICLE_OPTIONS.filter(
                (vehicle) =>
                  currentCity.allowedVehicles?.includes(vehicle.type) || true
              ).map((vehicle: VehicleOption) => {
                const cityAvailability = currentCity.vehicleAvailability
                  ? currentCity.vehicleAvailability[vehicle.type] || 0
                  : 0;
                return (
                  <PremiumVehicleCard
                    key={vehicle.type}
                    vehicle={vehicle}
                    onSelect={() => onRentVehicle(vehicle)}
                    userHasPass={false}
                    citySpecificAvailability={cityAvailability}
                  />
                );
              })}
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-8xl mb-6">🗺️</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Explore Our Service Areas
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Moove is available in major European cities. Set your location to
              see what's available near you.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              {EUROPEAN_CITIES.slice(0, 8).map((city) => (
                <motion.div
                  key={city.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-2xl mb-2">{city.emoji || "🏙️"}</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {city.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {city.country}
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href="/marketplace">
              <motion.button
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center">
                  🛒 Browse Marketplace
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
