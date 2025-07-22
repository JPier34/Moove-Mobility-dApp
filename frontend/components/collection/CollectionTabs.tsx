"use client";

import React, { useState } from "react";
import OwnedNFTs from "@/components/collection/OwnedNFTs";
import ActiveBids from "@/components/collection/ActiveBids";
import WonAuctions from "@/components/collection/WonAuctions";
import AuctionHistory from "@/components/collection/AuctionHistory";

interface UserData {
  address: string;
  totalNFTs: number;
  totalValue: string;
  activeBids: number;
  ownedNFTs: any[];
  wonAuctions: any[];
  auctionHistory: any[];
}

interface CollectionTabsProps {
  userData: UserData;
}

type TabType = "owned" | "bids" | "won" | "history";

export default function CollectionTabs({ userData }: CollectionTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("owned");

  const tabs = [
    {
      id: "owned" as TabType,
      label: "I miei NFT",
      icon: "🖼️",
      count: userData.ownedNFTs.length,
      component: <OwnedNFTs nfts={userData.ownedNFTs} />,
    },
    {
      id: "bids" as TabType,
      label: "Offerte Attive",
      icon: "🔥",
      count: userData.activeBids.length,
      component: <ActiveBids bids={userData.activeBids} />,
    },
    {
      id: "won" as TabType,
      label: "Aste Vinte",
      icon: "🏆",
      count: userData.wonAuctions.length,
      component: <WonAuctions auctions={userData.wonAuctions} />,
    },
    {
      id: "history" as TabType,
      label: "Storico",
      icon: "📜",
      count: userData.auctionHistory.length,
      component: <AuctionHistory history={userData.auctionHistory} />,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 relative transition-colors ${
                activeTab === tab.id
                  ? "text-moove-primary border-b-2 border-moove-primary font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id
                        ? "bg-moove-100 text-moove-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </div>

              {/* Active indicator for special cases */}
              {tab.id === "bids" && tab.count > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              )}
              {tab.id === "won" && tab.count > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}
