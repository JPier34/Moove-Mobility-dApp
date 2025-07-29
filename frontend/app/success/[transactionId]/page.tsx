"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// ============= TYPES =============
interface TransactionDetails {
  id: string;
  vehicleType: "bike" | "scooter" | "monopattino";
  tokenId: string;
  transactionHash: string;
  purchaseDate: Date;
  expiryDate: Date;
  price: number;
  cityId: string;
  status: "confirmed" | "pending" | "failed";
}

interface AccessCode {
  code: string;
  expiresAt: Date;
  used: boolean;
}

// ============= DATA =============
const VEHICLE_CONFIG = {
  bike: {
    name: "E-Bike Pass",
    icon: "🚲",
    gradient: "from-green-400 to-emerald-600",
    color: "green",
  },
  scooter: {
    name: "E-Scooter Pass",
    icon: "🛴",
    gradient: "from-blue-400 to-indigo-600",
    color: "blue",
  },
  monopattino: {
    name: "Monopattino Pass",
    icon: "🛵",
    gradient: "from-purple-400 to-pink-600",
    color: "purple",
  },
};

// ============= COMPONENTS =============

function SuccessAnimation() {
  return (
    <motion.div
      className="text-center mb-12"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2,
      }}
    >
      <motion.div
        className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6 shadow-2xl"
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <motion.span
          className="text-6xl"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          ✅
        </motion.span>
      </motion.div>

      <motion.h1
        className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Purchase Successful! 🎉
      </motion.h1>

      <motion.p
        className="text-xl text-gray-600 dark:text-gray-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        Your NFT rental pass has been minted and is ready to use
      </motion.p>
    </motion.div>
  );
}

function TransactionCard({ transaction }: { transaction: TransactionDetails }) {
  const config = VEHICLE_CONFIG[transaction.vehicleType];

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <motion.div
            className="text-6xl mr-6"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {config.icon}
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {config.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Token ID: #{transaction.tokenId}
            </p>
          </div>
        </div>

        <motion.div
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            transaction.status === "confirmed"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          }`}
          whileHover={{ scale: 1.05 }}
        >
          {transaction.status === "confirmed" ? "✅ Confirmed" : "⏳ Pending"}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Purchase Date
            </h4>
            <p className="text-gray-900 dark:text-white">
              {transaction.purchaseDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Valid Until
            </h4>
            <p className="text-gray-900 dark:text-white">
              {transaction.expiryDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Transaction Hash
            </h4>
            <div className="flex items-center">
              <p className="text-gray-900 dark:text-white font-mono text-sm">
                {transaction.transactionHash.substring(0, 10)}...
                {transaction.transactionHash.substring(56)}
              </p>
              <motion.button
                className="ml-2 text-blue-500 hover:text-blue-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() =>
                  navigator.clipboard.writeText(transaction.transactionHash)
                }
              >
                📋
              </motion.button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total Paid
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              €{transaction.price}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AccessCodeGenerator({ vehicleType }: { vehicleType: string }) {
  const [accessCode, setAccessCode] = useState<AccessCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCode = async () => {
    setIsGenerating(true);

    // Simulate API call to generate access code
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newCode: AccessCode = {
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      used: false,
    };

    setAccessCode(newCode);
    setIsGenerating(false);
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-8 mb-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
    >
      <div className="text-center mb-8">
        <motion.div
          className="text-4xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔐
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Generate Access Code
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Create a temporary code to unlock any compatible vehicle
        </p>
      </div>

      {!accessCode ? (
        <motion.button
          onClick={generateCode}
          disabled={isGenerating}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg text-white transition-all duration-300 ${
            isGenerating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
          }`}
          whileHover={!isGenerating ? { scale: 1.02 } : {}}
          whileTap={!isGenerating ? { scale: 0.98 } : {}}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Generating Code...
            </div>
          ) : (
            "Generate Access Code"
          )}
        </motion.button>
      ) : (
        <motion.div
          className="text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-lg">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Your Access Code
            </h4>
            <motion.div
              className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2 tracking-wider"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              {accessCode.code}
            </motion.div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Expires at {accessCode.expiresAt.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex gap-4">
            <motion.button
              onClick={() => navigator.clipboard.writeText(accessCode.code)}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              📋 Copy Code
            </motion.button>
            <motion.button
              onClick={() => setAccessCode(null)}
              className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🔄 Generate New
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function ActionButtons() {
  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4 justify-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.2 }}
    >
      <Link href="/my-collection">
        <motion.button
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="flex items-center">
            📚 View My Collection
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

      <Link href="/marketplace">
        <motion.button
          className="bg-white dark:bg-gray-800 border-2 border-green-500 text-green-600 dark:text-green-400 font-semibold py-4 px-8 rounded-2xl hover:bg-green-50 dark:hover:bg-gray-700 transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          🛒 Buy Another Pass
        </motion.button>
      </Link>

      <Link href="/vehicle-finder">
        <motion.button
          className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-4 px-8 rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          🗺️ Find Vehicles
        </motion.button>
      </Link>
    </motion.div>
  );
}

// ============= MAIN COMPONENT =============
export default function SuccessPage() {
  const params = useParams();

  const transactionId = params?.transactionId as string;

  // Parse transaction details from ID (in real app, fetch from API/blockchain)
  const [vehicleType] = transactionId.split("-");

  const mockTransaction: TransactionDetails = {
    id: transactionId,
    vehicleType: vehicleType as "bike" | "scooter" | "monopattino",
    tokenId: Math.floor(Math.random() * 10000).toString(),
    transactionHash: "0x" + Math.random().toString(16).substring(2, 66),
    purchaseDate: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    price: vehicleType === "bike" ? 27 : vehicleType === "scooter" ? 37 : 47,
    cityId: "rome",
    status: "confirmed",
  };

  // Confetti effect on mount
  useEffect(() => {
    // Here you could add a confetti library like react-confetti
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <SuccessAnimation />

        <TransactionCard transaction={mockTransaction} />

        <AccessCodeGenerator vehicleType={vehicleType} />

        <ActionButtons />

        {/* Success Tips */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              💡 Quick Tips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <span className="mr-2">🔐</span>
                Generate codes only when needed
              </div>
              <div className="flex items-center">
                <span className="mr-2">⏰</span>
                Codes expire in 15 minutes
              </div>
              <div className="flex items-center">
                <span className="mr-2">📱</span>
                Save this page for quick access
              </div>
              <div className="flex items-center">
                <span className="mr-2">🌍</span>
                Valid in all partner cities
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
