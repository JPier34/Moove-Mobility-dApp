"use client";

import React from "react";

interface UserData {
  address: string;
  totalNFTs: number;
  totalValue: string;
  activeBids: number;
  wonAuctions: number;
  ownedNFTs: any[];
  auctionHistory: any[];
}

interface CollectionStatsProps {
  userData: UserData;
}

export default function CollectionStats({ userData }: CollectionStatsProps) {
  // Calculate additional stats
  const portfolioChange = "+12.5%"; // Mock data - should be calculated
  const avgNFTValue =
    userData.totalNFTs > 0
      ? (parseFloat(userData.totalValue) / userData.totalNFTs).toFixed(3)
      : "0";
  const successRate =
    userData.auctionHistory.length > 0
      ? Math.round(
          (userData.auctionHistory.filter((h) => h.result === "won").length /
            userData.auctionHistory.length) *
            100
        )
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Portfolio Value */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center">
            <span className="text-2xl">💎</span>
          </div>
          <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
            {portfolioChange}
          </span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {userData.totalValue} ETH
        </div>
        <div className="text-sm text-gray-600">Valore Totale Portfolio</div>
        <div className="text-xs text-gray-500 mt-1">
          ≈ ${(parseFloat(userData.totalValue) * 2000).toLocaleString()} USD
        </div>
      </div>

      {/* Active Bids */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🔥</span>
          </div>
          {userData.activeBids > 0 && (
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {userData.activeBids}
        </div>
        <div className="text-sm text-gray-600">Offerte Attive</div>
        <div className="text-xs text-gray-500 mt-1">
          {userData.activeBids > 0
            ? "Auctions in corso"
            : "Nessuna offerta attiva"}
        </div>
      </div>

      {/* Average NFT Value */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {avgNFTValue} ETH
        </div>
        <div className="text-sm text-gray-600">Valore Medio NFT</div>
        <div className="text-xs text-gray-500 mt-1">
          Su {userData.totalNFTs} NFT posseduti
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          {userData.wonAuctions > 0 && (
            <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              Da reclamare
            </span>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {successRate}%
        </div>
        <div className="text-sm text-gray-600">Tasso di Successo</div>
        <div className="text-xs text-gray-500 mt-1">Nelle aste partecipate</div>
      </div>
    </div>
  );
}
