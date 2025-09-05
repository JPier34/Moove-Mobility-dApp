import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contracts } from "@/utils/contracts";

const ROLES = {
  DEFAULT_ADMIN:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  MASTER_ADMIN:
    "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775", // keccak256("MASTER_ADMIN_ROLE")
  MINTER: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", // keccak256("MINTER_ROLE")
  AUCTION_MANAGER:
    "0x2e1a7d4d13322e7b96f9a57413e1525c250fb7a9021cf91d1540d5b69f16a49f", // keccak256("AUCTION_MANAGER_ROLE")
  CUSTOMIZATION_ADMIN:
    "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9", // keccak256("CUSTOMIZATION_ADMIN_ROLE")
} as const;

// Helper types
interface ReadContractResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface WriteContractResult {
  hash: `0x${string}` | undefined;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
}

// Hook to read MooveNFT contracts (placeholder for future use)
export function useReadMooveNFT<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
): ReadContractResult<T> {
  // Placeholder - will be implemented when MooveNFT contract is deployed
  return {
    data: undefined as T,
    isLoading: false,
    error: new Error("MooveNFT contract not yet deployed"),
    refetch: () => {},
  } as ReadContractResult<T>;
}

// Hook to write MooveNFT contracts (placeholder for future use)
export function useWriteMooveNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const writeMooveNFT = (
    functionName: string,
    args: readonly unknown[] = [],
    value?: bigint
  ) => {
    // Placeholder - will be implemented when MooveNFT contract is deployed
    console.warn("MooveNFT contract not yet deployed");
  };

  return {
    writeMooveNFT,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  } satisfies WriteContractResult & { writeMooveNFT: typeof writeMooveNFT };
}

// Hook to read MooveAuction contracts
export function useReadMooveAuction<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
): ReadContractResult<T> {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.MooveAuction.address as `0x${string}`,
    abi: contracts.MooveAuction.abi,
    functionName: functionName as any,
    args: args as readonly unknown[],
    query: {
      enabled: options?.enabled !== false,
    },
  });

  return {
    data: data as T,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Hook to write MooveAuction contracts
export function useWriteMooveAuction() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const writeMooveAuction = (
    functionName: string,
    args: readonly unknown[] = [],
    value?: bigint
  ) => {
    console.log("🔨 useWriteMooveAuction: Calling contract function", {
      functionName,
      contractAddress: contracts.MooveAuction.address,
      args: args.map((arg, index) => ({
        index,
        type: typeof arg,
        value: typeof arg === "bigint" ? arg.toString() : String(arg),
        isBigInt: typeof arg === "bigint",
        isNumber: typeof arg === "number",
        isString: typeof arg === "string",
      })),
      value: value?.toString(),
      abiLength: contracts.MooveAuction.abi.length,
    });

    writeContract({
      address: contracts.MooveAuction.address as `0x${string}`,
      abi: contracts.MooveAuction.abi,
      functionName: functionName as any,
      args: args as readonly unknown[],
      value: value,
    });
  };

  return {
    writeMooveAuction,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  } satisfies WriteContractResult & {
    writeMooveAuction: typeof writeMooveAuction;
  };
}

// Hook to read MooveRentalPass contracts (ACTIVE - currently deployed)
export function useReadMooveRentalPass<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
): ReadContractResult<T> {
  return useReadContract({
    address: contracts.MooveRentalPass.address as `0x${string}`,
    abi: contracts.MooveRentalPass.abi as any,
    functionName,
    args,
    ...options,
  }) as ReadContractResult<T>;
}

// Hook to write MooveRentalPass contracts (ACTIVE - currently deployed)
export function useWriteMooveRentalPass() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const writeMooveRentalPass = (
    functionName: string,
    args: readonly unknown[] = [],
    value?: bigint
  ) => {
    const contractParams: any = {
      address: contracts.MooveRentalPass.address as `0x${string}`,
      abi: contracts.MooveRentalPass.abi as any,
      functionName,
      args,
    };

    // Adds value only if present (payable only)
    if (value !== undefined && value > 0n) {
      contractParams.value = value;
    }

    writeContract(contractParams);
  };

  return {
    writeMooveRentalPass,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to read MooveStickerNFT contracts (placeholder for future use)
export function useReadMooveStickerNFT<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
): ReadContractResult<T> {
  // Placeholder - will be implemented when MooveStickerNFT contract is deployed
  return {
    data: undefined as T,
    isLoading: false,
    error: new Error("MooveStickerNFT contract not yet deployed"),
    refetch: () => {},
  } as ReadContractResult<T>;
}

// Hook to write MooveStickerNFT contracts (using MooveNFT)
export function useWriteMooveStickerNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const writeMooveStickerNFT = (
    functionName: string,
    args: readonly unknown[] = []
  ) => {
    console.log("🎨 Creating NFT with MooveNFT contract:", {
      functionName,
      args: args.map((arg, index) => ({
        index,
        type: typeof arg,
        value: typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      })),
    });

    // Use MooveNFT contract for minting
    writeContract({
      address: contracts.MooveNFT.address as `0x${string}`,
      abi: contracts.MooveNFT.abi,
      functionName: functionName as any,
      args: args as any,
    });
  };

  return {
    writeMooveStickerNFT,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook helper for common ops (placeholder for future use)
export function useMooveNFTOperations() {
  const { writeMooveNFT, ...writeState } = useWriteMooveNFT();

  const mintNFT = (to: string, tokenURI: string, price?: bigint) => {
    writeMooveNFT("mintNFT", [to, tokenURI], price);
  };

  const transferNFT = (from: string, to: string, tokenId: bigint) => {
    writeMooveNFT("transferFrom", [from, to, tokenId]);
  };

  const approveNFT = (to: string, tokenId: bigint) => {
    writeMooveNFT("approve", [to, tokenId]);
  };

  return {
    mintNFT,
    transferNFT,
    approveNFT,
    ...writeState,
  };
}

// Hook helper for auction operations (placeholder for future use)
export function useMooveAuctionOperations() {
  const { writeMooveAuction, ...writeState } = useWriteMooveAuction();

  const createAuction = (
    tokenId: bigint,
    startingPrice: bigint,
    duration: bigint
  ) => {
    writeMooveAuction("createAuction", [tokenId, startingPrice, duration]);
  };

  const placeBid = (auctionId: bigint, bidAmount: bigint) => {
    writeMooveAuction("placeBid", [auctionId], bidAmount);
  };

  const endAuction = (auctionId: bigint) => {
    writeMooveAuction("endAuction", [auctionId]);
  };

  return {
    createAuction,
    placeBid,
    endAuction,
    ...writeState,
  };
}

// Hook to read MooveAccessControl contracts (ACTIVE - currently deployed)
export function useReadMooveAccessControl<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
): ReadContractResult<T> {
  return useReadContract({
    address: contracts.MooveAccessControl.address as `0x${string}`,
    abi: contracts.MooveAccessControl.abi as any,
    functionName,
    args,
    ...options,
  }) as ReadContractResult<T>;
}

// Hook to write MooveAccessControl contracts (ACTIVE - currently deployed)
export function useWriteMooveAccessControl() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const writeMooveAccessControl = (
    functionName: string,
    args: readonly unknown[] = []
  ) => {
    writeContract({
      address: contracts.MooveAccessControl.address as `0x${string}`,
      abi: contracts.MooveAccessControl.abi as any,
      functionName,
      args,
    });
  };

  return {
    writeMooveAccessControl,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  } satisfies WriteContractResult & {
    writeMooveAccessControl: typeof writeMooveAccessControl;
  };
}

// Hook to check user roles (ACTIVE - currently deployed)
export function useHasRole(role: string, userAddress?: string) {
  return useReadMooveAccessControl<boolean>("hasRole", [role, userAddress], {
    enabled: !!userAddress,
  });
}

// Hook to get user roles (ACTIVE - currently deployed)
export function useUserRoles(userAddress?: string) {
  const masterAdmin = useHasRole(ROLES.MASTER_ADMIN, userAddress);
  const { data: canMint } = useReadMooveAccessControl<boolean>(
    "canMint",
    [userAddress],
    { enabled: !!userAddress }
  );

  return {
    isMasterAdmin: masterAdmin.data || false,
    canMint: canMint || false,
    isLoading: masterAdmin.isLoading,
  };
}
