"use client";

import { useCallback, useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { accessControlContractConfig, contracts } from "@/utils/contracts";

// Role hashes from the contract
export const ROLES = {
  MASTER_ADMIN:
    "0xf83591f6d256ac9a12084d6de9c89a3e1fd09d594aa1184c76eef05bae103fc3",
  MINTER: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  AUCTION_MANAGER:
    "0xfc15875e223f196de4d28f104664030b8067b4a40d0372ee3095567046e5e0b3",
} as const;

// Hook to check if user has a specific role
export function useHasRole(role: string, userAddress?: string) {
  return useReadContract({
    address: accessControlContractConfig.address,
    abi: accessControlContractConfig.abi,
    functionName: "hasRole",
    args: [role as `0x${string}`, userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
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

// Hook to get user roles
export function useUserRoles(userAddress?: string) {
  const masterAdmin = useHasRole(ROLES.MASTER_ADMIN, userAddress);
  const { data: canMint } = useReadContract({
    address: accessControlContractConfig.address,
    abi: accessControlContractConfig.abi,
    functionName: "canMint",
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    isMasterAdmin: masterAdmin.data || false,
    canMint: canMint || false,
    isLoading: masterAdmin.isLoading,
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
    address: contracts.MooveAuction.address,
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
    address: contracts.MooveNFT.address,
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
      writeContract({
        address: contracts.MooveAuction.address,
        abi: contracts.MooveAuction.abi,
        functionName: functionName as any,
        args: args as any,
        value: value || undefined,
      });
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
      writeContract({
        address: contracts.MooveNFT.address,
        abi: contracts.MooveNFT.abi,
        functionName: functionName as any,
        args: args as any,
        value: value || undefined,
      });
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
