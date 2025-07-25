"use client";

import React from "react";
import { NFT } from "./NFTGrid";
import Button from "../ui/Button";
import { useAccount, useDisconnect } from "wagmi";
import { shortenAddress } from "../../utils/shortenAddress";

interface NFTCardProps {
  nft: NFT;
  onClick?: () => void;
}

// Mapping for category emojis
const categoryEmojis = {
  scooter: "🛴",
  bike: "🚲",
  skateboard: "🛹",
  moped: "🛵",
};

// Mapping for rarity colors
const rarityColors = {
  common: "bg-gray-100 text-gray-800 border-gray-200",
  uncommon: "bg-green-100 text-green-800 border-green-200",
  rare: "bg-blue-100 text-blue-800 border-blue-200",
  epic: "bg-purple-100 text-purple-800 border-purple-200",
  legendary: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export default function NFTCard({ nft, onClick }: NFTCardProps) {
  const { isConnected } = useAccount();

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!isConnected) {
      alert("Connetti il wallet per acquistare");
      return;
    }
    // TODO: Implement quick buy logic (?)
    console.log("Quick buy for NFT:", nft.id);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-moove-primary/30 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      {/* NFT Image */}
      <div className="relative aspect-square bg-gradient-to-br from-moove-50 to-moove-100 p-6">
        {/* Placeholder for image */}
        <div className="w-full h-full bg-gradient-to-br from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center text-6xl text-white">
          {categoryEmojis[nft.category as keyof typeof categoryEmojis] || "🚗"}
        </div>

        {/* Rarity budget */}
        <div
          className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${
            rarityColors[nft.rarity]
          }`}
        >
          {nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1)}
        </div>

        {/* Disponibility badge */}
        {nft.isForSale ? (
          <div className="absolute top-3 right-3 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200">
            In Vendita
          </div>
        ) : (
          <div className="absolute top-3 right-3 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
            Non in Vendita
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-4">
        {/* Name and category */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-moove-primary transition-colors">
            {nft.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {nft.description}
          </p>
        </div>

        {/* Main features */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">🔋</span>
            <span className="text-gray-700">{nft.attributes.range}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">⚡</span>
            <span className="text-gray-700">{nft.attributes.speed}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">⭐</span>
            <span className="text-gray-700">{nft.attributes.condition}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">🔧</span>
            <span className="text-gray-700">{nft.attributes.battery}</span>
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-500">
            Proprietario:{" "}
            <span className="font-mono text-gray-700">
              {shortenAddress(nft.owner)}
            </span>
          </div>
        </div>

        {/* Price and actions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {nft.price}{" "}
              <span className="text-lg text-gray-600">{nft.currency}</span>
            </div>
            <div className="text-xs text-gray-500">
              ≈ ${(parseFloat(nft.price) * 2000).toLocaleString()} USD
            </div>
          </div>

          {nft.isForSale && (
            <Button
              size="sm"
              onClick={handleQuickBuy}
              disabled={!isConnected}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isConnected ? "Acquista" : "Connetti Wallet"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
