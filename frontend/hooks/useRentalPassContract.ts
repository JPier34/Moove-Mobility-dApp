import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { toast } from "react-hot-toast";
import { VehicleType, EUROPEAN_CITIES } from "@/config/cities";
import { VEHICLE_OPTIONS } from "@/config/vehicles";

// ============= TYPES =============
export interface RentalPassData {
  tokenId: bigint;
  vehicleType: VehicleType;
  cityId: string;
  duration: bigint;
  price: bigint;
  purchaseDate: bigint;
  expiryDate: bigint;
  isActive: boolean;
  owner: string;
}

export interface AccessCode {
  code: string;
  tokenId: bigint;
  expiresAt: bigint;
  isUsed: boolean;
}

export interface MintPassParams {
  vehicleType: VehicleType;
  cityId: string;
  duration?: number; // default 30 days
}

export interface VehicleAvailability {
  vehicleType: VehicleType;
  available: bigint;
  priceWei: bigint;
  priceGwei: bigint;
  name: string;
  description: string;
  citySpecificAvailability: number;
}

export interface ContractError {
  message: string;
  code?: string;
  data?: any;
}

// ============= CONSTANTS =============
// Convert VEHICLE_OPTIONS to a more accessible format
const VEHICLE_CONFIG_MAP = new Map(
  VEHICLE_OPTIONS.map((option) => [
    option.type,
    {
      name: option.name,
      icon: option.icon,
      description: option.description,
      priceETH: option.priceEth,
      gradient: option.gradient,
      features: option.features,
    },
  ])
);

// Smart Contract ABI (updated for new contract)
const RENTAL_PASS_ABI = [
  {
    inputs: [
      { name: "vehicleType", type: "uint8" },
      { name: "cityId", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    name: "mintRentalPassPublic",
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getRentalPass",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "vehicleType", type: "uint8" },
          { name: "accessCode", type: "string" },
          { name: "expirationDate", type: "uint256" },
          { name: "purchasePrice", type: "uint256" },
          { name: "location", type: "string" },
          { name: "isActive", type: "bool" },
          { name: "originalOwner", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserActivePasses",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "vehicleType", type: "uint8" }],
    name: "getVehiclePrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract address
const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS as `0x${string}`;

// ============= CUSTOM HOOK =============
export function useRentalPassContract() {
  const { address, isConnected } = useAccount();
  const [error, setError] = useState<ContractError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Write contract hook for minting
  const {
    writeContract,
    data: mintTxHash,
    isPending: isMintPending,
    error: mintError,
  } = useWriteContract();

  // ✅ MONITOR TRANSACTION CONFIRMATION
  const { data: receipt, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: mintTxHash,
    });

  // Read user's rental passes
  const {
    data: userPassesData,
    isLoading: isLoadingPasses,
    refetch: refetchPasses,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getUserActivePasses",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
    },
  });

  // Read available vehicle types and availability
  const {
    data: availableVehiclesData,
    isLoading: isLoadingVehicles,
    refetch: refetchVehicles,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getVehiclePrice",
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  // ============= UTILITY FUNCTIONS =============

  /**
   * Convert VehicleType enum to string
   */
  const vehicleTypeToString = (vehicleType: VehicleType): string => {
    return vehicleType;
  };

  /**
   * Convert VehicleType to contract number
   */
  const vehicleTypeToContractNumber = (vehicleType: VehicleType): number => {
    const mapping = {
      bike: 0,
      scooter: 1,
      monopattino: 2,
    };
    return mapping[vehicleType];
  };

  /**
   * Convert string to VehicleType enum
   */
  const stringToVehicleType = (vehicleString: string): VehicleType => {
    switch (vehicleString.toLowerCase()) {
      case "bike":
        return "bike";
      case "scooter":
        return "scooter";
      case "monopattino":
        return "monopattino";
      default:
        return "bike";
    }
  };

  /**
   * Get vehicle configuration from VEHICLE_OPTIONS
   */
  const getVehicleConfig = (vehicleType: VehicleType) => {
    const config = VEHICLE_CONFIG_MAP.get(vehicleType);
    if (!config) {
      throw new Error(`Vehicle type ${vehicleType} not found in configuration`);
    }
    return config;
  };

  /**
   * Get city-specific vehicle availability
   */
  const getCityVehicleAvailability = (
    cityId: string,
    vehicleType: VehicleType
  ): number => {
    const city = EUROPEAN_CITIES.find((c) => c.id === cityId);
    if (!city) return 0;

    return city.vehicleLimit[vehicleType] || 0;
  };

  /**
   * Format price from wei to ETH string
   */
  const formatPrice = (priceWei: bigint): string => {
    return formatEther(priceWei);
  };

  /**
   * Check if a pass is active (not expired)
   */
  const isPassActive = (pass: RentalPassData): boolean => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return pass.isActive && pass.expiryDate > now;
  };

  /**
   * Get days remaining for a pass
   */
  const getDaysRemaining = (expiryDate: bigint): number => {
    const now = Math.floor(Date.now() / 1000);
    const expiry = Number(expiryDate);
    const remaining = Math.max(0, expiry - now);
    return Math.ceil(remaining / (24 * 60 * 60));
  };

  // ============= MAIN FUNCTIONS =============

  /**
   * Mint a new rental pass
   */
  const mintPass = async ({
    vehicleType,
    cityId,
    duration = 30,
  }: MintPassParams) => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    if (!CONTRACT_ADDRESS) {
      throw new Error("Contract address not configured");
    }

    setError(null);
    setIsLoading(true);

    try {
      console.log("🚀 Starting mintPass transaction...");
      console.log("📋 Parameters:", { vehicleType, cityId, duration });

      const config = getVehicleConfig(vehicleType);
      console.log("⚙️ Vehicle config:", config);

      const priceInWei = parseEther(config.priceETH.replace(" ETH", ""));
      console.log("💰 Price in Wei:", priceInWei.toString());

      const contractVehicleType = vehicleTypeToContractNumber(vehicleType);
      console.log("🔢 Contract vehicle type:", contractVehicleType);

      // Metadata is now generated automatically by the contract
      console.log("📝 Contract will auto-generate metadata and access code");

      console.log("📡 Contract details:", {
        address: CONTRACT_ADDRESS,
        functionName: "mintRentalPassPublic",
        args: [contractVehicleType, cityId, BigInt(duration)],
        value: priceInWei.toString(),
      });

      // ✅ Invia la transazione
      console.log("📤 Sending transaction to blockchain...");
      console.log("💰 Payment amount:", priceInWei.toString(), "wei");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: RENTAL_PASS_ABI,
        functionName: "mintRentalPassPublic",
        args: [contractVehicleType, cityId, BigInt(duration)],
        value: priceInWei,
      });

      // ✅ Mostra messaggio di successo
      toast.success(
        "NFT minting transaction submitted! Waiting for confirmation..."
      );
      toast(
        `Payment of ${formatEther(priceInWei)} ETH included in transaction`
      );

      // ✅ Ritorna un oggetto temporaneo (l'hash sarà disponibile tramite mintTxHash)
      return {
        txHash: "pending", // Sarà aggiornato dal hook
        vehicleType,
        cityId,
        duration,
        price: priceInWei,
        confirmed: false,
        receipt: null,
        success: true,
      };
    } catch (err: any) {
      console.error("❌ Transaction failed with error:", err);
      console.error("🔍 Error details:", {
        message: err.message,
        code: err.code,
        data: err.data,
        stack: err.stack,
        name: err.name,
      });

      const error: ContractError = {
        message: err.message || "Failed to mint rental pass",
        code: err.code,
        data: err.data,
      };
      setError(error);

      // Toast specifico per transazioni fallite
      if (err.message?.includes("execution reverted")) {
        toast.error("Transaction failed on chain - execution reverted");
      } else if (err.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction");
      } else if (err.message?.includes("user rejected")) {
        toast.error("Transaction was rejected by user");
      } else {
        toast.error(`Transaction failed: ${err.message}`);
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Note: Access codes are now generated automatically by the contract during minting
  // No need for separate generateAccessCode function

  /**
   * Get formatted user passes
   */
  const getUserPasses = (): RentalPassData[] => {
    if (!userPassesData) return [];

    // userPassesData now returns array of token IDs
    // We need to fetch individual pass details for each token
    return (userPassesData as bigint[]).map((tokenId: bigint) => ({
      tokenId,
      vehicleType: "bike" as VehicleType, // Default, will be updated when we fetch details
      cityId: "unknown", // Will be updated when we fetch details
      duration: BigInt(30), // Default 30 days
      price: BigInt(0), // Will be updated when we fetch details
      purchaseDate: BigInt(0), // Will be updated when we fetch details
      expiryDate: BigInt(0), // Will be updated when we fetch details
      isActive: true, // Default, will be updated when we fetch details
      owner: address!,
    }));
  };

  /**
   * Get available vehicles with city-specific availability
   */
  const getAvailableVehicles = (cityId?: string): VehicleAvailability[] => {
    if (!availableVehiclesData) {
      // Return default data if contract call fails
      return VEHICLE_OPTIONS.map((option) => ({
        vehicleType: option.type,
        available: BigInt(150), // Global fallback
        priceWei: parseEther(option.priceEth.replace(" ETH", "")),
        priceGwei: parseEther(option.priceEth.replace(" ETH", "")),
        name: option.name,
        description: option.description,
        citySpecificAvailability: cityId
          ? getCityVehicleAvailability(cityId, option.type)
          : 0,
      }));
    }

    // availableVehiclesData now returns individual vehicle prices
    // We need to map them to the expected format
    return VEHICLE_OPTIONS.map((option) => {
      const vehicleType = option.type;
      const config = getVehicleConfig(vehicleType);

      return {
        vehicleType,
        available: BigInt(150), // Default availability
        priceWei: parseEther(option.priceEth.replace(" ETH", "")),
        priceGwei: parseEther(option.priceEth.replace(" ETH", "")),
        name: config.name,
        description: config.description,
        citySpecificAvailability: cityId
          ? getCityVehicleAvailability(cityId, vehicleType)
          : 0,
      };
    });
  };

  /**
   * Check if user has a specific vehicle type pass
   */
  const userHasPass = (vehicleType: VehicleType): boolean => {
    const userPasses = getUserPasses();
    return userPasses.some(
      (pass) => pass.vehicleType === vehicleType && isPassActive(pass)
    );
  };

  /**
   * Get user's active passes by vehicle type
   */
  const getActivePassesByType = (
    vehicleType: VehicleType
  ): RentalPassData[] => {
    const userPasses = getUserPasses();
    return userPasses.filter(
      (pass) => pass.vehicleType === vehicleType && isPassActive(pass)
    );
  };

  /**
   * Get user's pass statistics
   */
  const getUserStats = () => {
    const userPasses = getUserPasses();
    const activePasses = userPasses.filter(isPassActive);
    const totalValue = userPasses.reduce(
      (sum, pass) => sum + Number(formatEther(pass.price)),
      0
    );

    return {
      totalPasses: userPasses.length,
      activePasses: activePasses.length,
      expiredPasses: userPasses.length - activePasses.length,
      totalValue: totalValue.toFixed(3),
      passesByType: {
        bike: userPasses.filter((p) => p.vehicleType === "bike").length,
        scooter: userPasses.filter((p) => p.vehicleType === "scooter").length,
        monopattino: userPasses.filter((p) => p.vehicleType === "monopattino")
          .length,
      },
    };
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Rental pass minted successfully! 🎉");
      refetchPasses(); // Refresh user passes
      refetchVehicles(); // Refresh availability
    }
  }, [isConfirmed, refetchPasses, refetchVehicles]);

  // Handle mint errors
  useEffect(() => {
    if (mintError) {
      const error: ContractError = {
        message: mintError.message || "Transaction failed",
        data: mintError,
      };
      setError(error);
      toast.error(error.message);
    }
  }, [mintError]);

  return {
    // State
    isLoading: isLoading || isMintPending,
    isLoadingPasses,
    isLoadingVehicles,
    error,
    isConnected,
    address,

    // Transaction status
    mintTxHash,
    isConfirmed,
    receipt,

    // Functions
    mintPass,
    // generateAccessCode removed - now handled by contract
    getUserPasses,
    getAvailableVehicles,
    userHasPass,
    getActivePassesByType,
    getUserStats,

    // Utility functions
    vehicleTypeToString,
    vehicleTypeToContractNumber,
    stringToVehicleType,
    getVehicleConfig,
    formatPrice,
    isPassActive,
    getDaysRemaining,
    getCityVehicleAvailability,

    // Data
    userPasses: getUserPasses(),
    availableVehicles: getAvailableVehicles(),
    userStats: getUserStats(),

    // Refetch functions
    refetchPasses,
    refetchVehicles,

    // Constants
    VEHICLE_OPTIONS,
  };
}

// Hook to read vehicle prices from contract
export const useVehiclePrices = () => {
  const { data: bikePrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getVehiclePrice",
    args: [0], // BIKE
  });

  const { data: scooterPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getVehiclePrice",
    args: [1], // SCOOTER
  });

  const { data: monopattinoPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getVehiclePrice",
    args: [2], // MONOPATTINO
  });

  return {
    bikePrice: bikePrice || BigInt(0),
    scooterPrice: scooterPrice || BigInt(0),
    monopattinoPrice: monopattinoPrice || BigInt(0),
    isLoading: !bikePrice || !scooterPrice || !monopattinoPrice,
  };
};
