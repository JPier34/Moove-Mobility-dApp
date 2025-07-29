"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";
import { EUROPEAN_CITIES, VehicleType } from "@/config/cities";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

// ============= TYPES =============

interface VehicleOption {
  type: VehicleType;
  name: string;
  icon: string;
  image: string;
  price: string;
  priceEth: string;
  description: string;
  range: string;
  features: string[];
  gradient: string;
}

interface GeolocationResult {
  location: { lat: number; lng: number } | null;
  cityInfo: { inCity: boolean; cityName?: string; distance?: number } | null;
  isLoading: boolean;
  canRent: boolean;
  error: string | null;
}

// ============= DATA =============

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    type: "bike",
    name: "E-Bike Access",
    icon: "🚲",
    image: "/images/vehicles/e-bike-city.jpg",
    price: "€25",
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
    price: "€35",
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
    price: "€45",
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

// ============= UTILS =============

function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function checkCitySupport(location: { lat: number; lng: number }) {
  for (const city of EUROPEAN_CITIES) {
    const { bounds } = city;
    if (
      location.lat >= bounds.south &&
      location.lat <= bounds.north &&
      location.lng >= bounds.west &&
      location.lng <= bounds.east
    ) {
      return { inCity: true, cityName: city.id, distance: 0 };
    }
  }

  const distances = EUROPEAN_CITIES.map((city) => ({
    name: city.id,
    distance: calculateDistance(location, city.coordinates),
  }));

  const nearest = distances.reduce((min, curr) =>
    curr.distance < min.distance ? curr : min
  );

  return { inCity: false, distance: nearest.distance };
}

// ============= HOOKS =============

function useGeolocation(): GeolocationResult {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (error) => {
        setError(error.message);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const cityInfo = location ? checkCitySupport(location) : null;
  const canRent = cityInfo?.inCity || false;

  return { location, cityInfo, isLoading, canRent, error };
}

// ============= COMPONENTS =============

// Animated Counter Component
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

// Location Status Banner
function LocationStatusBanner({
  cityInfo,
  canRent,
  currentCity,
  geoError,
}: any) {
  if (geoError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-200 px-6 py-3 rounded-full text-lg font-medium"
      >
        <span className="text-2xl mr-3">❌</span>
        Location access required - Please enable location services
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
        <span className="text-2xl mr-3">📍</span>
        Service available in {currentCity.name}
        <span className="ml-3 bg-green-500/20 px-3 py-1 rounded-full text-sm">
          {currentCity.allowedVehicles.length} vehicle types
        </span>
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
      Currently available in {EUROPEAN_CITIES.length} European cities
      {cityInfo?.distance && (
        <span className="ml-3 bg-white/10 px-3 py-1 rounded-full text-sm">
          {cityInfo.distance.toFixed(1)} km to nearest city
        </span>
      )}
    </motion.div>
  );
}

// Stats Section
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

// Premium Vehicle Card
function PremiumVehicleCard({ vehicle, onSelect, userHasPass }: any) {
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
              {vehicle.price}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {vehicle.priceEth}
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

        <Link href="/marketplace" passHref>
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
              userHasPass
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {userHasPass ? "Generate Code" : "Get Access Pass"}
          </motion.a>
        </Link>
      </div>
    </motion.div>
  );
}

// Vehicle Section
function VehicleSection({
  currentCity,
  vehicleOptions,
  onRentVehicle,
  userPasses,
  nearbyVehicles,
}: any) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.section
      ref={ref}
      className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-7xl mx-auto px-6">
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
          {vehicleOptions.map((vehicle: VehicleOption) => (
            <PremiumVehicleCard
              key={vehicle.type}
              vehicle={vehicle}
              onSelect={() => onRentVehicle(vehicle)}
              userHasPass={userPasses.some(
                (pass: any) =>
                  pass.vehicleType === vehicle.type &&
                  pass.cityId === currentCity.id
              )}
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
      </div>
    </motion.section>
  );
}

// Nearby Vehicles Section
function NearbyVehiclesSection({ vehicles }: { vehicles: any[] }) {
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
        {vehicles.map((vehicle, index) => (
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          View on Map
        </motion.button>
      </div>
    </motion.div>
  );
}

// NFT Marketplace Section
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
            Discover our new section: the exclusive decorative. Own your digital
            mobility assets.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/auctions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-white/30 backdrop-blur-sm border border-white/20 text-white font-semibold py-4 px-8 rounded-full text-lg hover:bg-white/20 transition-all duration-300"
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

// How It Works Section
function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const steps = [
    {
      step: "1",
      title: "Choose Your Vehicle",
      description:
        "Select from bikes, scooters, or monopattinos based on your needs",
      icon: "🎯",
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

                  {/* Animated progress dots */}
                  <div className="flex justify-center mt-6 space-x-1">
                    {[...Array(4)].map((_, dotIndex) => (
                      <motion.div
                        key={dotIndex}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          dotIndex <= index
                            ? "bg-gradient-to-r from-green-500 to-blue-500"
                            : "bg-gray-200 dark:bg-gray-600"
                        }`}
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : { scale: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.2 + dotIndex * 0.1 + 1,
                        }}
                        whileHover={{ scale: 1.5 }}
                      />
                    ))}
                  </div>
                </div>

                {/* Hover Effect Background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  initial={false}
                />
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
            <Link href="/rent">
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

          {/* Additional Info */}
          <motion.p
            className="text-sm text-gray-500 dark:text-gray-400 mt-6 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.6 }}
          >
            🔒 Secure blockchain technology • 🌱 100% eco-friendly • 🚀 Instant
            access
          </motion.p>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default function RentalHomepage() {
  const { location, cityInfo, isLoading, canRent, error } = useGeolocation();

  // Mock data per testing
  const currentCity = EUROPEAN_CITIES[0] || {
    name: "Rome",
    id: "rome",
    allowedVehicles: ["bike", "scooter", "monopattino"],
  };
  const userPasses: never[] = [];
  const nearbyVehicles: never[] = [];

  const handleRentVehicle = (vehicle: VehicleOption) => {
    console.log("Renting:", vehicle);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StatsSection />
      <VehicleSection
        currentCity={currentCity}
        vehicleOptions={VEHICLE_OPTIONS}
        onRentVehicle={handleRentVehicle}
        userPasses={userPasses}
        nearbyVehicles={nearbyVehicles}
      />
      <NFTMarketplaceSection />
      <HowItWorksSection />
    </div>
  );
}
