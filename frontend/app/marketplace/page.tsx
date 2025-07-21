import React from "react";
import SearchAndFilters from "@/components/marketplace/SearchAndFilters";
import NFTGrid from "@/components/marketplace/NFTGrid";
import { NFT } from "@/components/marketplace/NFTGrid";

// SEO Metadata
export const metadata = {
  title: "Marketplace | Moove NFT Platform",
  description:
    "Esplora e acquista NFT di veicoli per micro-mobilità. Scooter elettrici, biciclette e veicoli sostenibili disponibili sulla blockchain.",
  keywords: [
    "marketplace",
    "NFT",
    "scooter elettrici",
    "micro-mobilità",
    "blockchain",
  ],
};

// Mock data for development - API calls next
const MOCK_NFTS: NFT[] = [
  {
    id: "1",
    name: "Electric Scooter #001",
    description: "Scooter elettrico ad alte prestazioni per la città",
    image: "/api/placeholder/300/300",
    price: "0.5",
    currency: "ETH",
    owner: "0x1234...5678",
    category: "scooter",
    attributes: {
      range: "25km",
      speed: "25km/h",
      battery: "Lithium Ion",
      condition: "Excellent",
    },
    isForSale: true,
    rarity: "common",
  },
  {
    id: "2",
    name: "City Bike #042",
    description: "Bicicletta urbana con design moderno",
    image: "/api/placeholder/300/300",
    price: "0.3",
    currency: "ETH",
    owner: "0x9876...4321",
    category: "bike",
    attributes: {
      range: "40km",
      speed: "20km/h",
      battery: "Removable",
      condition: "Good",
    },
    isForSale: true,
    rarity: "uncommon",
  },
  {
    id: "3",
    name: "Premium Scooter #007",
    description: "Scooter di lusso con funzionalità avanzate",
    image: "/api/placeholder/300/300",
    price: "1.2",
    currency: "ETH",
    owner: "0x5555...9999",
    category: "scooter",
    attributes: {
      range: "50km",
      speed: "30km/h",
      battery: "Fast Charging",
      condition: "Mint",
    },
    isForSale: true,
    rarity: "rare",
  },
  {
    id: "4",
    name: "Eco Skateboard #123",
    description: "Skateboard elettrico eco-sostenibile",
    image: "/api/placeholder/300/300",
    price: "0.8",
    currency: "ETH",
    owner: "0x3333...7777",
    category: "skateboard",
    attributes: {
      range: "15km",
      speed: "22km/h",
      battery: "Solar Panel",
      condition: "Very Good",
    },
    isForSale: false,
    rarity: "epic",
  },
  {
    id: "5",
    name: "Urban Moped #099",
    description: "Moped elettrico per lunghe distanze",
    image: "/api/placeholder/300/300",
    price: "2.1",
    currency: "ETH",
    owner: "0x1111...2222",
    category: "moped",
    attributes: {
      range: "80km",
      speed: "45km/h",
      battery: "Dual Battery",
      condition: "Excellent",
    },
    isForSale: true,
    rarity: "legendary",
  },
  {
    id: "6",
    name: "Foldable Scooter #234",
    description: "Scooter pieghevole perfetto per i pendolari",
    image: "/api/placeholder/300/300",
    price: "0.4",
    currency: "ETH",
    owner: "0x4444...8888",
    category: "scooter",
    attributes: {
      range: "20km",
      speed: "20km/h",
      battery: "Compact",
      condition: "Good",
    },
    isForSale: true,
    rarity: "common",
  },
];

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-moove-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Marketplace Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Marketplace
            <span className="text-moove-primary ml-2">NFT</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Scopri e acquista veicoli NFT per la micro-mobilità urbana. Ogni NFT
            rappresenta un veicolo reale accessibile nella nostra rete.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">
              {MOCK_NFTS.length}
            </div>
            <div className="text-sm text-gray-600">NFT Totali</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">
              {MOCK_NFTS.filter((nft) => nft.isForSale).length}
            </div>
            <div className="text-sm text-gray-600">In Vendita</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">4</div>
            <div className="text-sm text-gray-600">Categorie</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-moove-primary">
              {Math.round(
                MOCK_NFTS.reduce((sum, nft) => sum + parseFloat(nft.price), 0) *
                  100
              ) / 100}{" "}
              ETH
            </div>
            <div className="text-sm text-gray-600">Volume Totale</div>
          </div>
        </div>

        <SearchAndFilters />

        <NFTGrid nfts={MOCK_NFTS} />
      </div>
    </div>
  );
}
