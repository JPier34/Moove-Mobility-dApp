"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useRentalPassContract } from "@/hooks/useRentalPassContract";

// ============= TYPES =============
interface BookingDetails {
  vehicleType: "bike" | "scooter" | "monopattino";
  duration: number;
  price: number;
  priceETH: string;
  cityId: string;
  features: string[];
}

interface BookingStep {
  id: number;
  title: string;
  completed: boolean;
  active: boolean;
}

// ============= DATA =============
const VEHICLE_CONFIG = {
  bike: {
    name: "E-Bike Pass",
    icon: "🚲",
    price: 25,
    priceETH: "0.025",
    gradient: "from-green-400 to-emerald-600",
    features: [
      "30 days unlimited rides",
      "All partner bike networks",
      "Priority support",
      "City-wide coverage",
    ],
  },
  scooter: {
    name: "E-Scooter Pass",
    icon: "🛴",
    price: 35,
    priceETH: "0.035",
    gradient: "from-blue-400 to-indigo-600",
    features: [
      "30 days unlimited rides",
      "Premium scooter fleet",
      "Fast unlock speeds",
      "Extended range vehicles",
    ],
  },
  monopattino: {
    name: "Monopattino Pass",
    icon: "🛵",
    price: 45,
    priceETH: "0.045",
    gradient: "from-purple-400 to-pink-600",
    features: [
      "30 days unlimited rides",
      "Exclusive vehicle access",
      "VIP customer support",
      "Premium parking spots",
    ],
  },
};

// ============= COMPONENTS =============

function BookingSteps({ steps }: { steps: BookingStep[] }) {
  return (
    <div className="flex items-center justify-center mb-12">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <motion.div
            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold text-sm transition-all duration-300 ${
              step.completed
                ? "bg-green-500 border-green-500 text-white"
                : step.active
                ? "bg-blue-500 border-blue-500 text-white"
                : "bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600"
            }`}
            whileHover={{ scale: 1.1 }}
            animate={
              step.active
                ? {
                    boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.15)",
                  }
                : {}
            }
          >
            {step.completed ? "✓" : step.id}
          </motion.div>

          <div className="ml-3 mr-6">
            <div
              className={`text-sm font-medium ${
                step.active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {step.title}
            </div>
          </div>

          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-4 transition-all duration-300 ${
                step.completed ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function VehicleDetails({
  config,
  vehicleType,
}: {
  config: any;
  vehicleType: string;
}) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center mb-6">
        <motion.div
          className="text-6xl mr-6"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {config.icon}
        </motion.div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {config.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            30-day unlimited access pass
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Features Included:
          </h4>
          <div className="space-y-2">
            {config.features.map((feature: string, index: number) => (
              <motion.div
                key={index}
                className="flex items-center text-gray-600 dark:text-gray-300"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="text-green-500 mr-3">✓</span>
                {feature}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Price Breakdown:
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">
                Base Price:
              </span>
              <span className="font-medium">€{config.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">
                Network Fee:
              </span>
              <span className="font-medium">€0.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">
                Service Fee:
              </span>
              <span className="font-medium">€1.50</span>
            </div>
            <hr className="my-3 border-gray-200 dark:border-gray-600" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <div className="text-right">
                <div>€{config.price + 2}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ≈ {config.priceETH} ETH
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PaymentSection({
  onPurchase,
  isLoading,
}: {
  onPurchase: () => void;
  isLoading: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "card">(
    "crypto"
  );

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Pay with your crypto!
      </h3>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <motion.button
          onClick={() => setPaymentMethod("crypto")}
          className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
            paymentMethod === "crypto"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🔐</div>
            <div className="font-semibold">Crypto Wallet</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              MetaMask, WalletConnect
            </div>
          </div>
        </motion.button>
      </div>

      {/* Payment Form */}
      <AnimatePresence mode="wait">
        {paymentMethod === "crypto" ? (
          <motion.div
            key="crypto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <span className="text-blue-500 mr-2">ℹ️</span>
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Wallet Connection Required
                </span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Connect your crypto wallet to purchase this NFT pass. The
                transaction will be processed on the blockchain.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Card Number"
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              />
              <input
                type="text"
                placeholder="MM/YY"
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
              />
            </div>
            <input
              type="text"
              placeholder="Cardholder Name"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Button */}
      <motion.button
        onClick={onPurchase}
        disabled={isLoading}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-lg text-white transition-all duration-300 mt-8 ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl"
        }`}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <motion.div
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Processing Transaction...
          </div>
        ) : (
          `Purchase NFT Pass - €${paymentMethod === "crypto" ? "25" : "27"}`
        )}
      </motion.button>
    </motion.div>
  );
}

// ============= MAIN COMPONENT =============
export default function BookingPage() {
  const router = useRouter();
  const params = useParams();

  if (!params) return null;

  const vehicleType = params.vehicleType as string;

  // const { mintPass, isLoading, error } = useRentalPassContract();
  const [isLoading, setIsLoading] = useState(false);

  const [steps, setSteps] = useState<BookingStep[]>([
    { id: 1, title: "Vehicle Selection", completed: true, active: false },
    { id: 2, title: "Payment", completed: false, active: true },
    { id: 3, title: "Confirmation", completed: false, active: false },
  ]);

  const config = VEHICLE_CONFIG[vehicleType as keyof typeof VEHICLE_CONFIG];

  if (!config) {
    return <div>Vehicle type not found</div>;
  }

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Here you would call the actual contract
      // const result = await mintPass(vehicleType, cityId);

      // Update steps
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          completed: step.id <= 2,
          active: step.id === 3,
        }))
      );

      // Navigate to success page
      setTimeout(() => {
        router.push(`/success/${vehicleType}-${Date.now()}`);
      }, 1000);
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <BookingSteps steps={steps} />

        <VehicleDetails config={config} vehicleType={vehicleType} />

        <PaymentSection onPurchase={handlePurchase} isLoading={isLoading} />
      </div>
    </div>
  );
}
