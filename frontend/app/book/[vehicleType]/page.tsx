"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { CurrencyConverter } from "@/utils/currencyConverter";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRentalPassContract } from "@/hooks/useRentalPassContract";
import { VehicleType } from "@/types/nft";

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

interface PriceBreakdownProps {
  config: {
    priceETH: string;
    networkFee: string;
    serviceFee: string;
  };
}

interface PaymentSectionProps {
  onPurchase: () => void;
  isLoading: boolean;
  totalETH: string;
  walletAddress?: string | null;
  isWalletConnected: boolean;
  networkName?: string;
  estimatedGasFee?: string;
}

// ============= DATA =============
const VEHICLE_CONFIG = {
  bike: {
    name: "E-Bike Pass",
    icon: "🚲",
    price: 18,
    priceETH: "0.00000075",
    networkFee: "0.000021",
    serviceFee: "0.0000004",
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
    price: 28,
    priceETH: "0.00000117",
    networkFee: "0.000021",
    serviceFee: "0.0000006",
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
    price: 42,
    priceETH: "0.00000175",
    networkFee: "0.000021",
    serviceFee: "0.0000008",
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

          {/* Title (hidden on mobile) */}
          <div className="hidden sm:block ml-3 mr-6">
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

        <PriceBreakdown config={config} />
      </div>
    </motion.div>
  );
}

// ============= Payment Phase =============

function PaymentSection({
  onPurchase,
  isLoading,
  totalETH,
  walletAddress,
  isWalletConnected,
  networkName = "Sepolia Testnet",
  estimatedGasFee,
}: PaymentSectionProps) {
  // Shorten wallet address for display (0x1234...5678)
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="flex items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Purchase with Crypto
        </h3>
        <div className="ml-3 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {networkName}
          </span>
        </div>
      </div>

      {/* Wallet Connection Status */}
      <AnimatePresence mode="wait">
        {!isWalletConnected ? (
          // Show wallet connection prompt when not connected
          <motion.div
            key="wallet-prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Wallet Connection Required */}
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
              <div className="flex items-center mb-2">
                <span className="text-orange-500 mr-2">⚠️</span>
                <span className="font-medium text-orange-800 dark:text-orange-200">
                  Wallet Connection Required
                </span>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                Connect your crypto wallet to purchase this NFT pass. The
                transaction will be processed securely on the blockchain.
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                💡 Click the button below to go to the header and connect your
                wallet
              </p>
            </div>

            {/* Connect Wallet Button */}
            <div className="flex justify-center">
              <ConnectButton.Custom>
                {({ openConnectModal, connectModalOpen }) => (
                  <motion.button
                    onClick={openConnectModal}
                    disabled={connectModalOpen}
                    className="px-8 py-4 rounded-2xl border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🦊</div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        Connect Wallet
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        MetaMask, WalletConnect, Coinbase Wallet
                      </div>
                    </div>
                  </motion.button>
                )}
              </ConnectButton.Custom>
            </div>
          </motion.div>
        ) : (
          // Show connected wallet details and purchase option
          <motion.div
            key="wallet-connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Connected Wallet Display */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Wallet Connected
                  </span>
                </div>
                <span className="text-sm font-mono text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                  {walletAddress ? shortenAddress(walletAddress) : "Connected"}
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300">
                Your wallet is connected and ready for the transaction.
              </p>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                Transaction Summary
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    NFT Pass Price:
                  </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {totalETH} ETH
                  </span>
                </div>

                {estimatedGasFee && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Est. Gas Fee:
                    </span>
                    <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                      ~{estimatedGasFee} ETH
                    </span>
                  </div>
                )}

                <hr className="border-gray-200 dark:border-gray-600" />

                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Total Cost:
                  </span>
                  <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                    {estimatedGasFee
                      ? `~${(
                          parseFloat(totalETH) + parseFloat(estimatedGasFee)
                        ).toFixed(6)} ETH`
                      : `${totalETH} ETH`}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">🔒</span>
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                    Secure Blockchain Transaction
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Your NFT pass will be minted directly to your wallet. This
                    transaction is irreversible once confirmed.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Button */}
      <motion.button
        onClick={onPurchase}
        disabled={isLoading || !isWalletConnected}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-lg text-white transition-all duration-300 mt-8 ${
          isLoading || !isWalletConnected
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl"
        }`}
        whileHover={!isLoading && isWalletConnected ? { scale: 1.02 } : {}}
        whileTap={!isLoading && isWalletConnected ? { scale: 0.98 } : {}}
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
        ) : !isWalletConnected ? (
          <div className="flex items-center justify-center">
            <span className="mr-2">🔒</span>
            Wallet Required
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="mr-2">🚀</span>
            Purchase NFT Pass - {totalETH} ETH
          </div>
        )}
      </motion.button>

      {/* Help Text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {!isWalletConnected
            ? "Connect your wallet above to continue with the purchase. "
            : "Transaction will open in your wallet for confirmation. "}
          <button className="text-blue-500 hover:text-blue-600 underline">
            Learn more
          </button>
        </p>
      </div>
    </motion.div>
  );
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ config }) => {
  const [eurTotal, setEurTotal] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Calculate total ETH
  const totalETH = (
    parseFloat(config.priceETH) +
    parseFloat(config.networkFee) +
    parseFloat(config.serviceFee)
  ).toFixed(6);

  // Convert to EUR when component mounts or totalETH changes
  useEffect(() => {
    const convertToEur = async () => {
      setIsConverting(true);
      try {
        const eurAmount = await CurrencyConverter.convertEthToEur(
          parseFloat(totalETH)
        );
        setEurTotal(eurAmount);
      } catch (error) {
        console.error("EUR conversion failed:", error);
        setEurTotal(null);
      } finally {
        setIsConverting(false);
      }
    };

    convertToEur();
  }, [totalETH]);

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
        Price Breakdown (ETH):
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Base Price:</span>
          <span className="font-medium">{config.priceETH}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Network Fee:</span>
          <span className="font-medium">{config.networkFee}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Service Fee:</span>
          <span className="font-medium">{config.serviceFee}</span>
        </div>
        <hr className="my-3 border-gray-200 dark:border-gray-600" />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <div className="text-right font-bold">
            <div>
              {totalETH} <span>ETH</span>
            </div>
            {/* EUR conversion */}
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
  );
};

// ============= MAIN COMPONENT =============
export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const { address, isConnected } = useAccount();

  if (!params) return null;

  const vehicleType = params.vehicleType as string;

  const {
    mintPass,
    isLoading: contractLoading,
    error,
  } = useRentalPassContract();
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

  // Map vehicle type string to VehicleType enum
  const getVehicleTypeEnum = (type: string): VehicleType => {
    switch (type) {
      case "bike":
        return VehicleType.BIKE;
      case "scooter":
        return VehicleType.SCOOTER;
      case "monopattino":
        return VehicleType.MONOPATTINO;
      default:
        return VehicleType.BIKE;
    }
  };

  const handlePurchase = async () => {
    // Check if contract is configured
    if (!process.env.NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS) {
      alert(
        "Smart contract not configured. Please check your environment variables."
      );
      return;
    }

    if (!mintPass) {
      console.error("Mint function not available");
      alert(
        "Mint function not available. Please check your wallet connection."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Call the actual smart contract
      const result = await mintPass({
        vehicleType: getVehicleTypeEnum(vehicleType),
        cityId: "default-city", // TODO: Get actual city ID from user location
        duration: 30, // 30 days as default
      });

      console.log("NFT Pass minted successfully:", result);

      // Update steps
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          completed: step.id <= 2,
          active: step.id === 3,
        }))
      );

      // Navigate to success page with vehicle type and transaction hash
      setTimeout(() => {
        router.push(`/success/${vehicleType}-${result.txHash}`);
      }, 1000);
    } catch (error) {
      console.error("Purchase failed:", error);
      alert(
        `Purchase failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <BookingSteps steps={steps} />

        <VehicleDetails config={config} vehicleType={vehicleType} />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">❌</span>
              <span className="font-medium text-red-800 dark:text-red-200">
                Contract Error
              </span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {error.message || "An error occurred with the smart contract"}
            </p>
          </div>
        )}

        {/* Contract Configuration Warning */}
        {!process.env.NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS && (
          <div className="bg-yellow-500 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <span className="text-yellow-500 mr-2">⚠️</span>
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Contract Not Configured
              </span>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
              The smart contract address is not configured. Please add
              NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS to your .env.local file.
            </p>
          </div>
        )}

        <PaymentSection
          onPurchase={handlePurchase}
          isLoading={isLoading || contractLoading}
          totalETH={(
            parseFloat(config.priceETH) +
            parseFloat(config.networkFee) +
            parseFloat(config.serviceFee)
          ).toFixed(6)}
          walletAddress={address}
          isWalletConnected={isConnected}
        />
      </div>
    </div>
  );
}
