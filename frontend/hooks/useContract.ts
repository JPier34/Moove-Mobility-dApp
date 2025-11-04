"use client";

import { useCallback, useState, useEffect } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { accessControlContractConfig, contracts } from "@/utils/contracts";
import { getAdminAddress } from "@/config/admin";

// Role hashes from the contract
export const ROLES = {
  MASTER_ADMIN:
    "0xf83591f6d256ac9a12084d6de9c89a3e1fd09d594aa1184c76eef05bae103fc3",
  MINTER: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  AUCTION_MANAGER:
    "0xfc15875e223f196de4d28f104664030b8067b4a40d0372ee3095567046e5e0b3",
} as const;

// Hook to check if user has a specific role with 429 error handling
export function useHasRole(role: string, userAddress?: string) {
  return useReadContract({
    address: accessControlContractConfig.address,
    abi: accessControlContractConfig.abi,
    functionName: "hasRole",
    args: [role as `0x${string}`, userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
      retry: 2, // Reduce retries to fail faster
      retryDelay: 2000, // Wait 2s between retries
      refetchInterval: false, // Don't auto-refetch
      staleTime: 30000, // Consider data fresh for 30s
    },
  });
}

// Hook to check if user is master admin
export function useIsMasterAdmin(userAddress?: string) {
  return useHasRole(ROLES.MASTER_ADMIN, userAddress);
}

// Hook to check if user can mint
export function useCanMint(userAddress?: string) {
  return useReadContract({
    address: accessControlContractConfig.address,
    abi: accessControlContractConfig.abi,
    functionName: "canMint",
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  });
}

// Hook to get user roles with 429 error handling and caching
export function useUserRoles(userAddress?: string) {
  const [cachedRoles, setCachedRoles] = useState<{
    isMasterAdmin?: boolean;
    canMint?: boolean;
    timestamp?: number;
  }>({});
  
  const CACHE_DURATION = 30000; // 30 secondi di cache
  const isCached = cachedRoles.timestamp && 
    Date.now() - cachedRoles.timestamp < CACHE_DURATION;

  // Check if user is master wallet first (no RPC call needed)
  const MASTER_WALLET = getAdminAddress();
  const isMasterWallet = userAddress?.toLowerCase() === MASTER_WALLET?.toLowerCase();

  // Always call hooks (React rules), but disable them if master wallet
  const shouldCheckRoles = !!userAddress && !isMasterWallet;
  
  const masterAdmin = useHasRole(ROLES.MASTER_ADMIN, shouldCheckRoles ? userAddress : undefined);
  const { data: canMint, isLoading: canMintLoading, error: canMintError } = useReadContract({
    address: accessControlContractConfig.address,
    abi: accessControlContractConfig.abi,
    functionName: "canMint",
    args: [userAddress as `0x${string}`],
    query: {
      enabled: shouldCheckRoles,
      retry: 2, // Reduce retries to fail faster
      retryDelay: 2000, // Wait 2s between retries
      refetchInterval: false, // Don't auto-refetch
      staleTime: 30000, // Consider data fresh for 30s
    },
  });

  // Handle 429 errors gracefully
  useEffect(() => {
    if (masterAdmin.error || canMintError) {
      const error = (masterAdmin.error || canMintError) as any;
      const is429 = error?.message?.includes("429") || 
                   error?.code === 429 ||
                   error?.status === 429 ||
                   error?.message?.includes("rate limit");
      
      if (is429) {
        console.warn("⚠️ [useUserRoles] Rate limit (429) detected, using cached values if available");
        // Don't throw, just use cached values
      }
    }
  }, [masterAdmin.error, canMintError]);

  // Update cache when we have valid data
  useEffect(() => {
    if (shouldCheckRoles && !masterAdmin.isLoading && !canMintLoading && masterAdmin.data !== undefined && canMint !== undefined) {
      setCachedRoles({
        isMasterAdmin: Boolean(masterAdmin.data) || false,
        canMint: Boolean(canMint) || false,
        timestamp: Date.now(),
      });
    }
  }, [shouldCheckRoles, masterAdmin.data, masterAdmin.isLoading, canMint, canMintLoading]);

  // If master wallet, return immediately (no RPC calls needed)
  if (isMasterWallet) {
    return {
      isMasterAdmin: true,
      canMint: true,
      isLoading: false,
    };
  }

  // Use cached values if RPC calls are failing and we have cache
  const hasError = masterAdmin.error || canMintError;
  const useCache = hasError && isCached;

  return {
    isMasterAdmin: useCache ? (cachedRoles.isMasterAdmin || false) : (Boolean(masterAdmin.data) || false),
    canMint: useCache ? (cachedRoles.canMint || false) : (Boolean(canMint) || false),
    isLoading: masterAdmin.isLoading || canMintLoading,
  };
}

// ============================================================================
// CONTRACT READ HOOKS
// ============================================================================

export function useReadMooveAuction<T = any>(
  functionName: string,
  args?: readonly unknown[],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: contracts.MooveAuction.address as `0x${string}`,
    abi: contracts.MooveAuction.abi,
    functionName: functionName as any,
    args: args as any,
    query: {
      enabled: options?.enabled !== false,
    },
  }) as {
    data: T;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function useReadMooveNFT<T = any>(
  functionName: string,
  args?: readonly unknown[],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: contracts.MooveNFT.address as `0x${string}`,
    abi: contracts.MooveNFT.abi,
    functionName: functionName as any,
    args: args as any,
    query: {
      enabled: options?.enabled !== false,
    },
  }) as {
    data: T;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

// ============================================================================
// CONTRACT WRITE HOOKS
// ============================================================================

export function useWriteMooveAuction() {
  const { writeContract, isPending, isSuccess, error, data } =
    useWriteContract();

  const writeMooveAuction = useCallback(
    (functionName: string, args: readonly unknown[], value?: bigint) => {
      const contractCall: any = {
        address: contracts.MooveAuction.address as `0x${string}`,
        abi: contracts.MooveAuction.abi,
        functionName: functionName as any,
        args: args as any,
      };
      if (value !== undefined) {
        contractCall.value = value;
      }
      writeContract(contractCall);
    },
    [writeContract]
  );

  return {
    writeMooveAuction,
    isPending,
    isSuccess,
    error,
    hash: data,
  };
}

export function useWriteMooveNFT() {
  const { writeContract, isPending, isSuccess, error, data } =
    useWriteContract();

  const writeMooveNFT = useCallback(
    (functionName: string, args: readonly unknown[], value?: bigint) => {
      const contractCall: any = {
        address: contracts.MooveNFT.address as `0x${string}`,
        abi: contracts.MooveNFT.abi,
        functionName: functionName as any,
        args: args as any,
      };
      if (value !== undefined) {
        contractCall.value = value;
      }
      writeContract(contractCall);
    },
    [writeContract]
  );

  return {
    writeMooveNFT,
    isPending,
    isSuccess,
    error,
    hash: data,
  };
}
