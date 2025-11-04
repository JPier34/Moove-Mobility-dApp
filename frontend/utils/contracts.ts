// Fallback contract addresses (from deployment - Sepolia testnet)
const FALLBACK_ADDRESSES: Record<string, string> = {
  NEXT_PUBLIC_MOOVE_NFT_ADDRESS: "0x40E455515bf712144C1A5D859F19d64b537754f7",
  NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS:
    "0xaBcF309597e6280aF5DBB0ce82778f048bC600f0",
  NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS:
    "0x74aAb47A0439B728A5956A1d7faAc6716F1F18Df",
  NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS:
    "0xd346AA5BcB802560446c1517AC61cD7F6935448b",
};

// Read addresses directly from environment variables with fallback
const getEnvAddress = (envVar: string): string => {
  const value = process.env[envVar]?.trim() || "";

  // Check if value is valid
  if (
    value &&
    value !== "your_..._address_here" &&
    value !== "0x..." &&
    value.startsWith("0x") &&
    value.length === 42
  ) {
    return value;
  }

  // Use fallback if available
  if (FALLBACK_ADDRESSES[envVar]) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `⚠️ [CONTRACTS] ${envVar} not set, using fallback address: ${FALLBACK_ADDRESSES[envVar]}`
      );
    }
    return FALLBACK_ADDRESSES[envVar];
  }

  // No fallback available
  if (process.env.NODE_ENV === "development") {
    console.warn(`⚠️ [CONTRACTS] Missing ${envVar} and no fallback available`);
  }
  return "";
};

export const contracts = {
  MooveNFT: {
    address: getEnvAddress("NEXT_PUBLIC_MOOVE_NFT_ADDRESS"),
    abi: require("@/src/abis/MooveNFT.json").abi,
  },
  MooveAccessControl: {
    address: getEnvAddress("NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS"),
    abi: (() => {
      const abiData = require("@/src/abis/MooveAccessControl.json");
      return Array.isArray(abiData) ? abiData : abiData.abi;
    })(),
  },
  MooveAuction: {
    address: getEnvAddress("NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS"),
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "_accessControl",
            type: "address",
          },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        inputs: [],
        name: "EnforcedPause",
        type: "error",
      },
      {
        inputs: [],
        name: "ExpectedPause",
        type: "error",
      },
      {
        inputs: [],
        name: "ReentrancyGuardReentrantCall",
        type: "error",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "AuctionCancelled",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "seller",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "nftContract",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "enum MooveAuction.AuctionType",
            name: "auctionType",
            type: "uint8",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "startingPrice",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "duration",
            type: "uint256",
          },
        ],
        name: "AuctionCreated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "AuctionEnded",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "extensionDuration",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "newEndTime",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "AuctionExtended",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "winner",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "finalPrice",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "platformFee",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "royaltyFee",
            type: "uint256",
          },
        ],
        name: "AuctionSettled",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "refundedCount",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "startIndex",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "endIndex",
            type: "uint256",
          },
        ],
        name: "BatchRefundCompleted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "bool",
            name: "isHighestBid",
            type: "bool",
          },
        ],
        name: "BidPlaced",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "BidRefunded",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "newPrice",
            type: "uint256",
          },
        ],
        name: "DutchPriceUpdate",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "refundedCount",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "startIndex",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "endIndex",
            type: "uint256",
          },
        ],
        name: "EmergencyBatchRefundCompleted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "refundedCount",
            type: "uint256",
          },
        ],
        name: "EmergencyRefundCompleted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "EmergencySettlement",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "Paused",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "reservePrice",
            type: "uint256",
          },
        ],
        name: "ReserveReached",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "penaltyAmount",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "SealedBidPenaltyApplied",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "SealedBidRevealed",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            indexed: false,
            internalType: "bytes32",
            name: "bidHash",
            type: "bytes32",
          },
        ],
        name: "SealedBidSubmitted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address[]",
            name: "tiedBidders",
            type: "address[]",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "tieAmount",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "address",
            name: "winner",
            type: "address",
          },
          {
            indexed: false,
            internalType: "string",
            name: "tieBreaker",
            type: "string",
          },
        ],
        name: "SealedBidTie",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "Unpaused",
        type: "event",
      },
      {
        stateMutability: "payable",
        type: "fallback",
      },
      {
        inputs: [],
        name: "DEFAULT_EXTENSION_DURATION",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "DEFAULT_EXTENSION_THRESHOLD",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "MAX_AUCTION_DURATION",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "MAX_BIDS_PER_AUCTION",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "MAX_EXTENSION_DURATION",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "MIN_AUCTION_DURATION",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "MIN_BID_INTERVAL",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "MIN_SEALED_BID_DEPOSIT_PERCENTAGE",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "SEALED_BID_PENALTY_PERCENTAGE",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "accessControl",
        outputs: [
          {
            internalType: "contract MooveAccessControl",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "auctionBids",
        outputs: [
          {
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            internalType: "uint128",
            name: "amount",
            type: "uint128",
          },
          {
            internalType: "uint32",
            name: "timestamp",
            type: "uint32",
          },
          {
            internalType: "bool",
            name: "isWinning",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "isRefunded",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "auctions",
        outputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "nftContract",
            type: "address",
          },
          {
            internalType: "uint96",
            name: "tokenId",
            type: "uint96",
          },
          {
            internalType: "address",
            name: "seller",
            type: "address",
          },
          {
            internalType: "enum MooveAuction.AuctionType",
            name: "auctionType",
            type: "uint8",
          },
          {
            internalType: "enum MooveAuction.AuctionStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "allowPartialFulfillment",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "isSettled",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "revealPhaseStarted",
            type: "bool",
          },
          {
            internalType: "uint128",
            name: "startingPrice",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "reservePrice",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "buyNowPrice",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "currentPrice",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "bidIncrement",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "highestBid",
            type: "uint128",
          },
          {
            internalType: "uint32",
            name: "startTime",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "endTime",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "extensionThreshold",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "extensionDuration",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "revealEndTime",
            type: "uint32",
          },
          {
            internalType: "address",
            name: "highestBidder",
            type: "address",
          },
          {
            internalType: "uint32",
            name: "minBidders",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "totalBidders",
            type: "uint32",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "buyNowDutch",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "cancelAuction",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "nftContract",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "enum MooveAuction.AuctionType",
            name: "auctionType",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "startingPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "reservePrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "buyNowPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "bidIncrement",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "extensionThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "extensionDuration",
            type: "uint256",
          },
        ],
        name: "createAuction",
        outputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "startIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "batchSize",
            type: "uint256",
          },
        ],
        name: "emergencyBatchRefund",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "emergencyCancel",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "emergencyRefundBidders",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "emergencySettle",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "endAuction",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "additionalTime",
            type: "uint256",
          },
        ],
        name: "extendAuction",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "getActiveAuctions",
        outputs: [
          {
            internalType: "uint256[]",
            name: "activeAuctions",
            type: "uint256[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "getAuction",
        outputs: [
          {
            components: [
              {
                internalType: "uint256",
                name: "auctionId",
                type: "uint256",
              },
              {
                internalType: "address",
                name: "nftContract",
                type: "address",
              },
              {
                internalType: "uint96",
                name: "tokenId",
                type: "uint96",
              },
              {
                internalType: "address",
                name: "seller",
                type: "address",
              },
              {
                internalType: "enum MooveAuction.AuctionType",
                name: "auctionType",
                type: "uint8",
              },
              {
                internalType: "enum MooveAuction.AuctionStatus",
                name: "status",
                type: "uint8",
              },
              {
                internalType: "bool",
                name: "allowPartialFulfillment",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "isSettled",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "revealPhaseStarted",
                type: "bool",
              },
              {
                internalType: "uint128",
                name: "startingPrice",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "reservePrice",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "buyNowPrice",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "currentPrice",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "bidIncrement",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "highestBid",
                type: "uint128",
              },
              {
                internalType: "uint32",
                name: "startTime",
                type: "uint32",
              },
              {
                internalType: "uint32",
                name: "endTime",
                type: "uint32",
              },
              {
                internalType: "uint32",
                name: "extensionThreshold",
                type: "uint32",
              },
              {
                internalType: "uint32",
                name: "extensionDuration",
                type: "uint32",
              },
              {
                internalType: "uint32",
                name: "revealEndTime",
                type: "uint32",
              },
              {
                internalType: "address",
                name: "highestBidder",
                type: "address",
              },
              {
                internalType: "uint32",
                name: "minBidders",
                type: "uint32",
              },
              {
                internalType: "uint32",
                name: "totalBidders",
                type: "uint32",
              },
            ],
            internalType: "struct MooveAuction.Auction",
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "getAuctionBids",
        outputs: [
          {
            components: [
              {
                internalType: "address",
                name: "bidder",
                type: "address",
              },
              {
                internalType: "uint128",
                name: "amount",
                type: "uint128",
              },
              {
                internalType: "uint32",
                name: "timestamp",
                type: "uint32",
              },
              {
                internalType: "bool",
                name: "isWinning",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "isRefunded",
                type: "bool",
              },
            ],
            internalType: "struct MooveAuction.Bid[]",
            name: "",
            type: "tuple[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "getAuctionExtensionInfo",
        outputs: [
          {
            internalType: "uint256",
            name: "extensionThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "extensionDuration",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isInExtensionZone",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "timeUntilExtensionZone",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getAuctionStats",
        outputs: [
          {
            internalType: "uint256",
            name: "totalAuctionsCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "activeAuctionsCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "settledAuctionsCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "cancelledAuctionsCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalVolume",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getAuctionTypeDistribution",
        outputs: [
          {
            internalType: "uint256",
            name: "englishCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "dutchCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "sealedBidCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "reserveCount",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "enum MooveAuction.AuctionType",
            name: "auctionType",
            type: "uint8",
          },
        ],
        name: "getAuctionsByType",
        outputs: [
          {
            internalType: "uint256[]",
            name: "matchingAuctions",
            type: "uint256[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "getDutchPrice",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getEndingSoonAuctions",
        outputs: [
          {
            internalType: "uint256[]",
            name: "endingSoon",
            type: "uint256[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "getSealedBidRevealInfo",
        outputs: [
          {
            internalType: "bool",
            name: "isSealedBid",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "revealPhaseStarted",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "revealEndTime",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isRevealPhaseActive",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "timeUntilRevealEnd",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "getUserAuctions",
        outputs: [
          {
            internalType: "uint256[]",
            name: "",
            type: "uint256[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "getUserBids",
        outputs: [
          {
            internalType: "uint256[]",
            name: "",
            type: "uint256[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "hasRevealed",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "hasUserBid",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "lastBidTime",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "minimumBidIncrement",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "pause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "paused",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "placeBid",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "platformFeePercentage",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "startIndex",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "batchSize",
            type: "uint256",
          },
        ],
        name: "refundRemainingBidders",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "sealedBidDeposits",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "sealedBidPenalties",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        name: "sealedBids",
        outputs: [
          {
            internalType: "bytes32",
            name: "",
            type: "bytes32",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        name: "settleAuction",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "bidHash",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "submitSealedBid",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "totalAuctions",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "unpause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "newIncrement",
            type: "uint256",
          },
        ],
        name: "updateMinimumBidIncrement",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "newFeePercentage",
            type: "uint256",
          },
        ],
        name: "updatePlatformFee",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "userAuctions",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "userBids",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "withdrawPlatformFees",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        stateMutability: "payable",
        type: "receive",
      },
    ],
  },
  MooveRentalPass: {
    address: getEnvAddress("NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS"),
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "_accessControl",
            type: "address",
          },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
        ],
        name: "ERC721IncorrectOwner",
        type: "error",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "ERC721InsufficientApproval",
        type: "error",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "approver",
            type: "address",
          },
        ],
        name: "ERC721InvalidApprover",
        type: "error",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
        ],
        name: "ERC721InvalidOperator",
        type: "error",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
        ],
        name: "ERC721InvalidOwner",
        type: "error",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "receiver",
            type: "address",
          },
        ],
        name: "ERC721InvalidReceiver",
        type: "error",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
        ],
        name: "ERC721InvalidSender",
        type: "error",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "ERC721NonexistentToken",
        type: "error",
      },
      {
        inputs: [],
        name: "EnforcedPause",
        type: "error",
      },
      {
        inputs: [],
        name: "ExpectedPause",
        type: "error",
      },
      {
        inputs: [],
        name: "ReentrancyGuardReentrantCall",
        type: "error",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "length",
            type: "uint256",
          },
        ],
        name: "StringsInsufficientHexLength",
        type: "error",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "accessCode",
            type: "string",
          },
          {
            indexed: true,
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "AccessCodeUsed",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "oldAccessControl",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "newAccessControl",
            type: "address",
          },
        ],
        name: "AccessControlUpdated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "approved",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Approval",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "operator",
            type: "address",
          },
          {
            indexed: false,
            internalType: "bool",
            name: "approved",
            type: "bool",
          },
        ],
        name: "ApprovalForAll",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "_fromTokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "_toTokenId",
            type: "uint256",
          },
        ],
        name: "BatchMetadataUpdate",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "_tokenId",
            type: "uint256",
          },
        ],
        name: "MetadataUpdate",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "PassDeactivated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "PassExpired",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "Paused",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            indexed: false,
            internalType: "enum MooveRentalPass.VehicleType",
            name: "vehicleType",
            type: "uint8",
          },
          {
            indexed: false,
            internalType: "string",
            name: "accessCode",
            type: "string",
          },
          {
            indexed: false,
            internalType: "string",
            name: "location",
            type: "string",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
        ],
        name: "RentalPassMinted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "Unpaused",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint8",
            name: "vehicleType",
            type: "uint8",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "priceWei",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "string",
            name: "name",
            type: "string",
          },
        ],
        name: "VehicleConfigUpdated",
        type: "event",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        name: "accessCodeToToken",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "accessControl",
        outputs: [
          {
            internalType: "contract MooveAccessControl",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "approve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address[]",
            name: "recipients",
            type: "address[]",
          },
          {
            internalType: "enum MooveRentalPass.VehicleType[]",
            name: "vehicleTypes",
            type: "uint8[]",
          },
          {
            internalType: "string[]",
            name: "accessCodes",
            type: "string[]",
          },
          {
            internalType: "string[]",
            name: "locations",
            type: "string[]",
          },
          {
            internalType: "uint256[]",
            name: "prices",
            type: "uint256[]",
          },
          {
            internalType: "string[]",
            name: "tokenURIs",
            type: "string[]",
          },
        ],
        name: "batchMintRentalPasses",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "burnRentalPass",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256[]",
            name: "tokenIds",
            type: "uint256[]",
          },
        ],
        name: "cleanupExpiredPasses",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "reason",
            type: "string",
          },
        ],
        name: "deactivatePass",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "getApproved",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "getPassesExpiringSoon",
        outputs: [
          {
            internalType: "uint256[]",
            name: "expiringPasses",
            type: "uint256[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "getRentalPass",
        outputs: [
          {
            components: [
              {
                internalType: "enum MooveRentalPass.VehicleType",
                name: "vehicleType",
                type: "uint8",
              },
              {
                internalType: "string",
                name: "accessCode",
                type: "string",
              },
              {
                internalType: "uint256",
                name: "expirationDate",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "purchasePrice",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "location",
                type: "string",
              },
              {
                internalType: "bool",
                name: "isActive",
                type: "bool",
              },
              {
                internalType: "address",
                name: "originalOwner",
                type: "address",
              },
            ],
            internalType: "struct MooveRentalPass.RentalPass",
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "accessCode",
            type: "string",
          },
        ],
        name: "getTokenByAccessCode",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "getUserActivePasses",
        outputs: [
          {
            internalType: "uint256[]",
            name: "",
            type: "uint256[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "getUserActivePassesWithDetails",
        outputs: [
          {
            components: [
              {
                internalType: "enum MooveRentalPass.VehicleType",
                name: "vehicleType",
                type: "uint8",
              },
              {
                internalType: "string",
                name: "accessCode",
                type: "string",
              },
              {
                internalType: "uint256",
                name: "expirationDate",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "purchasePrice",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "location",
                type: "string",
              },
              {
                internalType: "bool",
                name: "isActive",
                type: "bool",
              },
              {
                internalType: "address",
                name: "originalOwner",
                type: "address",
              },
            ],
            internalType: "struct MooveRentalPass.RentalPass[]",
            name: "activePasses",
            type: "tuple[]",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "enum MooveRentalPass.VehicleType",
            name: "vehicleType",
            type: "uint8",
          },
        ],
        name: "getVehiclePrice",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "accessCode",
            type: "string",
          },
        ],
        name: "isAccessCodeValid",
        outputs: [
          {
            internalType: "bool",
            name: "valid",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expirationDate",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
        ],
        name: "isApprovedForAll",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "isPassActive",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "isPassExpired",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "enum MooveRentalPass.VehicleType",
            name: "vehicleType",
            type: "uint8",
          },
          {
            internalType: "string",
            name: "cityId",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256",
          },
        ],
        name: "mintRentalPassPublic",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "name",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "ownerOf",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "pause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "paused",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "rentalPasses",
        outputs: [
          {
            internalType: "enum MooveRentalPass.VehicleType",
            name: "vehicleType",
            type: "uint8",
          },
          {
            internalType: "string",
            name: "accessCode",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "expirationDate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "purchasePrice",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "location",
            type: "string",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
          {
            internalType: "address",
            name: "originalOwner",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
          {
            internalType: "bool",
            name: "approved",
            type: "bool",
          },
        ],
        name: "setApprovalForAll",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint8",
            name: "vehicleType",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "priceWei",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
        ],
        name: "setVehicleConfig",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "bytes4",
            name: "interfaceId",
            type: "bytes4",
          },
        ],
        name: "supportsInterface",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "symbol",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "tokenURI",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "totalSupply",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "transferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "unpause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "_newAccessControl",
            type: "address",
          },
        ],
        name: "updateAccessControl",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        name: "userActivePasses",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "accessCode",
            type: "string",
          },
        ],
        name: "validateAndUseAccessCode",
        outputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "enum MooveRentalPass.VehicleType",
            name: "vehicleType",
            type: "uint8",
          },
        ],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint8",
            name: "",
            type: "uint8",
          },
        ],
        name: "vehicleConfigs",
        outputs: [
          {
            internalType: "uint256",
            name: "priceWei",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
  },
} as const;

// Re-export addresses for backward compatibility
export const CONTRACT_ADDRESSES = {
  ACCESS_CONTROL: contracts.MooveAccessControl.address,
  MOOVE_NFT: contracts.MooveNFT.address,
  MOOVE_AUCTION: contracts.MooveAuction.address,
  MOOVE_RENTAL_PASS: contracts.MooveRentalPass.address,
} as const;

// Wagmi contract configs (for useReadContract, useWriteContract, etc.)
export const auctionContractConfig = {
  address: contracts.MooveAuction.address as `0x${string}`,
  abi: contracts.MooveAuction.abi,
} as const;

// MooveAccessControl ABI is an array directly, not an object with abi property
const accessControlABI = require("@/src/abis/MooveAccessControl.json");
export const accessControlContractConfig = {
  address: contracts.MooveAccessControl.address as `0x${string}`,
  abi: Array.isArray(accessControlABI)
    ? accessControlABI
    : accessControlABI.abi,
} as const;

// Vehicle type constants for MooveRentalPass
export const VEHICLE_TYPES = {
  BIKE: 0,
  SCOOTER: 1,
  MONOPATTINO: 2,
} as const;

// Vehicle prices (in ETH)
export const VEHICLE_PRICES = {
  bike: "0.00000075",
  scooter: "0.000001",
  monopattino: "0.00000125",
} as const;
