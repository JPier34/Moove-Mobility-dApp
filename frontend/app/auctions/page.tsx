import React from "react";
import AuctionFilters from "@/components/auctions/AuctionFilters";
import AuctionGrid from "@/components/auctions/AuctionGrid";
import { AuctionType, AuctionStatus, type Auction } from "@/types/auction";

// Metadata for SEO
export const metadata = {
  title: "Live Auctions | Moove NFT Platform",
  description:
    "Participate in micro-mobility vehicle NFT auctions. Traditional, English, Dutch and sealed bid auctions available.",
  keywords: ["auctions", "NFT", "bidding", "live auctions", "ethereum"],
};

// Mock data based on contract
const MOCK_AUCTIONS: Auction[] = [
  {
    auctionId: "1",
    nftId: "1",
    nftName: "Electric Scooter #001",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "scooter",
    seller: "0x1234567890abcdef1234567890abcdef12345678",
    auctionType: AuctionType.ENGLISH,
    status: AuctionStatus.ACTIVE,
    startPrice: "0.001",
    reservePrice: "0.0015",
    buyNowPrice: "0.003",
    currentBid: "0.0018",
    highestBidder: "0x9876543210fedcba9876543210fedcba98765432",
    bidCount: 5,
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    endTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minuted from now
    bidIncrement: "0.0001",
    currency: "ETH",
    attributes: {
      range: "25km",
      speed: "25km/h",
      battery: "Lithium Ion",
      condition: "Excellent",
    },
  },
  {
    auctionId: "2",
    nftId: "2",
    nftName: "City Bike #042",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "bike",
    seller: "0x5555555555555555555555555555555555555555",
    auctionType: AuctionType.DUTCH,
    status: AuctionStatus.ACTIVE,
    startPrice: "0.005", // Starts high, decreases over time
    reservePrice: "0.001", // Minimum price
    buyNowPrice: null,
    currentBid: "0.003", // Actual price at the moment (decreasing)
    highestBidder: null,
    bidCount: 0,
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 min remaining
    bidIncrement: "0",
    currency: "ETH",
    attributes: {
      range: "40km",
      speed: "20km/h",
      battery: "Removable",
      condition: "Good",
    },
  },
  {
    auctionId: "3",
    nftId: "3",
    nftName: "Premium Scooter #007",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "scooter",
    seller: "0x7777777777777777777777777777777777777777",
    auctionType: AuctionType.TRADITIONAL,
    status: AuctionStatus.ACTIVE,
    startPrice: "0.002",
    reservePrice: "0.0025",
    buyNowPrice: "0.006",
    currentBid: "0.0032",
    highestBidder: "0x3333333333333333333333333333333333333333",
    bidCount: 8,
    startTime: new Date(Date.now() - 60 * 60 * 1000), // 1h ago
    endTime: new Date(Date.now() + 25 * 60 * 1000), // 25 mins remaining
    bidIncrement: "0.0002",
    currency: "ETH",
    attributes: {
      range: "50km",
      speed: "30km/h",
      battery: "Fast Charging",
      condition: "Mint",
    },
  },
  {
    auctionId: "4",
    nftId: "4",
    nftName: "Eco Skateboard #123",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "skateboard",
    seller: "0x9999999999999999999999999999999999999999",
    auctionType: AuctionType.SEALED_BID,
    status: AuctionStatus.REVEALING, // Activate auction reveal phase
    startPrice: "0.0015",
    reservePrice: "0.002",
    buyNowPrice: null,
    currentBid: "???", // Hidden during sealed bid
    highestBidder: "???",
    bidCount: 3, // Numbers of bids during sealed phase
    startTime: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
    endTime: new Date(Date.now() + 5 * 60 * 1000), // 5 mins per reveal phase
    bidIncrement: "0.0001",
    currency: "ETH",
    attributes: {
      range: "15km",
      speed: "22km/h",
      battery: "Solar Panel",
      condition: "Very Good",
    },
  },
  {
    auctionId: "5",
    nftId: "5",
    nftName: "Urban Moped #099",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "moped",
    seller: "0x1111111111111111111111111111111111111111",
    auctionType: AuctionType.ENGLISH,
    status: AuctionStatus.ENDED,
    startPrice: "0.003",
    reservePrice: "0.004",
    buyNowPrice: "0.008",
    currentBid: "0.0055",
    highestBidder: "0x2222222222222222222222222222222222222222",
    bidCount: 12,
    startTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3h ago
    endTime: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    bidIncrement: "0.0002",
    currency: "ETH",
    attributes: {
      range: "80km",
      speed: "45km/h",
      battery: "Dual Battery",
      condition: "Excellent",
    },
  },
  {
    auctionId: "6",
    nftId: "6",
    nftName: "Mystery Bike #156",
    nftImage: "/api/placeholder/300/300",
    nftCategory: "bike",
    seller: "0x8888888888888888888888888888888888888888",
    auctionType: AuctionType.SEALED_BID,
    status: AuctionStatus.ACTIVE, // ✅ Active bidding phase
    startPrice: "0.002",
    reservePrice: "0.003",
    buyNowPrice: null,
    currentBid: "???", // Hidden during sealed bid
    highestBidder: null,
    bidCount: 1, // Number of sealed bids submitted
    startTime: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
    endTime: new Date(Date.now() + 20 * 60 * 1000), // 20 min remaining (before reveal phase)
    bidIncrement: "0.0001",
    currency: "ETH",
    attributes: {
      range: "35km",
      speed: "28km/h",
      battery: "Long Range",
      condition: "New",
    },
  },
];

export default function AuctionsPage() {
  const activeAuctions = MOCK_AUCTIONS.filter(
    (a) => a.status === AuctionStatus.ACTIVE
  );
  const endedAuctions = MOCK_AUCTIONS.filter(
    (a) => a.status === AuctionStatus.ENDED
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-moove-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Auctions Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Aste <span className="text-moove-primary">Live</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Partecipa alle aste per vincere veicoli NFT esclusivi. Supportiamo
            aste tradizionali, inglesi, olandesi e a offerte sigillate.
          </p>
        </div>

        {/* Auction stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-green-600">
              {activeAuctions.length}
            </div>
            <div className="text-sm text-gray-600">Aste Attive</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">
              {MOCK_AUCTIONS.reduce(
                (sum, auction) => sum + auction.bidCount,
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Offerte Totali</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">
              {endedAuctions.length}
            </div>
            <div className="text-sm text-gray-600">Aste Terminate</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-moove-primary">
              0.0287 ETH
            </div>
            <div className="text-sm text-gray-600">Volume Totale</div>
          </div>
        </div>

        <AuctionFilters />

        {/* Auction section */}

        {/* Active auction */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              🔥 Aste Attive ({activeAuctions.length})
            </h2>
            <div className="text-sm text-gray-500">
              Aggiornamento automatico ogni 10 secondi
            </div>
          </div>
          <AuctionGrid auctions={activeAuctions} />
        </section>

        {/* Terminated auctions */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              ⏰ Aste Terminate ({endedAuctions.length})
            </h2>
          </div>
          <AuctionGrid auctions={endedAuctions} showEndedState={true} />
        </section>

        {/* Auction types infos */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Tipi di Asta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🏛️</div>
              <h4 className="font-semibold text-gray-900 mb-2">Tradizionale</h4>
              <p className="text-sm text-gray-600">
                Asta classica a durata fissa. Vince l'offerta più alta.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">⬆️</div>
              <h4 className="font-semibold text-gray-900 mb-2">Inglese</h4>
              <p className="text-sm text-gray-600">
                Prezzo iniziale già stabilito e gli acquirenti possono fare
                offerte superiori.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">⬇️</div>
              <h4 className="font-semibold text-gray-900 mb-2">Olandese</h4>
              <p className="text-sm text-gray-600">
                Il prezzo cala gradualmente. Vince chi clicca "Compra ora" per
                primo.
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Offerte Sigillate
              </h4>
              <p className="text-sm text-gray-600">
                Offerte a busta chiusa con apertura dopo 24 ore.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
