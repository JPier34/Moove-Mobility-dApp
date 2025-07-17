import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contracts } from "@/utils/contracts";

export function useReadMooveNFT<T = unknown>(
  functionName: string,
  args?: unknown[],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: contracts.MooveNFT.address,
    abi: contracts.MooveNFT.abi,
    functionName,
    args,
    ...options,
  }) as {
    data: T;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function useWriteMooveNFT() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const writeMooveNFT = (
    functionName: string,
    args?: unknown[],
    value?: bigint
  ) => {
    writeContract({
      address: contracts.MooveNFT.address,
      abi: contracts.MooveNFT.abi,
      functionName,
      args,
      value,
    });
  };

  return {
    writeMooveNFT,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useReadMooveAuction<T = unknown>(
  functionName: string,
  args?: unknown[],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: contracts.MooveAuction.address,
    abi: contracts.MooveAuction.abi,
    functionName,
    args,
    ...options,
  }) as {
    data: T;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function useWriteMooveAuction() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const writeMooveAuction = (
    functionName: string,
    args?: unknown[],
    value?: bigint
  ) => {
    writeContract({
      address: contracts.MooveAuction.address,
      abi: contracts.MooveAuction.abi,
      functionName,
      args,
      value,
    });
  };

  return {
    writeMooveAuction,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
