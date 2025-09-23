// Auto-generated contract configuration - MODULAR SOLUTION
export const contracts = {
  MooveAccessControl: {
    address: "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42",
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "_admin",
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
            name: "account",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "role",
            type: "bytes32",
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
            internalType: "address",
            name: "contractAddress",
            type: "address",
          },
        ],
        name: "authorizeContract",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
  },
  MooveNFT: {
    address: "0x40E455515bf712144C1A5D859F19d64b537754f7",
    abi: [
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
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "string",
            name: "tokenURI",
            type: "string",
          },
        ],
        name: "mintNFT",
        outputs: [
          {
            internalType: "uint256",
            name: "",
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
    ],
  },
  MooveAuction: {
    address: "0xd13E0582e7f13a8260A7C768B641e8C1Aee26585",
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
            name: "nftContract",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint8",
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
        name: "placeBid",
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
                internalType: "uint8",
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
                name: "highestBid",
                type: "uint256",
              },
              {
                internalType: "address",
                name: "highestBidder",
                type: "address",
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
                internalType: "uint8",
                name: "status",
                type: "uint8",
              },
              {
                internalType: "bool",
                name: "isSettled",
                type: "bool",
              },
              {
                internalType: "uint256",
                name: "totalBidders",
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
            internalType: "struct MooveAuction.Auction",
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
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
    ],
  },
  MooveRentalPass: {
    address: "0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a",
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
    ],
  },
} as const;

// Contract addresses for easy access
export const CONTRACT_ADDRESSES = {
  MOOVE_ACCESS_CONTROL: "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42",
  MOOVE_NFT: "0x40E455515bf712144C1A5D859F19d64b537754f7",
  MOOVE_AUCTION: "0xd13E0582e7f13a8260A7C768B641e8C1Aee26585",
  MOOVE_RENTAL_PASS: "0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a",
} as const;

// Auction type constants
export const AUCTION_TYPES = {
  ENGLISH: 0,
  DUTCH: 1,
  SEALED_BID: 2,
  RESERVE: 3,
} as const;

// Auction status constants
export const AUCTION_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  REVEAL: 2,
  ENDED: 3,
  SETTLED: 4,
  CANCELLED: 5,
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

// Access Control Roles
export const ROLES = {
  DEFAULT_ADMIN_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  MASTER_ADMIN_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000001",
  MINTER_ROLE:
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  AUCTION_MANAGER_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000002",
  WITHDRAWER_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000003",
  PAUSER_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000004",
} as const;
