"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRentalPassContract } from "@/hooks/useRentalPassContract";
import { VehicleType } from "@/types/nft";
import { useLocationAndCity } from "@/hooks/useLocationAndCity";
import { EUROPEAN_CITIES } from "@/config/cities";

// ============= TYPES =============
interface VehiclePassDisplay {
  type: VehicleType;
  typeString: string;
  name: string;
  icon: string;
  priceETH: string;
  duration: number;
  description: string;
  features: string[];
  availability: number;
  gradient: string;
  priceWei: bigint;
}

// ============= COMPONENTS =============

function EnhancedLocationStatusHeader({
  locationState,
  onRefreshLocation,
  onSetTestLocation,
  onClearLocation,
}: {
  locationState: ReturnType<typeof useLocationAndCity>;
  onRefreshLocation: () => void;
  onSetTestLocation: (
    city: "rome" | "milan" | "paris" | "berlin" | "madrid"
  ) => void;
  onClearLocation: () => void;
}) {
  const {
    currentCity,
    isLoading,
    error,
    canRent,
    locationMethod,
    coordinates,
  } = locationState;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-full text-lg font-medium mb-8"
      >
        <motion.div
          className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-3"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        Detecting your location...
      </motion.div>
    );
  }

  if (error || !canRent) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 mb-8"
        >
          <div className="text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              {error ? "Location Detection Failed" : "Service Not Available"}
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4 text-sm">
              {error ||
                "Your location is outside our service area. Please try a test location."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                onClick={onRefreshLocation}
                className="bg-yellow-600 text-white py-2 px-6 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🔄 Retry Location Access
              </motion.button>

              {process.env.NODE_ENV === "development" && (
                <motion.button
                  onClick={() => onSetTestLocation("rome")}
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🧪 Use Test Location
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  if (canRent && currentCity) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center bg-green-500/10 backdrop-blur-sm border border-green-500/20 text-green-600 dark:text-green-400 px-6 py-3 rounded-full text-lg font-medium mb-8"
      >
        <span className="text-2xl mr-3">📍</span>
        Service available in {currentCity.name}
        <span className="ml-3 bg-green-500/20 px-3 py-1 rounded-full text-sm">
          {locationMethod === "manual"
            ? "Manual"
            : locationMethod === "gps"
            ? "GPS"
            : "None"}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8"
    >
      <div className="text-center">
        <div className="text-4xl mb-3">🌍</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Service Not Available in Your Area
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Moove is currently available in {EUROPEAN_CITIES.length} European
          cities.
          {coordinates && " Your current location is outside our service area."}
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {EUROPEAN_CITIES.slice(0, 6).map((city) => (
            <span
              key={city.id}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
            >
              {city.name}
            </span>
          ))}
          {EUROPEAN_CITIES.length > 6 && (
            <span className="text-gray-500 dark:text-gray-400 px-3 py-1 text-sm">
              +{EUROPEAN_CITIES.length - 6} more
            </span>
          )}
        </div>

        {coordinates && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Current coordinates: {coordinates.lat.toFixed(4)},{" "}
            {coordinates.lng.toFixed(4)}
          </div>
        )}

        {process.env.NODE_ENV === "development" && (
          <motion.button
            onClick={() => onSetTestLocation("rome")}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🧪 Use Rome for Testing
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ============= MAIN COMPONENT =============
export default function EnhancedMarketplacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected } = useAccount();

  // Persistence hook
  const locationHook = useLocationAndCity();

  // Smart contract integration
  const {
    isLoading,
    isLoadingVehicles,
    error,
    availableVehicles,
    userHasPass,
    formatPrice,
    vehicleTypeToString,
    getVehicleConfig,
    refetchVehicles,
    VehicleType,
  } = useRentalPassContract();

  // Pre-selected vehicle from URL params
  const preSelectedVehicle = searchParams?.get("vehicle") ?? null;

  // Convert contract data to UI format (ETH only)
  const vehicleOptions: VehiclePassDisplay[] = React.useMemo(() => {
    return availableVehicles.map((vehicle) => {
      const config = getVehicleConfig(vehicle.vehicleType);
      const priceETH = formatPrice(vehicle.priceWei);
      const typeString = vehicleTypeToString(vehicle.vehicleType);

      return {
        type: vehicle.vehicleType,
        typeString,
        name: config.name,
        icon: config.icon,
        description: config.description,
        features: config.features,
        gradient: config.gradient,
        priceETH,
        priceWei: vehicle.priceWei,
        duration: 30,
        availability: Number(vehicle.available),
      };
    });
  }, [availableVehicles, formatPrice, vehicleTypeToString, getVehicleConfig]);

  const handleSelectVehicle = (vehicleType: VehicleType) => {
    if (!isConnected || !locationHook.canRent) {
      return;
    }

    const typeString = vehicleTypeToString(vehicleType);
    router.push(`/book/${typeString}?city=${locationHook.currentCity?.id}`);
  };

  const handleRetry = () => {
    refetchVehicles();
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refetchVehicles();
    }, 360000);

    return () => clearInterval(interval);
  }, [isConnected, refetchVehicles]);

  // Scroll to pre-selected vehicle
  useEffect(() => {
    if (preSelectedVehicle && vehicleOptions.length > 0) {
      const element = document.getElementById(`vehicle-${preSelectedVehicle}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [preSelectedVehicle, vehicleOptions.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header con location status migliorato */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Moove
            </span>{" "}
            Marketplace
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Get unlimited access to premium urban mobility. Choose your vehicle
            type and start your sustainable journey today.
          </p>

          <EnhancedLocationStatusHeader
            locationState={locationHook}
            onRefreshLocation={locationHook.refreshLocation}
            onSetTestLocation={locationHook.setTestLocation}
            onClearLocation={locationHook.clearLocation}
          />

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Blockchain Secured NFTs
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Instant Access Codes
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              30-Day Unlimited Access
            </span>
          </div>
        </motion.div>

        {/* Wallet Connection Check */}
        {!isConnected ? (
          <ConnectWalletPrompt />
        ) : (
          <>
            {/* Loading State */}
            {isLoadingVehicles && <LoadingSpinner />}

            {/* Error State */}
            {error && !isLoadingVehicles && (
              <ErrorState error={error.message} onRetry={handleRetry} />
            )}

            {/* Vehicle Pass Grid */}
            {!isLoadingVehicles && !error && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.2 },
                  },
                }}
                initial="hidden"
                animate="show"
              >
                {vehicleOptions.map((pass) => (
                  <div
                    key={pass.type}
                    id={`vehicle-${pass.typeString}`}
                    className={
                      preSelectedVehicle === pass.typeString
                        ? "ring-4 ring-blue-500 ring-opacity-50 rounded-3xl"
                        : ""
                    }
                  >
                    <VehiclePassCard
                      pass={pass}
                      onSelect={() => handleSelectVehicle(pass.type)}
                      userHasPass={userHasPass(pass.type)}
                      isLoading={isLoading}
                      isLocationRequired={!locationHook.canRent}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </>
        )}

        {/* Bottom CTA - Enhanced for location awareness */}
        {isConnected && !isLoadingVehicles && !error && (
          <motion.div
            className="text-center mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-gray-700/20">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                💡 How It Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-2">🗺️</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Location-Based
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Access codes are tied to your current city
                  </div>
                </div>
                <div>
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Instant Purchase
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Pay in ETH, receive NFT pass immediately
                  </div>
                </div>
                <div>
                  <div className="text-3xl mb-2">🔐</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Secure Access
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Generate temporary codes when you need them
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              {locationHook.canRent ? (
                <>
                  <Link href="/vehicle-finder">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white dark:bg-gray-800 border-2 border-green-500 text-green-600 dark:text-green-400 font-semibold py-3 px-8 rounded-full hover:bg-green-50 dark:hover:bg-gray-700 transition-all duration-300"
                    >
                      🎯 Find Vehicles Near Me
                    </motion.button>
                  </Link>
                  <Link href="/my-collection">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-8 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
                    >
                      📚 View My Collection
                    </motion.button>
                  </Link>
                </>
              ) : (
                <motion.button
                  onClick={locationHook.refreshLocation}
                  className="bg-blue-500 text-white font-semibold py-3 px-8 rounded-full hover:bg-blue-600 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  📍 Enable Location to Purchase
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Real-time Updates Indicator */}
        {isConnected && locationHook.canRent && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-lg flex items-center text-sm"
              animate={{
                y: [0, -5, 0],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full mr-2"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-gray-600 dark:text-gray-300">
                Live prices • {locationHook.currentCity?.name} (
                {locationHook.locationMethod})
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============= COMPONENTS =============

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <span className="ml-3 text-gray-600 dark:text-gray-300">
        Loading marketplace...
      </span>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
        Failed to Load Marketplace
      </h3>
      <p className="text-red-600 dark:text-red-300 mb-6 max-w-md mx-auto">
        {error}
      </p>
      <motion.button
        onClick={onRetry}
        className="bg-red-500 text-white py-3 px-6 rounded-xl hover:bg-red-600 transition-colors font-semibold"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Try Again
      </motion.button>
    </motion.div>
  );
}

function ConnectWalletPrompt() {
  return (
    <motion.div
      className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="text-8xl mb-6"
        animate={{
          scale: [1, 1.04, 1],
          rotate: [0, -5, 5, 0],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🔐
      </motion.div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Connect Your Wallet
      </h3>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
        Connect your crypto wallet to purchase NFT rental passes and access our
        vehicle network
      </p>
      <div className="flex justify-center">
        <ConnectButton.Custom>
          {({ openConnectModal, connectModalOpen, mounted }) => (
            <motion.button
              onClick={openConnectModal}
              disabled={!mounted || connectModalOpen}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center">
                🔗 Connect Wallet
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </motion.button>
          )}
        </ConnectButton.Custom>
      </div>
    </motion.div>
  );
}

function VehiclePassCard({
  pass,
  onSelect,
  userHasPass,
  isLoading,
  isLocationRequired,
}: {
  pass: VehiclePassDisplay;
  onSelect: () => void;
  userHasPass: boolean;
  isLoading: boolean;
  isLocationRequired: boolean;
}) {
  const isDisabled = isLoading || isLocationRequired;

  const formatAvailability = (count: number): string => {
    if (count > 100) return "100+";
    if (count > 50) return `${count}`;
    if (count > 10) return `${count}`;
    return `${count} left!`;
  };

  const getAvailabilityColor = (count: number): string => {
    if (count > 100)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (count > 50)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={!isDisabled ? { y: -10, scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 300 }}
      className={`group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden ${
        isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={!isDisabled ? onSelect : undefined}
    >
      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${pass.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      {/* Location Required Overlay */}
      {isLocationRequired && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-20 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl text-center">
            <div className="text-2xl mb-2">📍</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Location Required
            </div>
          </div>
        </div>
      )}

      {/* Availability Badge */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div
          className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(
            pass.availability
          )}`}
          whileHover={!isDisabled ? { scale: 1.1 } : {}}
          animate={
            pass.availability < 20
              ? {
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.8, 1],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          {formatAvailability(pass.availability)}
        </motion.div>
      </div>

      {/* User Has Pass Badge */}
      {userHasPass && (
        <div className="absolute top-4 left-4 z-10">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
          >
            ✓ Owned
          </motion.span>
        </div>
      )}

      {/* Vehicle Icon Section */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
        <motion.div
          className="text-8xl group-hover:scale-110 transition-transform duration-500"
          whileHover={!isDisabled ? { rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          {pass.icon}
        </motion.div>

        {/* ETH Price Badge - Updated Design */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-gray-200/50">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {pass.priceETH}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {pass.duration} days
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
            {pass.name}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            Unlimited
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          {pass.description}
        </p>

        {/* Features List */}
        <div className="space-y-3 mb-8">
          {pass.features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center text-sm text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.span
                className="text-green-500 mr-3 text-lg"
                whileHover={!isDisabled ? { scale: 1.2 } : {}}
              >
                ✓
              </motion.span>
              {feature}
            </motion.div>
          ))}
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={!isDisabled ? { scale: 1.02 } : {}}
          whileTap={!isDisabled ? { scale: 0.98 } : {}}
          disabled={isDisabled}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
            isDisabled
              ? "bg-gray-400 cursor-not-allowed text-white"
              : userHasPass
              ? "bg-green-500 hover:bg-green-600 text-white"
              : `bg-gradient-to-r ${pass.gradient} text-white shadow-lg hover:shadow-xl`
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Loading...
            </div>
          ) : isLocationRequired ? (
            "📍 Location Required"
          ) : userHasPass ? (
            "Generate Access Code"
          ) : (
            "Purchase Access Pass"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
