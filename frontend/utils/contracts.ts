// Auto-generated contract configuration - MODULAR SOLUTION
export const contracts = {
  MooveAccessControl: {
    address: "0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42",
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "initialAdmin",
            type: "address",
          },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
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
      {
        inputs: [],
        name: "WITHDRAWER_ROLE",
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
        name: "PAUSER_ROLE",
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
      {
        inputs: [
          {
            internalType: "address",
            name: "contractAddress",
            type: "address",
          },
        ],
        name: "deauthorizeContract",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "canMint",
        outputs: [
          {
            internalType: "bool",
            name: "hasMinterRole",
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
            name: "account",
            type: "address",
          },
        ],
        name: "canManageAuctions",
        outputs: [
          {
            internalType: "bool",
            name: "hasAuctionRole",
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
            name: "account",
            type: "address",
          },
        ],
        name: "canWithdraw",
        outputs: [
          {
            internalType: "bool",
            name: "hasWithdrawRole",
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
            name: "account",
            type: "address",
          },
        ],
        name: "canPause",
        outputs: [
          {
            internalType: "bool",
            name: "hasPauserRole",
            type: "bool",
          },
        ],
        stateMutability: "view",
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
    ],
  },
  MooveAuction: {
    address: "0x6eC7eeB61A8C5b37F7e1812E16c353fe00B1A84D",
    abi: [
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "_accessControl",
                        "type": "address"
                  }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "AuctionCancelled",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "seller",
                        "type": "address"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "nftContract",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "enum MooveAuction.AuctionType",
                        "name": "auctionType",
                        "type": "uint8"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "startingPrice",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "duration",
                        "type": "uint256"
                  }
            ],
            "name": "AuctionCreated",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "AuctionEnded",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "extensionDuration",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newEndTime",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "AuctionExtended",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "winner",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "finalPrice",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "platformFee",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "royaltyFee",
                        "type": "uint256"
                  }
            ],
            "name": "AuctionSettled",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "refundedCount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "startIndex",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "endIndex",
                        "type": "uint256"
                  }
            ],
            "name": "BatchRefundCompleted",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "bool",
                        "name": "isHighestBid",
                        "type": "bool"
                  }
            ],
            "name": "BidPlaced",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  }
            ],
            "name": "BidRefunded",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newPrice",
                        "type": "uint256"
                  }
            ],
            "name": "DutchPriceUpdate",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "refundedCount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "startIndex",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "endIndex",
                        "type": "uint256"
                  }
            ],
            "name": "EmergencyBatchRefundCompleted",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "refundedCount",
                        "type": "uint256"
                  }
            ],
            "name": "EmergencyRefundCompleted",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "EmergencySettlement",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": false,
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  }
            ],
            "name": "Paused",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "reservePrice",
                        "type": "uint256"
                  }
            ],
            "name": "ReserveReached",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "penaltyAmount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "SealedBidPenaltyApplied",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  }
            ],
            "name": "SealedBidRevealed",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "bytes32",
                        "name": "bidHash",
                        "type": "bytes32"
                  }
            ],
            "name": "SealedBidSubmitted",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "address[]",
                        "name": "tiedBidders",
                        "type": "address[]"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "tieAmount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "address",
                        "name": "winner",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "tieBreaker",
                        "type": "string"
                  }
            ],
            "name": "SealedBidTie",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": false,
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  }
            ],
            "name": "Unpaused",
            "type": "event"
      },
      {
            "inputs": [],
            "name": "DEFAULT_EXTENSION_DURATION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "DEFAULT_EXTENSION_THRESHOLD",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MAX_AUCTION_DURATION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MAX_BIDS_PER_AUCTION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MAX_EXTENSION_DURATION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MIN_AUCTION_DURATION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MIN_BID_INTERVAL",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MIN_SEALED_BID_DEPOSIT_PERCENTAGE",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "SEALED_BID_PENALTY_PERCENTAGE",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "accessControl",
            "outputs": [
                  {
                        "internalType": "contract MooveAccessControl",
                        "name": "",
                        "type": "address"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "auctionBids",
            "outputs": [
                  {
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "internalType": "uint128",
                        "name": "amount",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                  },
                  {
                        "internalType": "bool",
                        "name": "isWinning",
                        "type": "bool"
                  },
                  {
                        "internalType": "bool",
                        "name": "isRefunded",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "auctions",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "nftContract",
                        "type": "address"
                  },
                  {
                        "internalType": "uint96",
                        "name": "tokenId",
                        "type": "uint96"
                  },
                  {
                        "internalType": "address",
                        "name": "seller",
                        "type": "address"
                  },
                  {
                        "internalType": "enum MooveAuction.AuctionType",
                        "name": "auctionType",
                        "type": "uint8"
                  },
                  {
                        "internalType": "enum MooveAuction.AuctionStatus",
                        "name": "status",
                        "type": "uint8"
                  },
                  {
                        "internalType": "bool",
                        "name": "allowPartialFulfillment",
                        "type": "bool"
                  },
                  {
                        "internalType": "bool",
                        "name": "isSettled",
                        "type": "bool"
                  },
                  {
                        "internalType": "bool",
                        "name": "revealPhaseStarted",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint128",
                        "name": "startingPrice",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "reservePrice",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "buyNowPrice",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "currentPrice",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "bidIncrement",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "highestBid",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint32",
                        "name": "startTime",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "endTime",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "extensionThreshold",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "extensionDuration",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "revealEndTime",
                        "type": "uint32"
                  },
                  {
                        "internalType": "address",
                        "name": "highestBidder",
                        "type": "address"
                  },
                  {
                        "internalType": "uint32",
                        "name": "minBidders",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "totalBidders",
                        "type": "uint32"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "buyNowDutch",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "cancelAuction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "nftContract",
                        "type": "address"
                  },
                  {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "enum MooveAuction.AuctionType",
                        "name": "auctionType",
                        "type": "uint8"
                  },
                  {
                        "internalType": "uint256",
                        "name": "startingPrice",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "reservePrice",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "buyNowPrice",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "duration",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "bidIncrement",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "extensionThreshold",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "extensionDuration",
                        "type": "uint256"
                  }
            ],
            "name": "createAuction",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "startIndex",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "batchSize",
                        "type": "uint256"
                  }
            ],
            "name": "emergencyBatchRefund",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "emergencyCancel",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "emergencyRefundBidders",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "emergencySettle",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "endAuction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "additionalTime",
                        "type": "uint256"
                  }
            ],
            "name": "extendAuction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "getActiveAuctions",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "activeAuctions",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getAuction",
            "outputs": [
                  {
                        "components": [
                              {
                                    "internalType": "uint256",
                                    "name": "auctionId",
                                    "type": "uint256"
                              },
                              {
                                    "internalType": "address",
                                    "name": "nftContract",
                                    "type": "address"
                              },
                              {
                                    "internalType": "uint96",
                                    "name": "tokenId",
                                    "type": "uint96"
                              },
                              {
                                    "internalType": "address",
                                    "name": "seller",
                                    "type": "address"
                              },
                              {
                                    "internalType": "enum MooveAuction.AuctionType",
                                    "name": "auctionType",
                                    "type": "uint8"
                              },
                              {
                                    "internalType": "enum MooveAuction.AuctionStatus",
                                    "name": "status",
                                    "type": "uint8"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "allowPartialFulfillment",
                                    "type": "bool"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "isSettled",
                                    "type": "bool"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "revealPhaseStarted",
                                    "type": "bool"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "startingPrice",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "reservePrice",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "buyNowPrice",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "currentPrice",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "bidIncrement",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "highestBid",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "startTime",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "endTime",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "extensionThreshold",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "extensionDuration",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "revealEndTime",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "address",
                                    "name": "highestBidder",
                                    "type": "address"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "minBidders",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "totalBidders",
                                    "type": "uint32"
                              }
                        ],
                        "internalType": "struct MooveAuction.Auction",
                        "name": "",
                        "type": "tuple"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getAuctionBids",
            "outputs": [
                  {
                        "components": [
                              {
                                    "internalType": "address",
                                    "name": "bidder",
                                    "type": "address"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "amount",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "timestamp",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "isWinning",
                                    "type": "bool"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "isRefunded",
                                    "type": "bool"
                              }
                        ],
                        "internalType": "struct MooveAuction.Bid[]",
                        "name": "",
                        "type": "tuple[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getAuctionExtensionInfo",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "extensionThreshold",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "extensionDuration",
                        "type": "uint256"
                  },
                  {
                        "internalType": "bool",
                        "name": "isInExtensionZone",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint256",
                        "name": "timeUntilExtensionZone",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "getAuctionStats",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "totalAuctionsCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "activeAuctionsCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "settledAuctionsCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "cancelledAuctionsCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "totalVolume",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "getAuctionTypeDistribution",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "englishCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "dutchCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "sealedBidCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "reserveCount",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "enum MooveAuction.AuctionType",
                        "name": "auctionType",
                        "type": "uint8"
                  }
            ],
            "name": "getAuctionsByType",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "matchingAuctions",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getDutchPrice",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "getEndingSoonAuctions",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "endingSoon",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getSealedBidRevealInfo",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "isSealedBid",
                        "type": "bool"
                  },
                  {
                        "internalType": "bool",
                        "name": "revealPhaseStarted",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint256",
                        "name": "revealEndTime",
                        "type": "uint256"
                  },
                  {
                        "internalType": "bool",
                        "name": "isRevealPhaseActive",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint256",
                        "name": "timeUntilRevealEnd",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                  }
            ],
            "name": "getUserAuctions",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                  }
            ],
            "name": "getUserBids",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "hasRevealed",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                  }
            ],
            "name": "hasUserBid",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "lastBidTime",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "minimumBidIncrement",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "pause",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "paused",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "placeBid",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "platformFeePercentage",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "startIndex",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "batchSize",
                        "type": "uint256"
                  }
            ],
            "name": "refundRemainingBidders",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "sealedBidDeposits",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "sealedBidPenalties",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "sealedBids",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "settleAuction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "bytes32",
                        "name": "bidHash",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "submitSealedBid",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "totalAuctions",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "unpause",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "newIncrement",
                        "type": "uint256"
                  }
            ],
            "name": "updateMinimumBidIncrement",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "newFeePercentage",
                        "type": "uint256"
                  }
            ],
            "name": "updatePlatformFee",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "userAuctions",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "userBids",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                  },
                  {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  }
            ],
            "name": "withdrawPlatformFees",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      }
],
  }
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "AuctionCancelled",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "seller",
                        "type": "address"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "nftContract",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "enum MooveAuction.AuctionType",
                        "name": "auctionType",
                        "type": "uint8"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "startingPrice",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "duration",
                        "type": "uint256"
                  }
            ],
            "name": "AuctionCreated",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "AuctionEnded",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "extensionDuration",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newEndTime",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "AuctionExtended",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "winner",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "finalPrice",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "platformFee",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "royaltyFee",
                        "type": "uint256"
                  }
            ],
            "name": "AuctionSettled",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "refundedCount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "startIndex",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "endIndex",
                        "type": "uint256"
                  }
            ],
            "name": "BatchRefundCompleted",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "bool",
                        "name": "isHighestBid",
                        "type": "bool"
                  }
            ],
            "name": "BidPlaced",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  }
            ],
            "name": "BidRefunded",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newPrice",
                        "type": "uint256"
                  }
            ],
            "name": "DutchPriceUpdate",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "refundedCount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "startIndex",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "endIndex",
                        "type": "uint256"
                  }
            ],
            "name": "EmergencyBatchRefundCompleted",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "refundedCount",
                        "type": "uint256"
                  }
            ],
            "name": "EmergencyRefundCompleted",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "EmergencySettlement",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": false,
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  }
            ],
            "name": "Paused",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "reservePrice",
                        "type": "uint256"
                  }
            ],
            "name": "ReserveReached",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "penaltyAmount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "SealedBidPenaltyApplied",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  }
            ],
            "name": "SealedBidRevealed",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "bytes32",
                        "name": "bidHash",
                        "type": "bytes32"
                  }
            ],
            "name": "SealedBidSubmitted",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "address[]",
                        "name": "tiedBidders",
                        "type": "address[]"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "tieAmount",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "address",
                        "name": "winner",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "tieBreaker",
                        "type": "string"
                  }
            ],
            "name": "SealedBidTie",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": false,
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  }
            ],
            "name": "Unpaused",
            "type": "event"
      },
      {
            "inputs": [],
            "name": "DEFAULT_EXTENSION_DURATION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "DEFAULT_EXTENSION_THRESHOLD",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MAX_AUCTION_DURATION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MAX_BIDS_PER_AUCTION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MAX_EXTENSION_DURATION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MIN_AUCTION_DURATION",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MIN_BID_INTERVAL",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "MIN_SEALED_BID_DEPOSIT_PERCENTAGE",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "SEALED_BID_PENALTY_PERCENTAGE",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "accessControl",
            "outputs": [
                  {
                        "internalType": "contract MooveAccessControl",
                        "name": "",
                        "type": "address"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "auctionBids",
            "outputs": [
                  {
                        "internalType": "address",
                        "name": "bidder",
                        "type": "address"
                  },
                  {
                        "internalType": "uint128",
                        "name": "amount",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                  },
                  {
                        "internalType": "bool",
                        "name": "isWinning",
                        "type": "bool"
                  },
                  {
                        "internalType": "bool",
                        "name": "isRefunded",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "auctions",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "nftContract",
                        "type": "address"
                  },
                  {
                        "internalType": "uint96",
                        "name": "tokenId",
                        "type": "uint96"
                  },
                  {
                        "internalType": "address",
                        "name": "seller",
                        "type": "address"
                  },
                  {
                        "internalType": "enum MooveAuction.AuctionType",
                        "name": "auctionType",
                        "type": "uint8"
                  },
                  {
                        "internalType": "enum MooveAuction.AuctionStatus",
                        "name": "status",
                        "type": "uint8"
                  },
                  {
                        "internalType": "bool",
                        "name": "allowPartialFulfillment",
                        "type": "bool"
                  },
                  {
                        "internalType": "bool",
                        "name": "isSettled",
                        "type": "bool"
                  },
                  {
                        "internalType": "bool",
                        "name": "revealPhaseStarted",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint128",
                        "name": "startingPrice",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "reservePrice",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "buyNowPrice",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "currentPrice",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "bidIncrement",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint128",
                        "name": "highestBid",
                        "type": "uint128"
                  },
                  {
                        "internalType": "uint32",
                        "name": "startTime",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "endTime",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "extensionThreshold",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "extensionDuration",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "revealEndTime",
                        "type": "uint32"
                  },
                  {
                        "internalType": "address",
                        "name": "highestBidder",
                        "type": "address"
                  },
                  {
                        "internalType": "uint32",
                        "name": "minBidders",
                        "type": "uint32"
                  },
                  {
                        "internalType": "uint32",
                        "name": "totalBidders",
                        "type": "uint32"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "buyNowDutch",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "cancelAuction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "nftContract",
                        "type": "address"
                  },
                  {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "enum MooveAuction.AuctionType",
                        "name": "auctionType",
                        "type": "uint8"
                  },
                  {
                        "internalType": "uint256",
                        "name": "startingPrice",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "reservePrice",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "buyNowPrice",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "duration",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "bidIncrement",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "extensionThreshold",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "extensionDuration",
                        "type": "uint256"
                  }
            ],
            "name": "createAuction",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "startIndex",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "batchSize",
                        "type": "uint256"
                  }
            ],
            "name": "emergencyBatchRefund",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "string",
                        "name": "reason",
                        "type": "string"
                  }
            ],
            "name": "emergencyCancel",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "emergencyRefundBidders",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "emergencySettle",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "endAuction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "additionalTime",
                        "type": "uint256"
                  }
            ],
            "name": "extendAuction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "getActiveAuctions",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "activeAuctions",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getAuction",
            "outputs": [
                  {
                        "components": [
                              {
                                    "internalType": "uint256",
                                    "name": "auctionId",
                                    "type": "uint256"
                              },
                              {
                                    "internalType": "address",
                                    "name": "nftContract",
                                    "type": "address"
                              },
                              {
                                    "internalType": "uint96",
                                    "name": "tokenId",
                                    "type": "uint96"
                              },
                              {
                                    "internalType": "address",
                                    "name": "seller",
                                    "type": "address"
                              },
                              {
                                    "internalType": "enum MooveAuction.AuctionType",
                                    "name": "auctionType",
                                    "type": "uint8"
                              },
                              {
                                    "internalType": "enum MooveAuction.AuctionStatus",
                                    "name": "status",
                                    "type": "uint8"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "allowPartialFulfillment",
                                    "type": "bool"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "isSettled",
                                    "type": "bool"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "revealPhaseStarted",
                                    "type": "bool"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "startingPrice",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "reservePrice",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "buyNowPrice",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "currentPrice",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "bidIncrement",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "highestBid",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "startTime",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "endTime",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "extensionThreshold",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "extensionDuration",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "revealEndTime",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "address",
                                    "name": "highestBidder",
                                    "type": "address"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "minBidders",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "totalBidders",
                                    "type": "uint32"
                              }
                        ],
                        "internalType": "struct MooveAuction.Auction",
                        "name": "",
                        "type": "tuple"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getAuctionBids",
            "outputs": [
                  {
                        "components": [
                              {
                                    "internalType": "address",
                                    "name": "bidder",
                                    "type": "address"
                              },
                              {
                                    "internalType": "uint128",
                                    "name": "amount",
                                    "type": "uint128"
                              },
                              {
                                    "internalType": "uint32",
                                    "name": "timestamp",
                                    "type": "uint32"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "isWinning",
                                    "type": "bool"
                              },
                              {
                                    "internalType": "bool",
                                    "name": "isRefunded",
                                    "type": "bool"
                              }
                        ],
                        "internalType": "struct MooveAuction.Bid[]",
                        "name": "",
                        "type": "tuple[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getAuctionExtensionInfo",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "extensionThreshold",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "extensionDuration",
                        "type": "uint256"
                  },
                  {
                        "internalType": "bool",
                        "name": "isInExtensionZone",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint256",
                        "name": "timeUntilExtensionZone",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "getAuctionStats",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "totalAuctionsCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "activeAuctionsCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "settledAuctionsCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "cancelledAuctionsCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "totalVolume",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "getAuctionTypeDistribution",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "englishCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "dutchCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "sealedBidCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "reserveCount",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "enum MooveAuction.AuctionType",
                        "name": "auctionType",
                        "type": "uint8"
                  }
            ],
            "name": "getAuctionsByType",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "matchingAuctions",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getDutchPrice",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "getEndingSoonAuctions",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "endingSoon",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "getSealedBidRevealInfo",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "isSealedBid",
                        "type": "bool"
                  },
                  {
                        "internalType": "bool",
                        "name": "revealPhaseStarted",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint256",
                        "name": "revealEndTime",
                        "type": "uint256"
                  },
                  {
                        "internalType": "bool",
                        "name": "isRevealPhaseActive",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint256",
                        "name": "timeUntilRevealEnd",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                  }
            ],
            "name": "getUserAuctions",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                  }
            ],
            "name": "getUserBids",
            "outputs": [
                  {
                        "internalType": "uint256[]",
                        "name": "",
                        "type": "uint256[]"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "hasRevealed",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                  }
            ],
            "name": "hasUserBid",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "lastBidTime",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "minimumBidIncrement",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "pause",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "paused",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "placeBid",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "platformFeePercentage",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "startIndex",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "batchSize",
                        "type": "uint256"
                  }
            ],
            "name": "refundRemainingBidders",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "sealedBidDeposits",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "sealedBidPenalties",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "sealedBids",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  }
            ],
            "name": "settleAuction",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "auctionId",
                        "type": "uint256"
                  },
                  {
                        "internalType": "bytes32",
                        "name": "bidHash",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "submitSealedBid",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "totalAuctions",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "unpause",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "newIncrement",
                        "type": "uint256"
                  }
            ],
            "name": "updateMinimumBidIncrement",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "newFeePercentage",
                        "type": "uint256"
                  }
            ],
            "name": "updatePlatformFee",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "userAuctions",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "userBids",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                  },
                  {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  }
            ],
            "name": "withdrawPlatformFees",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      }
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
  MOOVE_AUCTION: "0x6eC7eeB61A8C5b37F7e1812E16c353fe00B1A84D",
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
