"use client";

import React from "react";
import { UserData } from "@/types/user";

interface CollectionStatsProps {
  userData: UserData;
}

export default function CollectionStats({ userData }: CollectionStatsProps) {
  // Calculate additional stats
  const activeBidsCount = userData.activeBids.length;
  const wonAuctionsCount = userData.wonAuctionsDetails.length;
  const totalPortfolioValue = parseFloat(userData.totalValue);

  const avgNFTValue =
    userData.totalNFTs > 0
      ? (totalPortfolioValue / userData.totalNFTs).toFixed(3)
      : "0";
  const nftsForSale = userData.ownedNFTs.filter((nft) => nft.isForSale).length;

  const stats = [
    {
      label: "NFT Posseduti",
      value: userData.totalNFTs,
      subtext: `${nftsForSale} in vendita`,
      icon: "🖼️",
      color: "bg-blue-500",
    },
    {
      label: "Valore Portafoglio",
      value: `${userData.totalValue} ETH`,
      subtext: `${avgNFTValue} ETH media`,
      icon: "💎",
      color: "bg-green-500",
    },
    {
      label: "Offerte Attive",
      value: activeBidsCount,
      subtext: activeBidsCount > 0 ? "In corso..." : "Nessuna offerta",
      icon: "🔥",
      color: "bg-orange-500",
    },
    {
      label: "Aste Vinte",
      value: wonAuctionsCount,
      subtext: wonAuctionsCount > 0 ? "Da riscattare" : "Tutte riscattate",
      icon: "🏆",
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}
            >
              {stat.icon}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {stat.label}
            </h3>
            <p className="text-xs text-gray-500">{stat.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
