import React from "react";
import CollectionTabs from "@/components/collection/CollectionTabs";
import CollectionStats from "@/components/collection/CollectionStats";
import { AuctionType } from "@/types/auction";

// Metadata for SEO
export const metadata = {
  title: "My Collection | Moove NFT Platform",
  description:
    "Manage your vehicle NFTs, track your bids, and view your auction history.",
  keywords: ["collection", "my NFTs", "owned tokens", "bids", "portfolio"],
};

// Mock user data - will be replaced with Web3/API calls
const MOCK_USER_DATA = {
  address: "0x1234567890abcdef1234567890abcdef12345678",
  totalNFTs: 3,
  totalValue: "1.25", // ETH
  activeBids: 2,
  wonAuctions: 1,

  // Owned NFTs
  ownedNFTs: [
    {
      id: "1",
      name: "Electric Scooter #001",
      image: "/api/placeholder/300/300",
      category: "scooter",
      acquiredDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      acquiredPrice: "0.5",
      currentValue: "0.6", // Estimated current value
      isForSale: false,
      attributes: {
        range: "25km",
        speed: "25km/h",
        battery: "Lithium Ion",
        condition: "Excellent",
      },
      source: "marketplace", // "marketplace" | "auction"
    },
    {
      id: "3",
      name: "Premium Scooter #007",
      image: "/api/placeholder/300/300",
      category: "scooter",
      acquiredDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      acquiredPrice: "0.65",
      currentValue: "0.55",
      isForSale: true,
      attributes: {
        range: "50km",
        speed: "30km/h",
        battery: "Fast Charging",
        condition: "Mint",
      },
      source: "auction",
    },
  ],

  // Active bids (auctions user is participating in)
  activeBids: [
    {
      auctionId: "2",
      nftName: "City Bike #042",
      nftImage: "/api/placeholder/300/300",
      myBidAmount: "0.0035",
      currentHighestBid: "0.004",
      isWinning: false,
      endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
      auctionType: AuctionType.DUTCH,
    },
    {
      auctionId: "6",
      nftName: "Mystery Bike #156",
      nftImage: "/api/placeholder/300/300",
      myBidAmount: "???", // Sealed bid - amount hidden
      currentHighestBid: "???",
      isWinning: null, // Unknown in sealed bid
      endTime: new Date(Date.now() + 20 * 60 * 1000), // 20 min from now
      auctionType: AuctionType.SEALED_BID,
    },
  ],

  // Won auctions (waiting to be claimed)
  wonAuctions: [
    {
      auctionId: "5",
      nftName: "Urban Moped #099",
      nftImage: "/api/placeholder/300/300",
      winningBid: "0.0055",
      endTime: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      isClaimed: false,
      claimDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to claim
      auctionType: AuctionType.ENGLISH,
    },
  ],

  // Auction history
  auctionHistory: [
    {
      auctionId: "4",
      nftName: "Eco Skateboard #123",
      action: "bid", // "bid" | "won" | "lost" | "created"
      amount: "0.0025",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      result: "lost",
      auctionType: AuctionType.SEALED_BID,
    },
    {
      auctionId: "1",
      nftName: "Electric Scooter #001",
      action: "won",
      amount: "0.5",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      result: "won",
      auctionType: AuctionType.TRADITIONAL,
    },
  ],
};

export default function MyCollectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-moove-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            La mia <span className="text-moove-primary">Collezione</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Gestisci i tuoi NFT, monitora le tue offerte e visualizza lo storico
            delle aste.
          </p>
        </div>

        {/* User wallet info */}
        <div className="mb-8 bg-gradient-to-r from-moove-primary to-moove-secondary rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Il mio Wallet</h2>
              <p className="text-moove-50 font-mono text-sm">
                {MOCK_USER_DATA.address}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {MOCK_USER_DATA.totalNFTs}
              </div>
              <div className="text-moove-50">NFT Posseduti</div>
            </div>
          </div>
        </div>

        {/* Collection stats */}
        <CollectionStats userData={MOCK_USER_DATA} />

        {/* Main content tabs */}
        <CollectionTabs userData={MOCK_USER_DATA} />
      </div>
    </div>
  );
}
