"use client";

import React from "react";
import { useAuctionNotifications } from "@/providers/AuctionNotificationsProvider";
import { useWonAuctions } from "@/hooks/useWonAuctions";

interface AuctionNotificationsDebugProps {
  className?: string;
}

export default function AuctionNotificationsDebug({
  className = "",
}: AuctionNotificationsDebugProps) {
  const {
    hasUnsettledAuctions,
    unsettledCount,
    showNotifications,
    setShowNotifications,
    refundNotifications,
    claimNotifications,
    resetRefundBlock,
    resetClaimBlock,
    clearAllNotifications,
  } = useAuctionNotifications();

  const { unsettledAuctions, isLoading } = useWonAuctions();

  // Solo in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      className={`
      fixed bottom-4 right-4 z-50
      bg-black/80 text-white text-xs
      rounded-lg p-3 max-w-sm
      backdrop-blur-sm border border-white/20
      ${className}
    `}
    >
      <div className="font-bold mb-2">🔔 Auction Notifications Debug</div>

      <div className="space-y-1">
        <div>• Has Unsettled: {hasUnsettledAuctions ? "✅" : "❌"}</div>
        <div>• Unsettled Count: {unsettledCount}</div>
        <div>• Show Notifications: {showNotifications ? "✅" : "❌"}</div>
        <div>• Loading: {isLoading ? "⏳" : "✅"}</div>
        <div>• Raw Unsettled: {unsettledAuctions.length}</div>
        <div>• Refund Notifications: {refundNotifications.length}</div>
        <div>• Claim Notifications: {claimNotifications.length}</div>
      </div>

      <div className="mt-2 pt-2 border-t border-white/20">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs mr-1"
        >
          Toggle Notifications
        </button>
        <button
          onClick={resetRefundBlock}
          className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs mr-1"
        >
          Reset Refund Block
        </button>
        <button
          onClick={resetClaimBlock}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs mr-1"
        >
          Reset Claim Block
        </button>
        <button
          onClick={clearAllNotifications}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear All
        </button>
      </div>

      {unsettledAuctions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="font-semibold">Unsettled Auctions:</div>
          {unsettledAuctions.map((auction) => (
            <div key={auction.auctionId} className="text-xs">
              • Auction #{auction.auctionId} - Status: {auction.status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
