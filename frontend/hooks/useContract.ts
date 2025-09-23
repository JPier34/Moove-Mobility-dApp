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

interface WriteContractResult {
  hash: `0x${string}` | undefined;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
}

// Hook to read MooveNFT contracts (ACTIVE - currently deployed)
export function useReadMooveNFT<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: contracts.MooveNFT.address as `0x${string}`,
    abi: contracts.MooveNFT.abi as any,
    functionName,
    args,
    ...options,
  });
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
    console.log("🎨 Calling MooveNFT contract:", {
      functionName,
      args: args.map((arg, index) => ({
        index,
        type: typeof arg,
        value: typeof arg === "object" ? JSON.stringify(arg) : String(arg),
      })),
      value: value?.toString(),
    });

    // Use MooveNFT contract for NFT operations
    const result = writeContract({
      address: contracts.MooveNFT.address as `0x${string}`,
      abi: [
        "function ownerOf(uint256 tokenId) view returns (address)",
        "function tokenURI(uint256 tokenId) view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
        "function transferFrom(address from, address to, uint256 tokenId) external",
        "function approve(address to, uint256 tokenId) external",
        "function getApproved(uint256 tokenId) view returns (address)",
        "function setApprovalForAll(address operator, bool approved) external",
        "function isApprovedForAll(address owner, address operator) view returns (bool)",
      ] as any,
      functionName: functionName as any,
      args: args as any,
      value: value,
    });

    console.log("🔗 writeContract result:", result);
    return result;
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
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.MooveAuction.address as `0x${string}`,
    abi: contracts.MooveAuction.abi,
    functionName: functionName as any,
    args: args.length === 0 ? undefined : (args as [bigint]),
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
      abiLength: [
        "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
        "function getSealedBidRevealInfo(uint256 auctionId) view returns (bool isSealedBid, bool revealPhaseStarted, uint256 revealEndTime, bool isRevealPhaseActive, uint256 timeUntilRevealEnd)",
        "function endAuction(uint256 auctionId) external",
        "function startRevealPhase(uint256 auctionId) external",
        "function endRevealPhase(uint256 auctionId) external",
        "function settleAuction(uint256 auctionId) external",
        "function submitSealedBid(uint256 auctionId, bytes32 bidHash) external payable",
        "function revealSealedBid(uint256 auctionId, uint256 bidAmount, uint256 nonce) external",
        "function refundRemainingBidders(uint256 auctionId) external",
        "function getAuctionBids(uint256 auctionId) view returns (tuple(address bidder, uint256 bidAmount, bool isRevealed)[])",
        "function totalAuctions() view returns (uint256)",
        "event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 finalPrice, uint256 platformFee, uint256 royaltyFee)",
        "event AuctionExtended(uint256 indexed auctionId, address indexed bidder, uint256 extensionDuration, uint256 newEndTime, string reason)",
        "event BidRefunded(uint256 indexed auctionId, address indexed bidder, uint256 refundAmount)",
      ].length,
    });

    writeContract({
      address: contracts.MooveAuction.address as `0x${string}`,
      abi: [
        "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, address nftContract, uint256 tokenId, address seller, uint8 auctionType, uint256 startingPrice, uint256 reservePrice, uint256 buyNowPrice, uint256 currentPrice, uint256 startTime, uint256 endTime, uint256 bidIncrement, address highestBidder, uint256 highestBid, uint8 status, bool allowPartialFulfillment, uint256 minBidders, uint256 totalBidders, bool isSettled, uint256 extensionThreshold, uint256 extensionDuration, uint256 revealEndTime, bool revealPhaseStarted))",
        "function getSealedBidRevealInfo(uint256 auctionId) view returns (bool isSealedBid, bool revealPhaseStarted, uint256 revealEndTime, bool isRevealPhaseActive, uint256 timeUntilRevealEnd)",
        "function endAuction(uint256 auctionId) external",
        "function startRevealPhase(uint256 auctionId) external",
        "function endRevealPhase(uint256 auctionId) external",
        "function settleAuction(uint256 auctionId) external",
        "function submitSealedBid(uint256 auctionId, bytes32 bidHash) external payable",
        "function revealSealedBid(uint256 auctionId, uint256 bidAmount, uint256 nonce) external",
        "function refundRemainingBidders(uint256 auctionId) external",
        "function getAuctionBids(uint256 auctionId) view returns (tuple(address bidder, uint256 bidAmount, bool isRevealed)[])",
        "function totalAuctions() view returns (uint256)",
        "event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 finalPrice, uint256 platformFee, uint256 royaltyFee)",
        "event AuctionExtended(uint256 indexed auctionId, address indexed bidder, uint256 extensionDuration, uint256 newEndTime, string reason)",
        "event BidRefunded(uint256 indexed auctionId, address indexed bidder, uint256 refundAmount)",
      ],
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
) {
  return useReadContract({
    address: contracts.MooveRentalPass.address as `0x${string}`,
    abi: [
      "function hasRole(bytes32 role, address account) view returns (bool)",
      "function grantRole(bytes32 role, address account) external",
      "function revokeRole(bytes32 role, address account) external",
      "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
      "function MASTER_ADMIN_ROLE() view returns (bytes32)",
      "function MINTER_ROLE() view returns (bytes32)",
      "function AUCTION_MANAGER_ROLE() view returns (bytes32)",
    ] as any,
    functionName,
    args,
    ...options,
  });
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

// Hook to read MooveStickerNFT contracts (ACTIVE - uses MooveNFT contract)
export function useReadMooveStickerNFT<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: contracts.MooveNFT.address as `0x${string}`,
    abi: contracts.MooveNFT.abi as any,
    functionName,
    args,
    ...options,
  });
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
    const result = writeContract({
      address: contracts.MooveNFT.address as `0x${string}`,
      abi: [
        "function ownerOf(uint256 tokenId) view returns (address)",
        "function tokenURI(uint256 tokenId) view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
        "function transferFrom(address from, address to, uint256 tokenId) external",
        "function approve(address to, uint256 tokenId) external",
        "function getApproved(uint256 tokenId) view returns (address)",
        "function setApprovalForAll(address operator, bool approved) external",
        "function isApprovedForAll(address owner, address operator) view returns (bool)",
      ] as any,
      functionName: functionName as any,
      args: args as any,
    });

    console.log("🔗 writeContract result:", result);
    return result;
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

// Hook helper for auction operations (REMOVED - use useSecureNFTAuctionFlow instead)
// Note: useMooveAuctionOperations was a placeholder and is no longer needed

// Hook to read MooveAccessControl contracts (ACTIVE - currently deployed)
export function useReadMooveAccessControl<T = unknown>(
  functionName: string,
  args: readonly unknown[] = [],
  options?: { enabled?: boolean }
) {
  return useReadContract({
    address: contracts.MooveAccessControl.address as `0x${string}`,
    abi: contracts.MooveAccessControl.abi as any,
    functionName,
    args,
    ...options,
  });
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
      address: "0x005672EcC14b09A958742B960Ebb76eBE52Be44A" as `0x${string}`,
      abi: contracts.MooveRentalPass.abi as any,
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
