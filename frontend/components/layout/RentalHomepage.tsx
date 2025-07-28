"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { VehicleGeolocationSystem } from "@/utils/vehicleGeoLocation";
import { EUROPEAN_CITIES, VehicleType } from "@/config/cities";

// Import the geolocation hook (we'll create this if it doesn't exist)
interface GeolocationResult {
  location: { lat: number; lng: number } | null;
  cityInfo: { inCity: boolean; cityName?: string; distance?: number } | null;
  isLoading: boolean;
  canRent: boolean;
  error: string | null;
}

// Simple geolocation hook
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

  // Check if user is in supported city
  const cityInfo = location ? checkCitySupport(location) : null;
  const canRent = cityInfo?.inCity || false;

  return { location, cityInfo, isLoading, canRent, error };
}

// Function to check if location is in supported city
function checkCitySupport(location: { lat: number; lng: number }) {
  for (const city of EUROPEAN_CITIES) {
    const { bounds } = city;
    if (
      location.lat >= bounds.south &&
      location.lat <= bounds.north &&
      location.lng >= bounds.west &&
      location.lng <= bounds.east
    ) {
      return {
        inCity: true,
        cityName: city.id,
        distance: 0,
      };
    }
  }

  // Calculate distance to nearest city
  const distances = EUROPEAN_CITIES.map((city) => ({
    name: city.id,
    distance: calculateDistance(location, city.coordinates),
  }));

  const nearest = distances.reduce((min, curr) =>
    curr.distance < min.distance ? curr : min
  );

  return {
    inCity: false,
    distance: nearest.distance,
  };
}

// Distance calculation helper
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth radius in km
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

interface VehicleOption {
  type: VehicleType;
  name: string;
  icon: string;
  price: string;
  priceEth: string;
  description: string;
  range: string;
  features: string[];
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    type: "bike",
    name: "E-Bike Access",
    icon: "🚲",
    price: "€25",
    priceEth: "0.025 ETH",
    description: "Perfect for city exploration and daily commutes",
    range: "25-50 km",
    features: [
      "30 days unlimited access",
      "All partner bikes",
      "City-wide coverage",
    ],
  },
  {
    type: "scooter",
    name: "E-Scooter Access",
    icon: "🛴",
    price: "€35",
    priceEth: "0.035 ETH",
    description: "Fast and convenient for short to medium trips",
    range: "30-60 km",
    features: [
      "30 days unlimited access",
      "All partner scooters",
      "Premium locations",
    ],
  },
  {
    type: "monopattino",
    name: "Monopattino Access",
    icon: "🛵",
    price: "€45",
    priceEth: "0.045 ETH",
    description: "Premium urban mobility experience",
    range: "15-35 km",
    features: [
      "30 days unlimited access",
      "Exclusive vehicles",
      "Priority support",
    ],
  },
];

export default function RentalHomepage() {
  const { address, isConnected } = useAccount();
  const {
    location,
    cityInfo,
    isLoading: geoLoading,
    canRent,
    error: geoError,
  } = useGeolocation();

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(
    null
  );
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [nearbyVehicles, setNearbyVehicles] = useState<any[]>([]);
  const [userPasses, setUserPasses] = useState<any[]>([]);

  // Initialize vehicle system and get nearby vehicles
  useEffect(() => {
    const vehicleSystem = VehicleGeolocationSystem.getInstance();
    vehicleSystem.initializeVehicleFleet();

    if (location && canRent && cityInfo?.cityName) {
      const nearby = vehicleSystem.getVehiclesNearLocation(
        location.lat,
        location.lng,
        2 // 2km radius
      );
      setNearbyVehicles(nearby.slice(0, 6)); // Show max 6 vehicles
    }
  }, [location, canRent, cityInfo]);

  // Mock user passes (replace with real contract call)
  useEffect(() => {
    if (isConnected && address) {
      // TODO: Replace with real contract call to get user's rental passes
      setUserPasses([]);
    }
  }, [isConnected, address]);

  const handleRentVehicle = (vehicle: VehicleOption) => {
    setSelectedVehicle(vehicle);

    if (!isConnected) {
      // Will trigger wallet connection
      return;
    }

    // Check if user has valid pass for this vehicle type
    const hasValidPass = userPasses.some(
      (pass) =>
        pass.vehicleType === vehicle.type &&
        pass.cityId === cityInfo?.cityName &&
        pass.isValid
    );

    if (!hasValidPass) {
      setShowPurchaseModal(true);
    } else {
      // User has valid pass, show code generation
      handleGenerateCode(vehicle);
    }
  };

  const handleGenerateCode = (vehicle: VehicleOption) => {
    // TODO: Implement code generation flow
    console.log("Generate code for", vehicle.type);
  };

  const getCurrentCity = () => {
    if (!cityInfo || !canRent || !cityInfo.cityName) return null;
    return EUROPEAN_CITIES.find((city) => city.id === cityInfo.cityName);
  };

  const currentCity = getCurrentCity();

  if (geoLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section - Rental First */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Rent Electric Vehicles
            <span className="block text-moove-primary">Powered by NFTs</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Access premium electric vehicles across {EUROPEAN_CITIES.length}{" "}
            European cities. Own your mobility pass as an NFT and unlock
            sustainable transportation.
          </p>

          {/* Location Status */}
          <LocationStatusBanner
            cityInfo={cityInfo}
            canRent={canRent}
            currentCity={currentCity}
            geoError={geoError}
          />
        </div>
      </section>

      {/* Available Vehicles Section */}
      {canRent && currentCity && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Available in {currentCity.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Choose your vehicle type and get instant access
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {VEHICLE_OPTIONS.map((vehicle) => (
                <VehicleCard
                  key={vehicle.type}
                  vehicle={vehicle}
                  onSelect={() => handleRentVehicle(vehicle)}
                  isSelected={selectedVehicle?.type === vehicle.type}
                  userHasPass={userPasses.some(
                    (pass) =>
                      pass.vehicleType === vehicle.type &&
                      pass.cityId === currentCity.id
                  )}
                />
              ))}
            </div>

            {/* Nearby Vehicles Preview */}
            {nearbyVehicles.length > 0 && (
              <NearbyVehiclesSection vehicles={nearbyVehicles} />
            )}
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How Moove Works
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Simple steps to start your sustainable journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <HowItWorksStep
              step="1"
              title="Choose Vehicle"
              description="Select the type of vehicle you want to access"
              icon="🚲"
            />
            <HowItWorksStep
              step="2"
              title="Buy NFT Pass"
              description="Purchase your 30-day access pass as an NFT"
              icon="🎨"
            />
            <HowItWorksStep
              step="3"
              title="Generate Code"
              description="Get temporary access codes when you need to ride"
              icon="🔐"
            />
            <HowItWorksStep
              step="4"
              title="Unlock & Ride"
              description="Use your code with any partner vehicle in the city"
              icon="✨"
            />
          </div>
        </div>
      </section>

      {/* User Dashboard (if connected and has passes) */}
      {isConnected && userPasses.length > 0 && (
        <UserDashboardSection passes={userPasses} />
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedVehicle && (
        <PurchaseModal
          vehicle={selectedVehicle}
          city={currentCity}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={() => {
            // TODO: Implement NFT purchase
            setShowPurchaseModal(false);
          }}
        />
      )}
    </div>
  );
}

// Location Status Banner Component
function LocationStatusBanner({
  cityInfo,
  canRent,
  currentCity,
  geoError,
}: any) {
  if (geoError) {
    return (
      <div className="inline-flex items-center bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-6 py-3 rounded-full text-lg font-medium mb-8">
        <span className="text-2xl mr-3">❌</span>
        Location access required - Please enable location services
      </div>
    );
  }

  if (canRent && currentCity) {
    return (
      <div className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-6 py-3 rounded-full text-lg font-medium mb-8">
        <span className="text-2xl mr-3">📍</span>
        Service available in {currentCity.name}
        <span className="ml-3 bg-green-200 dark:bg-green-800 px-3 py-1 rounded-full text-sm">
          {currentCity.allowedVehicles.length} vehicle types
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-6 py-3 rounded-full text-lg font-medium mb-8">
      <span className="text-2xl mr-3">🌍</span>
      Currently available in {EUROPEAN_CITIES.length} European cities
      {cityInfo?.distance && (
        <span className="ml-3 bg-yellow-200 dark:bg-yellow-800 px-3 py-1 rounded-full text-sm">
          {cityInfo.distance.toFixed(1)} km to nearest city
        </span>
      )}
    </div>
  );
}

// Vehicle Card Component
function VehicleCard({ vehicle, onSelect, isSelected, userHasPass }: any) {
  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
        isSelected
          ? "border-moove-primary ring-4 ring-moove-primary/20"
          : "border-gray-200 dark:border-gray-700 hover:border-moove-primary/50"
      }`}
      onClick={onSelect}
    >
      {/* Vehicle icon and status */}
      <div className="text-center mb-4">
        <div className="text-6xl mb-3">{vehicle.icon}</div>
        {userHasPass && (
          <div className="absolute top-4 right-4">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              ✓ Owned
            </span>
          </div>
        )}
      </div>

      {/* Vehicle info */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {vehicle.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
          {vehicle.description}
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm">
          Range: {vehicle.range}
        </p>
      </div>

      {/* Features */}
      <div className="mb-6">
        <ul className="space-y-2">
          {vehicle.features.map((feature: string, index: number) => (
            <li
              key={index}
              className="flex items-center text-sm text-gray-600 dark:text-gray-300"
            >
              <span className="text-green-500 mr-2">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Pricing and CTA */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-moove-primary">
              {vehicle.price}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {vehicle.priceEth}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
            30 days access
          </div>
        </div>

        <button className="w-full bg-moove-primary hover:bg-moove-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
          {userHasPass ? "Generate Code" : "Get Access Pass"}
        </button>
      </div>
    </div>
  );
}

// Nearby Vehicles Section
function NearbyVehiclesSection({ vehicles }: { vehicles: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🗺️ Vehicles Near You
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          {vehicles.length} vehicles available within 2km
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.vehicleId}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {vehicle.vehicleType === "bike"
                    ? "🚲"
                    : vehicle.vehicleType === "scooter"
                    ? "🛴"
                    : "🛵"}
                </span>
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
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          💡 Get a Moove Pass to unlock any compatible vehicle instantly
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
          View on Map
        </button>
      </div>
    </div>
  );
}

// How It Works Step Component
function HowItWorksStep({ step, title, description, icon }: any) {
  return (
    <div className="text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 bg-moove-primary rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
          {step}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

// User Dashboard Section
function UserDashboardSection({ passes }: { passes: any[] }) {
  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your Moove Passes
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your vehicle access passes and generate rental codes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passes.map((pass, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">
                  {pass.vehicleType === "bike"
                    ? "🚲"
                    : pass.vehicleType === "scooter"
                    ? "🛴"
                    : "🛵"}
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    pass.isValid
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {pass.isValid ? "Active" : "Expired"}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {pass.vehicleType.charAt(0).toUpperCase() +
                  pass.vehicleType.slice(1)}{" "}
                Pass
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Valid in {pass.cityId} until{" "}
                {new Date(pass.validUntil).toLocaleDateString()}
              </p>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span>Codes used</span>
                  <span>{pass.codesGenerated}</span>
                </div>

                <button
                  className="w-full bg-moove-primary hover:bg-moove-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!pass.isValid}
                >
                  Generate Access Code
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Purchase Modal Component
function PurchaseModal({ vehicle, city, onClose, onPurchase }: any) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual NFT purchase logic
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate transaction
      onPurchase();
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{vehicle.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Get {vehicle.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            30-day access pass for {city?.name}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              What you get:
            </h3>
            <ul className="space-y-2">
              {vehicle.features.map((feature: string, index: number) => (
                <li
                  key={index}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-300"
                >
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white font-medium">
                Total
              </span>
              <div className="text-right">
                <div className="text-xl font-bold text-moove-primary">
                  {vehicle.price}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {vehicle.priceEth}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="flex-1 bg-moove-primary hover:bg-moove-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Purchasing...
              </span>
            ) : (
              "Purchase NFT Pass"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading Screen Component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-moove-primary border-t-transparent mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Finding your location...
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          We're checking if Moove is available in your area
        </p>
      </div>
    </div>
  );
}
