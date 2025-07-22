"use client";

import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import { AuctionType } from "../../types/auction";

interface WonAuction {
  auctionId: string;
  nftName: string;
  nftImage: string;
  winningBid: string;
  endTime: Date;
  isClaimed: boolean;
  claimDeadline: Date;
  auctionType: AuctionType;
}

interface WonAuctionsProps {
  auctions: WonAuction[];
}

export default function WonAuctions({ auctions }: WonAuctionsProps) {
  const [timeLeftMap, setTimeLeftMap] = useState<Record<string, string>>({});

  // Calculate time remaining to claim
  useEffect(() => {
    const updateTimes = () => {
      const newTimeMap: Record<string, string> = {};

      auctions.forEach((auction) => {
        if (!auction.isClaimed) {
          const now = new Date().getTime();
          const deadline = new Date(auction.claimDeadline).getTime();
          const difference = deadline - now;

          if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
              (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );

            if (days > 0) {
              newTimeMap[auction.auctionId] = `${days}d ${hours}h`;
            } else {
              newTimeMap[auction.auctionId] = `${hours}h`;
            }
          } else {
            newTimeMap[auction.auctionId] = "Expired";
          }
        }
      });

      setTimeLeftMap(newTimeMap);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [auctions]);

  const handleClaimNFT = (auction: WonAuction) => {
    // TODO: Implement claim NFT logic
    console.log("Claiming NFT from auction:", auction.auctionId);
    alert(`Reclamando ${auction.nftName}...`);
  };

  const handleViewAuction = (auctionId: string) => {
    // TODO: Navigate to auction detail
    window.location.href = `/auctions/${auctionId}`;
  };

  if (auctions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nessuna asta vinta
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Non hai ancora vinto nessuna asta. Continua a partecipare per vincere
          NFT esclusivi!
        </p>
        <Button onClick={() => (window.location.href = "/auctions")}>
          Partecipa alle Aste
        </Button>
      </div>
    );
  }

  const unclaimedAuctions = auctions.filter((a) => !a.isClaimed);
  const claimedAuctions = auctions.filter((a) => a.isClaimed);

  return (
    <div className="space-y-6">
      {/* Unclaimed auctions - priority section */}
      {unclaimedAuctions.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              🎯 Da reclamare ({unclaimedAuctions.length})
            </h3>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
              Azione richiesta
            </span>
          </div>

          <div className="space-y-4">
            {unclaimedAuctions.map((auction) => {
              const timeLeft =
                timeLeftMap[auction.auctionId] || "Calculating...";
              const isUrgent =
                timeLeft.includes("h") && !timeLeft.includes("d");

              return (
                <div
                  key={auction.auctionId}
                  className={`border rounded-xl p-4 ${
                    isUrgent
                      ? "border-red-200 bg-red-50"
                      : "border-orange-200 bg-orange-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left side - NFT info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center text-2xl text-white">
                        🛴
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {auction.nftName}
                        </h4>
                        <div className="text-sm text-gray-500 mb-1">
                          Asta #{auction.auctionId} • Terminata{" "}
                          {new Date(auction.endTime).toLocaleDateString()}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          Vinta per {auction.winningBid} ETH
                        </div>
                      </div>
                    </div>

                    {/* Right side - Claim info and action */}
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium mb-2 ${
                          isUrgent ? "text-red-600" : "text-orange-600"
                        }`}
                      >
                        ⏰ {timeLeft} per reclamare
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={() => handleClaimNFT(auction)}
                          className="w-full"
                        >
                          🎁 Reclama NFT
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAuction(auction.auctionId)}
                          className="w-full"
                        >
                          Visualizza Asta
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Urgency warning */}
                  {isUrgent && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                      <div className="text-red-800 text-sm font-medium flex items-center">
                        🚨 Tempo quasi scaduto! Reclama il tuo NFT prima che
                        scada.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Claimed auctions - history section */}
      {claimedAuctions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ✅ Già reclamati ({claimedAuctions.length})
          </h3>

          <div className="space-y-4">
            {claimedAuctions.map((auction) => (
              <div
                key={auction.auctionId}
                className="border border-gray-200 bg-gray-50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  {/* Left side - NFT info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-xl flex items-center justify-center text-lg text-gray-600">
                      ✅
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {auction.nftName}
                      </h4>
                      <div className="text-sm text-gray-500 mb-1">
                        Asta #{auction.auctionId} • Vinta per{" "}
                        {auction.winningBid} ETH
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        NFT reclamato con successo
                      </div>
                    </div>
                  </div>

                  {/* Right side - View action */}
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewAuction(auction.auctionId)}
                    >
                      Visualizza Storico
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
