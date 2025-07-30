"use client";

import React, { useState, useEffect, useRef } from "react";
import { EUROPEAN_CITIES, VehicleType } from "@/config/cities";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";
import LocationPermissionModal from "@/components/modals/LocationPermissionModal";
import type {
  LocationCoordinates,
  NearbyVehicle,
} from "@/utils/vehicleGeoLocation";

// ============= TYPES =============
interface VehicleOption {
  type: VehicleType;
  name: string;
  icon: string;
  image: string;
  priceEth: string;
  description: string;
  range: string;
  features: string[];
  gradient: string;
}

interface LocationState {
  currentCity: any | null;
  isLoading: boolean;
  error: string | null;
  canRent: boolean;
  nearbyVehicles: NearbyVehicle[];
  location: LocationCoordinates | null;
  showLocationModal: boolean;
  locationMethod: "gps" | "manual" | "none";
}

// ============= DATA =============
const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    type: "bike",
    name: "E-Bike Access",
    icon: "🚲",
    image: "/images/vehicles/e-bike-city.jpg",
    priceEth: "0.025 ETH",
    description: "Perfect for city exploration and daily commutes",
    range: "25-50 km",
    features: [
      "30 days unlimited access",
      "All partner bikes",
      "City-wide coverage",
    ],
    gradient: "from-green-400 to-blue-500",
  },
  {
    type: "scooter",
    name: "E-Scooter Access",
    icon: "🛴",
    image: "/images/vehicles/scooter-urban.jpg",
    priceEth: "0.035 ETH",
    description: "Fast and convenient for short to medium trips",
    range: "30-60 km",
    features: [
      "30 days unlimited access",
      "All partner scooters",
      "Premium locations",
    ],
    gradient: "from-purple-400 to-pink-500",
  },
  {
    type: "monopattino",
    name: "Monopattino Access",
    icon: "🛵",
    image: "/images/vehicles/monopattino-premium.jpg",
    priceEth: "0.045 ETH",
    description: "Premium urban mobility experience",
    range: "15-35 km",
    features: [
      "30 days unlimited access",
      "Exclusive vehicles",
      "Priority support",
    ],
    gradient: "from-orange-400 to-red-500",
  },
];

const STATS = [
  { label: "European Cities", value: 20, suffix: "" },
  { label: "Available Vehicles", value: 2500, suffix: "+" },
  { label: "Happy Users", value: 15000, suffix: "+" },
  { label: "CO₂ Saved (tons)", value: 450, suffix: "+" },
];

// ============= HOOKS =============
function useLocationWithModal(): [
  LocationState,
  {
    handleLocationGranted: (location: LocationCoordinates) => void;
    handleLocationDenied: () => void;
    handleManualCitySelect: (cityId: string) => void;
    requestLocationAgain: () => void;
  }
] {
  const [locationState, setLocationState] = useState<LocationState>({
    currentCity: null,
    isLoading: false,
    error: null,
    canRent: false,
    nearbyVehicles: [],
    location: null,
    showLocationModal: true, // Show modal on first load
    locationMethod: "none",
  });

  // Check if we already have location permission on mount
  useEffect(() => {
    const checkExistingPermission = async (): Promise<void> => {
      try {
        const geoSystem = new VehicleGeolocationSystem();

        // Check permissions first
        let permission: "granted" | "denied" | "prompt" = "prompt";

        if (navigator.permissions) {
          try {
            const permissionStatus = await navigator.permissions.query({
              name: "geolocation" as PermissionName,
            });
            permission = permissionStatus.state as
              | "granted"
              | "denied"
              | "prompt";
          } catch (error) {
            console.warn("Could not check location permission:", error);
            permission = "prompt";
          }
        }

        if (permission === "granted") {
          // Try to get location without showing modal
          try {
            const location = await geoSystem.getCurrentLocation();
            handleLocationGranted(location);
            setLocationState((prev) => ({ ...prev, showLocationModal: false }));
          } catch (error) {
            // Permission granted but location failed, show modal
            setLocationState((prev) => ({ ...prev, showLocationModal: true }));
          }
        } else {
          // Permission not granted, show modal
          setLocationState((prev) => ({ ...prev, showLocationModal: true }));
        }
      } catch (error) {
        // Permissions API not available, show modal
        setLocationState((prev) => ({ ...prev, showLocationModal: true }));
      }
    };

    checkExistingPermission();
  }, []);

  const handleLocationGranted = async (location: LocationCoordinates) => {
    setLocationState((prev) => ({
      ...prev,
      isLoading: true,
      showLocationModal: false,
      locationMethod: "gps",
    }));

    try {
      const geoSystem = new VehicleGeolocationSystem();
      const cityCheck = geoSystem.checkCitySupport(location);

      let currentCity = null;
      let canRent = false;
      let nearbyVehicles: NearbyVehicle[] = [];

      if (cityCheck.inCity && cityCheck.cityName) {
        currentCity = EUROPEAN_CITIES.find(
          (city) => city.id === cityCheck.cityName
        );
        canRent = true;

        try {
          nearbyVehicles = await geoSystem.getNearbyVehicles(location, 2);
        } catch (error) {
          console.warn("Could not fetch nearby vehicles:", error);
        }
      }

      setLocationState((prev) => ({
        ...prev,
        currentCity,
        location,
        canRent,
        nearbyVehicles,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      setLocationState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to process location",
      }));
    }
  };

  const handleLocationDenied = () => {
    setLocationState((prev) => ({
      ...prev,
      showLocationModal: false,
      locationMethod: "none",
      error: "Location access denied",
    }));
  };

  const handleManualCitySelect = (cityId: string) => {
    const selectedCity = EUROPEAN_CITIES.find((city) => city.id === cityId);

    if (selectedCity) {
      setLocationState((prev) => ({
        ...prev,
        currentCity: selectedCity,
        canRent: true,
        showLocationModal: false,
        locationMethod: "manual",
        location: selectedCity.coordinates,
        nearbyVehicles: [], // No nearby vehicles without GPS
        error: null,
      }));
    }
  };

  const requestLocationAgain = () => {
    setLocationState((prev) => ({
      ...prev,
      showLocationModal: true,
      error: null,
    }));
  };

  return [
    locationState,
    {
      handleLocationGranted,
      handleLocationDenied,
      handleManualCitySelect,
      requestLocationAgain,
    },
  ];
}

// ============= COMPONENTS =============

function AnimatedCounter({
  target,
  suffix,
  isInView,
}: {
  target: number;
  suffix: string;
  isInView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target, isInView]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function LocationStatusBanner({
  locationState,
  onRequestLocation,
}: {
  locationState: LocationState;
  onRequestLocation: () => void;
}) {
  const {
    currentCity,
    isLoading,
    error,
    canRent,
    nearbyVehicles,
    locationMethod,
  } = locationState;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-200 px-6 py-3 rounded-full text-lg font-medium"
      >
        <motion.div
          className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-3"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        Processing your location...
      </motion.div>
    );
  }

  if (canRent && currentCity) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center bg-green-500/10 backdrop-blur-sm border border-green-500/20 text-green-200 px-6 py-3 rounded-full text-lg font-medium"
      >
        <span className="text-2xl mr-3">
          {locationMethod === "gps" ? "📍" : "🏙️"}
        </span>
        <div className="text-left">
          <div>Service available in {currentCity.name}</div>
          <div className="text-sm opacity-75">
            {locationMethod === "gps"
              ? `${nearbyVehicles.length} vehicles nearby`
              : "Manual city selection"}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 text-yellow-200 px-6 py-3 rounded-full text-lg font-medium"
      >
        <span className="text-2xl mr-3">⚠️</span>
        <div className="text-left">
          <div>Location not available</div>
          <div className="text-sm opacity-75">
            <button
              onClick={onRequestLocation}
              className="underline hover:no-underline"
            >
              Click here to set location
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full text-lg font-medium"
    >
      <span className="text-2xl mr-3">🌍</span>
      <div className="text-left">
        <div>Available in {EUROPEAN_CITIES.length} European cities</div>
        <div className="text-sm opacity-75">
          <button
            onClick={onRequestLocation}
            className="underline hover:no-underline"
          >
            Set your location to get started
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.section
      ref={ref}
      className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,theme(colors.blue.500)_0%,transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_75%_75%,theme(colors.green.500)_0%,transparent_50%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Powering Europe's
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {" "}
              Sustainable Future
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join thousands of users already embracing the revolution in urban
            mobility
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="text-center group"
            >
              <motion.div
                className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  isInView={isInView}
                />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function VehicleSection({
  locationState,
  onRentVehicle,
}: {
  locationState: LocationState;
  onRentVehicle: (vehicle: VehicleOption) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const { currentCity, canRent, nearbyVehicles } = locationState;

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
              ).map((vehicle: VehicleOption) => (
                <PremiumVehicleCard
                  key={vehicle.type}
                  vehicle={vehicle}
                  onSelect={() => onRentVehicle(vehicle)}
                  userHasPass={false} // Will be determined by smart contract
                />
              ))}
            </motion.div>

            {nearbyVehicles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <NearbyVehiclesSection vehicles={nearbyVehicles} />
              </motion.div>
            )}
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

function PremiumVehicleCard({
  vehicle,
  onSelect,
  userHasPass,
}: {
  vehicle: VehicleOption;
  onSelect: () => void;
  userHasPass: boolean;
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

function NFTMarketplaceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.section
      ref={ref}
      className="py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            🎨 Explore Our NFT Universe
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover rental passes, exclusive decorative NFTs, and limited
            edition collections. Own your digital mobility assets.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/marketplace">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-white text-purple-600 font-bold py-4 px-8 rounded-full text-lg shadow-2xl hover:shadow-white/25 transition-all duration-300"
              >
                <span className="flex items-center">
                  Browse Rental Passes
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🚲
                  </motion.span>
                </span>
              </motion.button>
            </Link>

            <Link href="/auctions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold py-4 px-8 rounded-full text-lg hover:bg-white/20 transition-all duration-300"
              >
                <span className="flex items-center">
                  Decorative Auctions
                  <motion.span
                    className="ml-2"
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    🎨
                  </motion.span>
                </span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const steps = [
    {
      step: "1",
      title: "Set Your Location",
      description: "Allow location access or manually select your city",
      icon: "📍",
    },
    {
      step: "2",
      title: "Buy NFT Pass",
      description: "Purchase your 30-day unlimited access pass as a secure NFT",
      icon: "🎨",
    },
    {
      step: "3",
      title: "Generate Access Code",
      description: "Create temporary codes instantly when you want to ride",
      icon: "🔐",
    },
    {
      step: "4",
      title: "Unlock & Ride",
      description: "Use your code with any partner vehicle in your city",
      icon: "✨",
    },
  ];

  return (
    <motion.section
      ref={ref}
      className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            How{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Moove
            </span>{" "}
            Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Four simple steps to revolutionize your urban mobility experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative group"
            >
              {/* Connecting line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-green-200 to-transparent dark:from-green-800 z-0">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                    initial={{ width: "0%" }}
                    animate={isInView ? { width: "60%" } : { width: "0%" }}
                    transition={{ duration: 1, delay: index * 0.2 + 0.8 }}
                  />
                </div>
              )}

              {/* Step Card */}
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 relative z-10 h-full"
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Step Number Badge */}
                <motion.div
                  className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -10, 10, 0],
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {step.step}
                </motion.div>

                {/* Icon */}
                <motion.div
                  className="text-6xl mb-6 text-center"
                  whileHover={{
                    scale: 1.2,
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {step.icon}
                </motion.div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-center mt-16"
        >
          <motion.div
            className="inline-flex items-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-full px-8 py-4 mb-8"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.span
              className="text-2xl mr-3"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚡
            </motion.span>
            <span className="text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Ready to start your sustainable journey?
            </span>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/marketplace">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <span className="flex items-center">
                  Get Your Pass Now
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

            <Link href="/how-it-works">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 border-2 border-green-500 text-green-600 dark:text-green-400 font-semibold py-4 px-8 rounded-full text-lg hover:bg-green-50 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Learn More
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

// ============= MAIN COMPONENT =============
export default function RentalHomepage() {
  const [
    locationState,
    {
      handleLocationGranted,
      handleLocationDenied,
      handleManualCitySelect,
      requestLocationAgain,
    },
  ] = useLocationWithModal();

  const handleRentVehicle = (vehicle: VehicleOption) => {
    if (locationState.canRent) {
      // Redirect to marketplace with vehicle pre-selected and city info
      const cityParam = locationState.currentCity?.id
        ? `&city=${locationState.currentCity.id}`
        : "";
      window.location.href = `/marketplace?vehicle=${vehicle.type}${cityParam}`;
    } else {
      // Redirect to marketplace for location setup
      window.location.href = "/marketplace";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={locationState.showLocationModal}
        onLocationGranted={handleLocationGranted}
        onLocationDenied={handleLocationDenied}
        onManualCitySelect={handleManualCitySelect}
      />

      {/* Hero Section with Dynamic Location Status */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Welcome to{" "}
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Moove
            </span>
          </motion.h1>

          <motion.p
            className="text-2xl mb-12 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The future of urban mobility is here. Rent electric vehicles with
            blockchain-powered NFT passes.
          </motion.p>

          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <LocationStatusBanner
              locationState={locationState}
              onRequestLocation={requestLocationAgain}
            />
          </motion.div>
        </div>
      </section>

      <StatsSection />
      <VehicleSection
        locationState={locationState}
        onRentVehicle={handleRentVehicle}
      />
      <NFTMarketplaceSection />
      <HowItWorksSection />
    </div>
  );
}
