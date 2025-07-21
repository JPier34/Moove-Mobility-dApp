import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contracts } from "@/utils/contracts";

// Tipi helper per migliorare la type safety
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

// Hook per leggere contratti MooveNFT
export function useReadMooveNFT<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
): ReadContractResult<T> {
  return useReadContract({
    address: contracts.MooveNFT.address as `0x${string}`,
    abi: contracts.MooveNFT.abi as any,
    functionName,
    args,
    ...options,
  }) as ReadContractResult<T>;
}

// Hook per scrivere contratti MooveNFT
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
    const contractParams: any = {
      address: contracts.MooveNFT.address as `0x${string}`,
      abi: contracts.MooveNFT.abi as any,
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
    writeMooveNFT,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  } satisfies WriteContractResult & { writeMooveNFT: typeof writeMooveNFT };
}

// Hook per leggere contratti MooveAuction
export function useReadMooveAuction<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
): ReadContractResult<T> {
  return useReadContract({
    address: contracts.MooveAuction.address as `0x${string}`,
    abi: contracts.MooveAuction.abi as any,
    functionName,
    args,
    ...options,
  }) as ReadContractResult<T>;
}

// Hook per scrivere contratti MooveAuction
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
    const contractParams: any = {
      address: contracts.MooveAuction.address as `0x${string}`,
      abi: contracts.MooveAuction.abi as any,
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

// Hook helper per operazioni comuni
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
