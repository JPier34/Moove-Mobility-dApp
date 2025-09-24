// Moove dApp Contract Configuration
// Centralized contract addresses and ABIs for modular management

// Contract Addresses (Updated with deployed contracts)
export const CONTRACT_ADDRESSES = {
  MooveAccessControl: "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42",
  MooveNFT: "0x40E455515bf712144C1A5D859F19d64b537754f7",
  MooveAuction: "0x463a4fff0796AF7C69788463629AeF046A2fc211",
  MooveRentalPass: "0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a",
} as const;

// Auction Types
export const AUCTION_TYPES = {
  ENGLISH: 0,
  DUTCH: 1,
  SEALED_BID: 2,
  RESERVE: 3,
} as const;

// Auction Status
export const AUCTION_STATUS = {
  ACTIVE: 0,
  REVEAL: 1,
  ENDED: 2,
  SETTLED: 3,
  CANCELLED: 4,
} as const;

// Vehicle Types
export const VEHICLE_TYPES = {
  CAR: 0,
  MOTORCYCLE: 1,
  SCOOTER: 2,
  BICYCLE: 3,
} as const;

// Vehicle Prices (in ETH)
export const VEHICLE_PRICES = {
  CAR: "0.1",
  MOTORCYCLE: "0.05",
  SCOOTER: "0.03",
  BICYCLE: "0.01",
} as const;

// Role Constants
export const ROLES = {
  DEFAULT_ADMIN_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  MASTER_ADMIN_ROLE:
    "0xf83591f6d256ac9a12084d6de9c89a3e1fd09d594aa1184c76eef05bae103fc3",
  MINTER_ROLE:
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  AUCTION_MANAGER_ROLE:
    "0xfc15875e223f196de4d28f104664030b8067b4a40d0372ee3095567046e5e0b3",
} as const;

// Contract ABIs - Simplified and Essential Functions Only

// MooveAccessControl ABI
export const MooveAccessControlABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
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
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
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
    inputs: [],
    name: "MASTER_ADMIN_ROLE",
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
    inputs: [],
    name: "MINTER_ROLE",
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
    inputs: [],
    name: "AUCTION_MANAGER_ROLE",
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
] as const;

// MooveNFT ABI
export const MooveNFTABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "tokenName",
        type: "string",
      },
      {
        internalType: "string",
        name: "tokenSymbol",
        type: "string",
      },
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
        internalType: "uint256",
        name: "numerator",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "denominator",
        type: "uint256",
      },
    ],
    name: "ERC2981InvalidDefaultRoyalty",
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
    name: "ERC2981InvalidDefaultRoyaltyReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "numerator",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "denominator",
        type: "uint256",
      },
    ],
    name: "ERC2981InvalidTokenRoyalty",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC2981InvalidTokenRoyaltyReceiver",
    type: "error",
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
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "bool",
            name: "allowColorChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowTextChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowSizeChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowEffectsChange",
            type: "bool",
          },
          {
            internalType: "string[]",
            name: "availableColors",
            type: "string[]",
          },
          {
            internalType: "uint256",
            name: "maxTextLength",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct MooveNFT.CustomizationOptions",
        name: "newOptions",
        type: "tuple",
      },
    ],
    name: "CustomizationOptionsUpdated",
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
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "NFTMinted",
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
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint96",
        name: "feeNumerator",
        type: "uint96",
      },
    ],
    name: "RoyaltyUpdated",
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
        name: "customizer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "changeDescription",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "newState",
        type: "string",
      },
    ],
    name: "StickerCustomized",
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
        name: "creator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "enum MooveNFT.StickerCategory",
        name: "category",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "enum MooveNFT.StickerRarity",
        name: "rarity",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isLimitedEdition",
        type: "bool",
      },
    ],
    name: "StickerMinted",
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
        internalType: "string",
        name: "editionName",
        type: "string",
      },
      {
        internalType: "string",
        name: "editionDescription",
        type: "string",
      },
      {
        internalType: "enum MooveNFT.StickerCategory",
        name: "category",
        type: "uint8",
      },
      {
        internalType: "enum MooveNFT.StickerRarity",
        name: "rarity",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "editionSize",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "bool",
            name: "allowColorChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowTextChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowSizeChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowEffectsChange",
            type: "bool",
          },
          {
            internalType: "string[]",
            name: "availableColors",
            type: "string[]",
          },
          {
            internalType: "uint256",
            name: "maxTextLength",
            type: "uint256",
          },
        ],
        internalType: "struct MooveNFT.CustomizationOptions",
        name: "customizationOptions",
        type: "tuple",
      },
      {
        internalType: "string[]",
        name: "tokenURIs",
        type: "string[]",
      },
      {
        internalType: "address",
        name: "royaltyRecipient",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "royaltyPercentage",
        type: "uint96",
      },
    ],
    name: "batchMintLimitedEdition",
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
    name: "burn",
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
    name: "creatorStickers",
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
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "customizationHistory",
    outputs: [
      {
        internalType: "address",
        name: "customizer",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "timestamp",
        type: "uint32",
      },
      {
        internalType: "string",
        name: "changeDescription",
        type: "string",
      },
      {
        internalType: "string",
        name: "previousState",
        type: "string",
      },
      {
        internalType: "string",
        name: "newState",
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
      {
        internalType: "string",
        name: "changeDescription",
        type: "string",
      },
      {
        internalType: "string",
        name: "newState",
        type: "string",
      },
      {
        internalType: "string",
        name: "newTokenURI",
        type: "string",
      },
    ],
    name: "customizeSticker",
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
        name: "creator",
        type: "address",
      },
    ],
    name: "getCreatorStickers",
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
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getCustomizationHistory",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "customizer",
            type: "address",
          },
          {
            internalType: "uint32",
            name: "timestamp",
            type: "uint32",
          },
          {
            internalType: "string",
            name: "changeDescription",
            type: "string",
          },
          {
            internalType: "string",
            name: "previousState",
            type: "string",
          },
          {
            internalType: "string",
            name: "newState",
            type: "string",
          },
        ],
        internalType: "struct MooveNFT.CustomizationHistory[]",
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
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getSticker",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "enum MooveNFT.StickerCategory",
            name: "category",
            type: "uint8",
          },
          {
            internalType: "enum MooveNFT.StickerRarity",
            name: "rarity",
            type: "uint8",
          },
          {
            internalType: "address",
            name: "creator",
            type: "address",
          },
          {
            internalType: "uint32",
            name: "creationDate",
            type: "uint32",
          },
          {
            internalType: "bool",
            name: "isLimitedEdition",
            type: "bool",
          },
          {
            internalType: "uint32",
            name: "editionSize",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "editionNumber",
            type: "uint32",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "allowColorChange",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "allowTextChange",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "allowSizeChange",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "allowEffectsChange",
                type: "bool",
              },
              {
                internalType: "string[]",
                name: "availableColors",
                type: "string[]",
              },
              {
                internalType: "uint256",
                name: "maxTextLength",
                type: "uint256",
              },
            ],
            internalType: "struct MooveNFT.CustomizationOptions",
            name: "customization",
            type: "tuple",
          },
        ],
        internalType: "struct MooveNFT.StickerNFT",
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
    name: "isCustomizable",
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
    name: "isStickerCustomizable",
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
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "string",
        name: "metadataURI",
        type: "string",
      },
    ],
    name: "mintNFT",
    outputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
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
        internalType: "string",
        name: "stickerName",
        type: "string",
      },
      {
        internalType: "string",
        name: "metadataURI",
        type: "string",
      },
      {
        internalType: "enum MooveNFT.StickerCategory",
        name: "category",
        type: "uint8",
      },
      {
        internalType: "enum MooveNFT.StickerRarity",
        name: "rarity",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "isLimitedEdition",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "editionSize",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "bool",
            name: "allowColorChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowTextChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowSizeChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowEffectsChange",
            type: "bool",
          },
          {
            internalType: "string[]",
            name: "availableColors",
            type: "string[]",
          },
          {
            internalType: "uint256",
            name: "maxTextLength",
            type: "uint256",
          },
        ],
        internalType: "struct MooveNFT.CustomizationOptions",
        name: "customizationOptions",
        type: "tuple",
      },
      {
        internalType: "string",
        name: "editionName",
        type: "string",
      },
      {
        internalType: "address",
        name: "royaltyRecipient",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "royaltyPercentage",
        type: "uint96",
      },
    ],
    name: "mintStickerNFT",
    outputs: [],
    stateMutability: "nonpayable",
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
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "salePrice",
        type: "uint256",
      },
    ],
    name: "royaltyInfo",
    outputs: [
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
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "stickers",
    outputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "enum MooveNFT.StickerCategory",
        name: "category",
        type: "uint8",
      },
      {
        internalType: "enum MooveNFT.StickerRarity",
        name: "rarity",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "creationDate",
        type: "uint32",
      },
      {
        internalType: "bool",
        name: "isLimitedEdition",
        type: "bool",
      },
      {
        internalType: "uint32",
        name: "editionSize",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "editionNumber",
        type: "uint32",
      },
      {
        components: [
          {
            internalType: "bool",
            name: "allowColorChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowTextChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowSizeChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowEffectsChange",
            type: "bool",
          },
          {
            internalType: "string[]",
            name: "availableColors",
            type: "string[]",
          },
          {
            internalType: "uint256",
            name: "maxTextLength",
            type: "uint256",
          },
        ],
        internalType: "struct MooveNFT.CustomizationOptions",
        name: "customization",
        type: "tuple",
      },
    ],
    stateMutability: "view",
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
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "bool",
            name: "allowColorChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowTextChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowSizeChange",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "allowEffectsChange",
            type: "bool",
          },
          {
            internalType: "string[]",
            name: "availableColors",
            type: "string[]",
          },
          {
            internalType: "uint256",
            name: "maxTextLength",
            type: "uint256",
          },
        ],
        internalType: "struct MooveNFT.CustomizationOptions",
        name: "newOptions",
        type: "tuple",
      },
    ],
    name: "updateCustomizationOptions",
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
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "feeNumerator",
        type: "uint96",
      },
    ],
    name: "updateTokenRoyalty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// MooveAuction ABI
export const MooveAuctionABI = [
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
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
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
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
        name: "currentPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "startTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "endTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bidIncrement",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "highestBidder",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "highestBid",
        type: "uint256",
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
        internalType: "uint256",
        name: "minBidders",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalBidders",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isSettled",
        type: "bool",
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
      {
        internalType: "uint256",
        name: "revealEndTime",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "revealPhaseStarted",
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
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "commitment",
        type: "bytes32",
      },
    ],
    name: "commitToBuyDutch",
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
    name: "commitmentDeadlines",
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
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "dutchCommitments",
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
    ],
    name: "endRevealPhase",
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
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
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
            name: "currentPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "bidIncrement",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "highestBidder",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "highestBid",
            type: "uint256",
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
            internalType: "uint256",
            name: "minBidders",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalBidders",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isSettled",
            type: "bool",
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
          {
            internalType: "uint256",
            name: "revealEndTime",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "revealPhaseStarted",
            type: "bool",
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
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
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
        name: "auctionId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bidAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
    ],
    name: "revealSealedBid",
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
    ],
    name: "startRevealPhase",
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
] as const;

// MooveRentalPass ABI
export const MooveRentalPassABI = [
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
] as const;

// Contract Objects for Easy Access
export const contracts = {
  MooveAccessControl: {
    address: CONTRACT_ADDRESSES.MooveAccessControl,
    abi: MooveAccessControlABI,
  },
  MooveNFT: {
    address: CONTRACT_ADDRESSES.MooveNFT,
    abi: MooveNFTABI,
  },
  MooveAuction: {
    address: CONTRACT_ADDRESSES.MooveAuction,
    abi: MooveAuctionABI,
  },
  MooveRentalPass: {
    address: CONTRACT_ADDRESSES.MooveRentalPass,
    abi: MooveRentalPassABI,
  },
} as const;

// Legacy exports for backward compatibility
export const CONTRACT_ABIS = {
  MooveAccessControl: MooveAccessControlABI,
  MooveNFT: MooveNFTABI,
  MooveAuction: MooveAuctionABI,
  MooveRentalPass: MooveRentalPassABI,
} as const;
