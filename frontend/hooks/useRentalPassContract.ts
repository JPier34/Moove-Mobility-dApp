import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { toast } from "react-hot-toast";
import { VehicleType } from "@/types/nft";

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
  name: string;
  description: string;
}

export interface ContractError {
  message: string;
  code?: string;
  data?: any;
}

// ============= CONSTANTS =============
const VEHICLE_TYPE_NAMES = {
  [VehicleType.BIKE]: "bike",
  [VehicleType.SCOOTER]: "scooter",
  [VehicleType.MONOPATTINO]: "monopattino",
} as const;

const VEHICLE_PRICES = {
  [VehicleType.BIKE]: "0.025", // 25 EUR equivalent
  [VehicleType.SCOOTER]: "0.035", // 35 EUR equivalent
  [VehicleType.MONOPATTINO]: "0.045", // 45 EUR equivalent
} as const;

const VEHICLE_CONFIG = {
  [VehicleType.BIKE]: {
    name: "E-Bike Pass",
    icon: "🚲",
    description: "Perfect for city exploration and daily commutes",
    features: [
      "30 days unlimited access",
      "All partner bike networks",
      "Priority support",
      "City-wide coverage",
    ],
    gradient: "from-green-400 to-emerald-600",
  },
  [VehicleType.SCOOTER]: {
    name: "E-Scooter Pass",
    icon: "🛴",
    description: "Fast and convenient for short to medium trips",
    features: [
      "30 days unlimited access",
      "Premium scooter fleet",
      "Fast unlock speeds",
      "Extended range vehicles",
    ],
    gradient: "from-blue-400 to-indigo-600",
  },
  [VehicleType.MONOPATTINO]: {
    name: "Monopattino Pass",
    icon: "🛵",
    description: "Premium urban mobility with exclusive access",
    features: [
      "30 days unlimited access",
      "Exclusive vehicle access",
      "VIP customer support",
      "Premium parking spots",
    ],
    gradient: "from-purple-400 to-pink-600",
  },
};

// Smart Contract ABI (simplified for rental passes)
const RENTAL_PASS_ABI = [
  {
    inputs: [
      { name: "vehicleType", type: "uint8" },
      { name: "cityId", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    name: "mintRentalPass",
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "generateAccessCode",
    outputs: [{ name: "code", type: "string" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "getUserRentalPasses",
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "vehicleType", type: "uint8" },
          { name: "cityId", type: "string" },
          { name: "duration", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "purchaseDate", type: "uint256" },
          { name: "expiryDate", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getRentalPassDetails",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "vehicleType", type: "uint8" },
          { name: "cityId", type: "string" },
          { name: "duration", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "purchaseDate", type: "uint256" },
          { name: "expiryDate", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAvailableVehicleTypes",
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "vehicleType", type: "uint8" },
          { name: "available", type: "uint256" },
          { name: "priceWei", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "vehicleType", type: "uint8" }],
    name: "getVehicleTypePrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract address
const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_RENTAL_PASS_CONTRACT as `0x${string}`;

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

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
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
    functionName: "getUserRentalPasses",
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
    functionName: "getAvailableVehicleTypes",
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  // ============= UTILITY FUNCTIONS =============

  /**
   * Convert VehicleType enum to string
   */
  const vehicleTypeToString = (vehicleType: VehicleType): string => {
    return VEHICLE_TYPE_NAMES[vehicleType];
  };

  /**
   * Convert string to VehicleType enum
   */
  const stringToVehicleType = (vehicleString: string): VehicleType => {
    switch (vehicleString.toLowerCase()) {
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

  /**
   * Get vehicle configuration
   */
  const getVehicleConfig = (vehicleType: VehicleType) => {
    return VEHICLE_CONFIG[vehicleType];
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
      const price = VEHICLE_PRICES[vehicleType];
      const priceInWei = parseEther(price);

      const txHash = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: RENTAL_PASS_ABI,
        functionName: "mintRentalPass",
        args: [vehicleType, cityId, BigInt(duration)],
        value: priceInWei,
      });

      toast.success("Transaction submitted! Waiting for confirmation...");

      return {
        txHash,
        vehicleType,
        cityId,
        duration,
        price: priceInWei,
      };
    } catch (err: any) {
      const error: ContractError = {
        message: err.message || "Failed to mint rental pass",
        code: err.code,
        data: err.data,
      };
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate access code for a rental pass
   */
  const generateAccessCode = async (tokenId: bigint): Promise<AccessCode> => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    if (!CONTRACT_ADDRESS) {
      throw new Error("Contract address not configured");
    }

    setError(null);
    setIsLoading(true);

    try {
      const code = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: RENTAL_PASS_ABI,
        functionName: "generateAccessCode",
        args: [tokenId],
      });

      toast.success("Access code generated successfully!");

      return {
        code: code!,
        tokenId,
        expiresAt: BigInt(Date.now() + 15 * 60 * 1000), // 15 minutes
        isUsed: false,
      };
    } catch (err: any) {
      const error: ContractError = {
        message: err.message || "Failed to generate access code",
        code: err.code,
        data: err.data,
      };
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get formatted user passes
   */
  const getUserPasses = (): RentalPassData[] => {
    if (!userPassesData) return [];

    return (userPassesData as any[]).map((pass: any) => ({
      tokenId: pass.tokenId,
      vehicleType: pass.vehicleType as VehicleType,
      cityId: pass.cityId,
      duration: pass.duration,
      price: pass.price,
      purchaseDate: pass.purchaseDate,
      expiryDate: pass.expiryDate,
      isActive: pass.isActive,
      owner: address!,
    }));
  };

  /**
   * Get available vehicles with real-time availability
   */
  const getAvailableVehicles = (): VehicleAvailability[] => {
    if (!availableVehiclesData) {
      // Return default data if contract call fails
      return [
        {
          vehicleType: VehicleType.BIKE,
          available: BigInt(150),
          priceWei: parseEther(VEHICLE_PRICES[VehicleType.BIKE]),
          ...VEHICLE_CONFIG[VehicleType.BIKE],
        },
        {
          vehicleType: VehicleType.SCOOTER,
          available: BigInt(89),
          priceWei: parseEther(VEHICLE_PRICES[VehicleType.SCOOTER]),
          ...VEHICLE_CONFIG[VehicleType.SCOOTER],
        },
        {
          vehicleType: VehicleType.MONOPATTINO,
          available: BigInt(67),
          priceWei: parseEther(VEHICLE_PRICES[VehicleType.MONOPATTINO]),
          ...VEHICLE_CONFIG[VehicleType.MONOPATTINO],
        },
      ];
    }

    return (availableVehiclesData as any[]).map((vehicle: any) => ({
      vehicleType: vehicle.vehicleType as VehicleType,
      available: vehicle.available,
      priceWei: vehicle.priceWei,
      ...VEHICLE_CONFIG[vehicle.vehicleType as VehicleType],
    }));
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
        [VehicleType.BIKE]: userPasses.filter(
          (p) => p.vehicleType === VehicleType.BIKE
        ).length,
        [VehicleType.SCOOTER]: userPasses.filter(
          (p) => p.vehicleType === VehicleType.SCOOTER
        ).length,
        [VehicleType.MONOPATTINO]: userPasses.filter(
          (p) => p.vehicleType === VehicleType.MONOPATTINO
        ).length,
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
    isLoading: isLoading || isMintPending || isConfirming,
    isLoadingPasses,
    isLoadingVehicles,
    error,
    isConnected,
    address,

    // Transaction status
    mintTxHash,
    isConfirmed,
    isConfirming,

    // Functions
    mintPass,
    generateAccessCode,
    getUserPasses,
    getAvailableVehicles,
    userHasPass,
    getActivePassesByType,
    getUserStats,

    // Utility functions
    vehicleTypeToString,
    stringToVehicleType,
    getVehicleConfig,
    formatPrice,
    isPassActive,
    getDaysRemaining,

    // Data
    userPasses: getUserPasses(),
    availableVehicles: getAvailableVehicles(),
    userStats: getUserStats(),

    // Refetch functions
    refetchPasses,
    refetchVehicles,

    // Constants
    VehicleType,
    VEHICLE_CONFIG,
  };
}
