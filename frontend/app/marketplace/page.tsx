"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRentalPassContract } from "@/hooks/useRentalPassContract";
import { VehicleType } from "@/types/nft";
import { EUROPEAN_CITIES } from "@/config/cities";

// ============= TYPES =============
interface VehiclePassDisplay {
  type: VehicleType;
  typeString: string;
  name: string;
  icon: string;
  price?: number; // in EUR
  priceETH: string;
  duration: number; // days
  description: string;
  features: string[];
  availability: number;
  gradient: string;
  priceWei: bigint;
}

// ============= UTILS =============
function getCurrentCity() {
  return (
    EUROPEAN_CITIES.find((city) => city.id === "rome") || EUROPEAN_CITIES[0]
  );
}

function formatAvailability(count: number): string {
  if (count > 100) return "100+";
  if (count > 50) return `${count}`;
  if (count > 10) return `${count}`;
  return `${count} left!`;
}

function getAvailabilityColor(count: number): string {
  if (count > 100)
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (count > 50)
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
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

function MarketplaceHeader({ currentCity }: { currentCity: any }) {
  return (
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
        Get unlimited access to premium urban mobility. Choose your vehicle type
        and start your sustainable journey today.
      </p>

      {/* Location Info */}
      <motion.div
        className="inline-flex items-center bg-green-500/10 backdrop-blur-sm border border-green-500/20 text-green-600 dark:text-green-400 px-6 py-3 rounded-full text-lg font-medium mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className="text-2xl mr-3">📍</span>
        Service available in {currentCity.name}
        <span className="ml-3 bg-green-500/20 px-3 py-1 rounded-full text-sm">
          3 vehicle types
        </span>
      </motion.div>

      {/* Quick Stats */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          20+ European Cities
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Blockchain Secured
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
          Instant Access
        </span>
      </div>
    </motion.div>
  );
}

function ConnectWalletPrompt() {
  return (
    <motion.div
      className="text-center py-20 items-center bg-white dark:bg-gray-800 rounded-3xl shadow-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="text-8xl mb-6 block mx-auto"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, -2, 2, 0],
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
}: {
  pass: VehiclePassDisplay;
  onSelect: () => void;
  userHasPass: boolean;
  isLoading: boolean;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer"
      onClick={!isLoading ? onSelect : undefined}
    >
      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${pass.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      {/* Availability Badge */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div
          className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(
            pass.availability
          )}`}
          whileHover={{ scale: 1.1 }}
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
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
        >
          {pass.icon}
        </motion.div>

        {/* Real-time Price Badge */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              €{pass.price}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {pass.priceETH} ETH
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
            {pass.duration} days
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
                whileHover={{ scale: 1.2 }}
              >
                ✓
              </motion.span>
              {feature}
            </motion.div>
          ))}
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={!isLoading ? { scale: 1.02 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
            isLoading
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
          ) : userHasPass ? (
            "Generate Access Code"
          ) : (
            "Purchase Access Pass"
          )}
        </motion.button>
      </div>

      {/* Hover Effect Border */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
          border: "2px solid transparent",
          backgroundClip: "padding-box",
        }}
      />
    </motion.div>
  );
}

// ============= MAIN COMPONENT =============
export default function MarketplacePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [currentCity] = useState(getCurrentCity());

  // Smart contract integration with unified types
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

  // Convert contract data to UI format with proper types
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
        price: Math.round(parseFloat(priceETH) * 1000), // Convert to EUR approximation
        priceETH,
        priceWei: vehicle.priceWei,
        duration: 30,
        availability: Number(vehicle.available),
      };
    });
  }, [availableVehicles, formatPrice, vehicleTypeToString, getVehicleConfig]);

  const handleSelectVehicle = (vehicleType: VehicleType) => {
    if (!isConnected) {
      return;
    }

    const typeString = vehicleTypeToString(vehicleType);
    router.push(`/book/${typeString}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <MarketplaceHeader currentCity={currentCity} />

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
                  <VehiclePassCard
                    key={pass.type}
                    pass={pass}
                    onSelect={() => handleSelectVehicle(pass.type)}
                    userHasPass={userHasPass(pass.type)}
                    isLoading={isLoading}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}

        {/* Bottom CTA - Only show if connected */}
        {isConnected && !isLoadingVehicles && !error && (
          <motion.div
            className="text-center mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-gray-700/20">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                💡 Smart Contract Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-2">🔒</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Blockchain Secured
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Your passes are NFTs stored securely on-chain
                  </div>
                </div>
                <div>
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Instant Access
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Generate access codes instantly when you need them
                  </div>
                </div>
                <div>
                  <div className="text-3xl mb-2">🌍</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Multi-City Support
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Use your passes across all partner cities
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
            </div>
          </motion.div>
        )}

        {/* Real-time Updates Indicator */}
        {isConnected && (
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
                Real-time updates
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
