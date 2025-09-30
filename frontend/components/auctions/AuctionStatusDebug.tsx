"use client";

import React, { useState, useEffect } from "react";
import { analyzeAuctionForClaim } from "@/utils/auctionDebug";

interface AuctionStatusDebugProps {
  auctionId: number;
}

export function AuctionStatusDebug({ auctionId }: AuctionStatusDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const checkAuctionStatus = async () => {
      const info = await analyzeAuctionForClaim(auctionId, "");
      setDebugInfo(info);
    };

    checkAuctionStatus();
  }, [auctionId]);

  if (!debugInfo) return null;

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg mt-4">
      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
        Auction Debug Info
      </h4>
      <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
        <div>Contract Status: {debugInfo.contractStatus}</div>
        <div>Calculated Active: {debugInfo.isActive ? "Yes" : "No"}</div>
        <div>Time to End: {debugInfo.timeToEnd}s</div>
        <div>
          Start: {new Date(debugInfo.startTime * 1000).toLocaleString()}
        </div>
        <div>End: {new Date(debugInfo.endTime * 1000).toLocaleString()}</div>
        <div>Token ID: {debugInfo.tokenId}</div>
        <div>Seller: {debugInfo.seller?.slice(0, 10)}...</div>
      </div>
    </div>
  );
}
