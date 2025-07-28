import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { useState, useEffect } from "react";

// Vehicle types enum matching smart contract
export enum VehicleType {
  BIKE = 0,
  SCOOTER = 1,
  MONOPATTINO = 2,
}

// Smart Contract ABI (partial - key functions only)
const RENTAL_PASS_ABI = [
  {
    inputs: [
      { type: "uint8", name: "vehicleType" },
      { type: "string", name: "cityId" },
    ],
    name: "mintRentalPass",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ type: "uint256", name: "tokenId" }],
    name: "canGenerateCode",
    outputs: [{ type: "bool", name: "isValid" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "uint256", name: "tokenId" }],
    name: "isPassValid",
    outputs: [{ type: "bool", name: "isValid" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "uint256", name: "tokenId" }],
    name: "getPassInfo",
    outputs: [
      {
        components: [
          { type: "uint8", name: "vehicleType" },
          { type: "string", name: "cityId" },
          { type: "uint256", name: "validUntil" },
          { type: "uint256", name: "codesGenerated" },
          { type: "bool", name: "isActive" },
          { type: "uint256", name: "mintedAt" },
        ],
        type: "tuple",
        name: "pass",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { type: "address", name: "user" },
      { type: "string", name: "cityId" },
      { type: "uint8", name: "vehicleType" },
    ],
    name: "getUserPasses",
    outputs: [{ type: "uint256[]", name: "tokenIds" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "address", name: "user" }],
    name: "getAllUserPasses",
    outputs: [{ type: "uint256[]", name: "tokenIds" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "uint8", name: "vehicleType" }],
    name: "getPassPricing",
    outputs: [
      {
        components: [
          { type: "uint256", name: "price" },
          { type: "uint256", name: "validityDays" },
          { type: "bool", name: "isActive" },
        ],
        type: "tuple",
        name: "pricing",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ type: "uint256", name: "supply" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract address (deploy and update this)
const RENTAL_PASS_CONTRACT_ADDRESS = "0x..."; // TODO: Add deployed contract address

// Types
interface RentalPass {
  tokenId: number;
  vehicleType: VehicleType;
  cityId: string;
  validUntil: number;
  codesGenerated: number;
  isActive: boolean;
  mintedAt: number;
  isValid: boolean;
}

interface PassPricing {
  price: bigint;
  validityDays: number;
  isActive: boolean;
}

// Main hook for rental pass contract interaction
export function useRentalPassContract() {
  return {
    address: RENTAL_PASS_CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
  };
}

// Hook to get pricing for all vehicle types
export function usePassPricing() {
  const { data: bikePricing } = useReadContract({
    address: RENTAL_PASS_CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getPassPricing",
    args: [VehicleType.BIKE],
  });

  const { data: scooterPricing } = useReadContract({
    address: RENTAL_PASS_CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getPassPricing",
    args: [VehicleType.SCOOTER],
  });

  const { data: monopatinoPricing } = useReadContract({
    address: RENTAL_PASS_CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getPassPricing",
    args: [VehicleType.MONOPATTINO],
  });

  return {
    pricing: {
      bike: bikePricing as PassPricing | undefined,
      scooter: scooterPricing as PassPricing | undefined,
      monopattino: monopatinoPricing as PassPricing | undefined,
    },
    isLoading: !bikePricing || !scooterPricing || !monopatinoPricing,
  };
}

// Hook to mint rental pass
export function useMintRentalPass() {
  const [lastMintedTokenId, setLastMintedTokenId] = useState<number | null>(
    null
  );

  const {
    data: hash,
    writeContract,
    error: writeError,
    isPending: isWriteLoading,
  } = useWriteContract();

  const {
    isLoading: isTransactionLoading,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash, // ✅ Now correctly using hash from writeContract
  });

  useEffect(() => {
    if (isSuccess && receipt) {
      console.log("✅ Rental pass minted successfully", receipt);
      // TODO: Extract token ID from receipt logs if needed
    }
  }, [isSuccess, receipt]);

  const mintPass = (
    vehicleType: VehicleType,
    cityId: string,
    price: bigint
  ) => {
    writeContract({
      address: RENTAL_PASS_CONTRACT_ADDRESS,
      abi: RENTAL_PASS_ABI,
      functionName: "mintRentalPass",
      args: [vehicleType, cityId],
      value: price,
    });
  };

  return {
    mintPass,
    data: hash,
    error: writeError,
    isLoading: isWriteLoading || isTransactionLoading,
    isSuccess,
    lastMintedTokenId,
  };
}

// Hook to get user's rental passes
export function useUserRentalPasses(
  cityId?: string,
  vehicleType?: VehicleType
) {
  const { address } = useAccount();

  // Get all user passes
  const { data: allTokenIds, isLoading: isLoadingTokenIds } = useReadContract({
    address: RENTAL_PASS_CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getAllUserPasses",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get specific passes for city/vehicle type if specified
  const { data: specificTokenIds } = useReadContract({
    address: RENTAL_PASS_CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getUserPasses",
    args:
      address && cityId && vehicleType !== undefined
        ? [address, cityId, vehicleType]
        : undefined,
    query: {
      enabled: !!address && !!cityId && vehicleType !== undefined,
    },
  });

  const [passes, setPasses] = useState<RentalPass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pass details for each token ID
  useEffect(() => {
    async function fetchPassDetails() {
      if (!allTokenIds || allTokenIds.length === 0) {
        setPasses([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // TODO: Replace with actual contract calls using useReadContract for each token
        // For now, return mock data structure
        const mockPasses: RentalPass[] = allTokenIds.map(
          (tokenId: bigint, index: number) => ({
            tokenId: Number(tokenId),
            vehicleType: index % 3, // Mock rotation between vehicle types
            cityId: cityId || "milan",
            validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
            codesGenerated: Math.floor(Math.random() * 10),
            isActive: true,
            mintedAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random time in last week
            isValid: true,
          })
        );

        setPasses(mockPasses);
      } catch (error) {
        console.error("Error fetching pass details:", error);
        setPasses([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPassDetails();
  }, [allTokenIds, cityId, vehicleType]);

  return {
    passes,
    isLoading: isLoadingTokenIds || isLoading,
    refetch: () => {
      // Trigger re-fetch logic
    },
  };
}

// Hook to check if pass is valid
export function usePassValidity(tokenId?: number) {
  const { data: isValid, isLoading } = useReadContract({
    address: RENTAL_PASS_CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "isPassValid",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  return {
    isValid: isValid as boolean | undefined,
    isLoading,
  };
}

// Hook to check if pass can generate codes
export function useCanGenerateCode(tokenId?: number) {
  const { data: canGenerate, isLoading } = useReadContract({
    address: RENTAL_PASS_CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "canGenerateCode",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  return {
    canGenerate: canGenerate as boolean | undefined,
    isLoading,
  };
}

// Hook to get detailed pass information
export function usePassInfo(tokenId?: number) {
  const { data: passInfo, isLoading } = useReadContract({
    address: RENTAL_PASS_CONTRACT_ADDRESS,
    abi: RENTAL_PASS_ABI,
    functionName: "getPassInfo",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  return {
    passInfo,
    isLoading,
  };
}

// Combined hook for rental pass management
export function useRentalPassManager() {
  const { address, isConnected } = useAccount();
  const { pricing, isLoading: isPricingLoading } = usePassPricing();
  const { passes, isLoading: isPassesLoading } = useUserRentalPasses();
  const {
    mintPass,
    isLoading: isMinting,
    isSuccess: mintSuccess,
  } = useMintRentalPass();

  // Check if user has valid pass for specific city/vehicle
  const hasValidPass = (cityId: string, vehicleType: VehicleType): boolean => {
    return passes.some(
      (pass) =>
        pass.cityId.toLowerCase() === cityId.toLowerCase() &&
        pass.vehicleType === vehicleType &&
        pass.isValid &&
        pass.isActive
    );
  };

  // Get best pass for rental (most time remaining)
  const getBestPassForRental = (
    cityId: string,
    vehicleType: VehicleType
  ): RentalPass | null => {
    const validPasses = passes.filter(
      (pass) =>
        pass.cityId.toLowerCase() === cityId.toLowerCase() &&
        pass.vehicleType === vehicleType &&
        pass.isValid &&
        pass.isActive
    );

    if (validPasses.length === 0) return null;

    // Return pass with most time remaining
    return validPasses.reduce((best, current) =>
      current.validUntil > best.validUntil ? current : best
    );
  };

  // Get pricing for vehicle type
  const getPriceForVehicle = (vehicleType: VehicleType): bigint | null => {
    switch (vehicleType) {
      case VehicleType.BIKE:
        return pricing.bike?.price || parseEther("0.025");
      case VehicleType.SCOOTER:
        return pricing.scooter?.price || parseEther("0.035");
      case VehicleType.MONOPATTINO:
        return pricing.monopattino?.price || parseEther("0.045");
      default:
        return null;
    }
  };

  // Purchase pass for specific vehicle and city
  const purchasePass = async (vehicleType: VehicleType, cityId: string) => {
    const price = getPriceForVehicle(vehicleType);
    if (!price) {
      throw new Error("Price not available");
    }

    mintPass(vehicleType, cityId, price);
  };

  // Generate access code (completely off-chain)
  const generateAccessCode = async (
    tokenId: number,
    duration: number = 30 // minutes
  ): Promise<{ code: string; expiresAt: number } | null> => {
    const pass = passes.find((p) => p.tokenId === tokenId);
    if (!pass || !pass.isValid) {
      return null;
    }

    // Completely off-chain generation - no blockchain interaction
    const entropy = crypto.getRandomValues(new Uint8Array(16));
    const timestamp = Date.now();
    const expiresAt = timestamp + duration * 60 * 1000;

    // Create secure seed
    const seedData = `${address}-${timestamp}-${tokenId}-${duration}-${entropy.join(
      ""
    )}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(seedData);

    // Hash for additional security
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);

    // Generate 8-character code
    const allowedChars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";

    for (let i = 0; i < 8; i++) {
      const index = hashArray[i] % allowedChars.length;
      code += allowedChars[index];
    }

    console.log("🔑 Generated access code (off-chain):", {
      code,
      tokenId,
      duration: `${duration} minutes`,
      expiresAt: new Date(expiresAt),
      cityId: pass.cityId,
      vehicleType: pass.vehicleType,
    });

    return { code, expiresAt };
  };

  return {
    // Data
    passes,
    pricing,
    isConnected,

    // Loading states
    isLoading: isPricingLoading || isPassesLoading,
    isMinting,

    // Actions
    purchasePass,
    generateAccessCode,

    // Utilities
    hasValidPass,
    getBestPassForRental,
    getPriceForVehicle,

    // Status
    mintSuccess,
  };
}
