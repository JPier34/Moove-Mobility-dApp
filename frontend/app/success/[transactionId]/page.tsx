"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CurrencyConverter } from "@/utils/currencyConverter";
import { VEHICLE_OPTIONS } from "@/config/vehicles";

// ============= TYPES =============
interface TransactionDetails {
  id: string;
  vehicleType: "bike" | "scooter" | "monopattino";
  tokenId: string;
  transactionHash: string;
  purchaseDate: Date;
  expiryDate: Date;
  price: number;
  gasFee?: number;
  totalCost?: number;
  cityId: string;
  status: "confirmed" | "pending" | "failed";
  accessCode?: string;
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

function PriceBreakdown({ transaction }: { transaction: TransactionDetails }) {
  const [eurTotal, setEurTotal] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const totalCost =
    transaction.totalCost || transaction.price + (transaction.gasFee || 0);

  // Convert to EUR when component mounts or totalCost changes
  useEffect(() => {
    const convertToEur = async () => {
      setIsConverting(true);
      try {
        const eurAmount = await CurrencyConverter.convertEthToEur(totalCost);
        setEurTotal(eurAmount);
      } catch (error) {
        console.error("EUR conversion failed:", error);
        setEurTotal(null);
      } finally {
        setIsConverting(false);
      }
    };

    convertToEur();
  }, [totalCost]);

  return (
    <motion.div
      className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-6 mb-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
    >
      <div className="text-center mb-6">
        <motion.div
          className="text-4xl mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          💰
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Total costs
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Total cost of the completed transaction
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">NFT Price:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {transaction.price.toFixed(8)} ETH
            </span>
          </div>

          {transaction.gasFee && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Gas Fee:</span>
              <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                {transaction.gasFee.toFixed(8)} ETH
              </span>
            </div>
          )}

          <hr className="border-gray-200 dark:border-gray-600" />

          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900 dark:text-white">
              Total costs:
            </span>
            <div className="text-right">
              <div className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                {totalCost.toFixed(8)} ETH
              </div>
              <div className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                {isConverting ? (
                  <span className="animate-pulse">Converting...</span>
                ) : eurTotal ? (
                  `≈ €${eurTotal.toFixed(2)}`
                ) : (
                  <span className="text-gray-400">EUR unavailable</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TransactionCard({ transaction }: { transaction: TransactionDetails }) {
  const config = VEHICLE_CONFIG[transaction.vehicleType];

  // Handle case where config is undefined
  if (!config) {
    return (
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Vehicle Type
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Vehicle type "{transaction.vehicleType}" not found
          </p>
        </div>
      </motion.div>
    );
  }

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
            {transaction.accessCode && (
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Access Code: {transaction.accessCode}
              </p>
            )}
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
            <div className="flex items-center gap-2">
              <p className="text-gray-900 dark:text-white font-mono text-sm">
                {transaction.transactionHash.substring(0, 10)}...
                {transaction.transactionHash.substring(56)}
              </p>
              <motion.button
                className="text-blue-500 hover:text-blue-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() =>
                  navigator.clipboard.writeText(transaction.transactionHash)
                }
                title="Copy transaction hash"
              >
                📋
              </motion.button>
              <motion.a
                href={`https://sepolia.etherscan.io/tx/${transaction.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="View on Etherscan"
              >
                🔗
              </motion.a>
            </div>
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

    // Generate secure access code using Web Crypto API
    const generateSecureCode = async (): Promise<string> => {
      const entropy = crypto.getRandomValues(new Uint8Array(16));
      const timestamp = Date.now();
      const seedData = `${timestamp}-${entropy.join("")}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(seedData);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = new Uint8Array(hashBuffer);

      // Generate 8-character code from hash (exclude confusing chars)
      const allowedChars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      let code = "";
      for (let i = 0; i < 8; i++) {
        const index = hashArray[i] % allowedChars.length;
        code += allowedChars[index];
      }
      return code;
    };

    const secureCode = await generateSecureCode();
    const newCode: AccessCode = {
      code: secureCode,
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
          Insert in your selected vehicle to unlock it!
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
    </motion.div>
  );
}

// ============= MAIN COMPONENT =============
export default function SuccessPage() {
  const params = useParams();

  const transactionId = params?.transactionId as string;

  // Parse transaction details from ID (in real app, fetch from API/blockchain)
  const [vehicleType, ...hashParts] = transactionId.split("-");
  const transactionHash = hashParts.join("-"); // Rejoin in case hash contains dashes

  // Validate vehicle type
  const validVehicleTypes = ["bike", "scooter", "monopattino"];
  if (!validVehicleTypes.includes(vehicleType)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Invalid Vehicle Type
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Vehicle type "{vehicleType}" is not supported
            </p>
            <Link href="/marketplace">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl">
                Go to Marketplace
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get real transaction data from URL params or localStorage
  const getTransactionData = (): TransactionDetails => {
    // Try to get from localStorage first (set during transaction)
    const storedTx = localStorage.getItem(`tx_${transactionId}`);
    if (storedTx) {
      try {
        const parsed = JSON.parse(storedTx);
        return {
          ...parsed,
          purchaseDate: new Date(parsed.purchaseDate),
          expiryDate: new Date(parsed.expiryDate),
        };
      } catch (e) {
        console.error("Error parsing stored transaction:", e);
      }
    }

    // Get prices from VEHICLE_OPTIONS to match marketplace
    const getPriceFromConfig = (vehicleType: string): number => {
      const vehicleConfig = VEHICLE_OPTIONS.find((v) => v.type === vehicleType);
      if (vehicleConfig) {
        return parseFloat(vehicleConfig.priceEth.replace(" ETH", ""));
      }
      // Fallback prices
      return vehicleType === "bike"
        ? 0.00000075
        : vehicleType === "scooter"
        ? 0.000001
        : 0.00000125;
    };

    // Gas fee from the actual transaction (0.00062246339054298 ETH)
    const gasFee = 0.00062246339054298;
    const nftPrice = getPriceFromConfig(vehicleType);
    const totalCost = nftPrice + gasFee;

    // Access code from the actual transaction (format: 0-0x777382955f33bb8540602e914d9b650c962ef6cc-1756807920)
    const accessCode =
      "0-0x777382955f33bb8540602e914d9b650c962ef6cc-1756807920";

    return {
      id: transactionId,
      vehicleType: vehicleType as "bike" | "scooter" | "monopattino",
      tokenId: "2", // Will be updated with real token ID
      transactionHash:
        transactionHash || "0x" + Math.random().toString(16).substring(2, 66),
      purchaseDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      price: nftPrice,
      gasFee: gasFee,
      totalCost: totalCost,
      cityId: "sanbenedetto", // From the actual transaction
      status: "confirmed",
      accessCode: accessCode, // Add access code from contract
    };
  };

  const mockTransaction = getTransactionData();

  // Confetti effect on mount
  useEffect(() => {
    // Confetti library like react-confetti?
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <SuccessAnimation />

        <TransactionCard transaction={mockTransaction} />

        <PriceBreakdown transaction={mockTransaction} />

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
