"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============= TYPES =============
interface VehiclePass {
  type: "bike" | "scooter" | "monopattino";
  name: string;
  icon: string;
  price?: number; // in EUR
  priceETH: string;
  duration: number; // days
  description: string;
  features: string[];
  availability: number; // available passes
  gradient: string;
}

// ============= DATA =============
const RENTAL_PASSES: VehiclePass[] = [
  {
    type: "bike",
    name: "E-Bike Pass",
    icon: "🚲",
    price: 25,
    priceETH: "0.025",
    duration: 30,
    description: "Unlimited access to all partner e-bikes in your city",
    features: [
      "30 days unlimited rides",
      "All partner bike networks",
      "Priority support",
      "City-wide coverage",
    ],
    availability: 150,
    gradient: "from-green-400 to-emerald-600",
  },
  {
    type: "scooter",
    name: "E-Scooter Pass",
    icon: "🛴",
    price: 35,
    priceETH: "0.035",
    duration: 30,
    description: "Fast and convenient access to premium e-scooters",
    features: [
      "30 days unlimited rides",
      "Premium scooter fleet",
      "Fast unlock speeds",
      "Extended range vehicles",
    ],
    availability: 89,
    gradient: "from-blue-400 to-indigo-600",
  },
  {
    type: "monopattino",
    name: "Monopattino Pass",
    icon: "🛵",
    price: 45,
    priceETH: "0.045",
    duration: 30,
    description: "Premium urban mobility with exclusive access",
    features: [
      "30 days unlimited rides",
      "Exclusive vehicle access",
      "VIP customer support",
      "Premium parking spots",
    ],
    availability: 67,
    gradient: "from-purple-400 to-pink-600",
  },
];

// ============= COMPONENTS =============

function VehiclePassCard({
  pass,
  onSelect,
}: {
  pass: VehiclePass;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer"
      onClick={onSelect}
    >
      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${pass.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      {/* Availability Badge */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            pass.availability > 100
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : pass.availability > 50
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
          whileHover={{ scale: 1.1 }}
        >
          {pass.availability} available
        </motion.div>
      </div>

      {/* Vehicle Icon Section */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
        <motion.div
          className="text-8xl group-hover:scale-110 transition-transform duration-500"
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
        >
          {pass.icon}
        </motion.div>

        {/* Price Badge */}
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 bg-gradient-to-r ${pass.gradient} text-white shadow-lg hover:shadow-xl`}
        >
          Purchase Access Pass
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

function MarketplaceHeader() {
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

      {/* Quick Stats */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          20+ European Cities
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          2,500+ Vehicles
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
          Blockchain Secured
        </span>
      </div>
    </motion.div>
  );
}

// ============= MAIN COMPONENT =============
export default function VehicleMarketplace() {
  const router = useRouter();

  const handleSelectVehicle = (vehicleType: string) => {
    router.push(`/book/${vehicleType}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <MarketplaceHeader />

        {/* Vehicle Pass Grid */}
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
          {RENTAL_PASSES.map((pass) => (
            <VehiclePassCard
              key={pass.type}
              pass={pass}
              onSelect={() => handleSelectVehicle(pass.type)}
            />
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Need help choosing? Our smart recommendations are based on your
            location and riding patterns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vehicle-finder">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 border-2 border-green-500 text-green-600 dark:text-green-400 font-semibold py-3 px-8 rounded-full hover:bg-green-50 dark:hover:bg-gray-700 transition-all duration-300"
              >
                🎯 Find My Perfect Vehicle
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
      </div>
    </div>
  );
}
