"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import toast from "react-hot-toast";

interface EndedAuction {
  auctionId: number;
  status: number;
  endTime: string;
  highestBidder: string;
  auctionType: number;
  highestBid: string;
  reservePrice?: string;
  isUserWinner: boolean;
  timeSinceEnded: number; // minutes
}

export default function EndedAuctionsManager() {
  const { address, isConnected } = useAccount();
  const [endedAuctions, setEndedAuctions] = useState<EndedAuction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  const fetchEndedAuctions = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      // ✅ IMPROVED: Check if contract has totalAuctions method
      if (!auctionContract.totalAuctions) {
        console.error("❌ Contract does not have totalAuctions method");
        toast.error(
          "Contract method not available. Please check contract configuration."
        );
        return;
      }

      // ✅ IMPROVED: Get total auctions with retry logic
      let totalAuctions;
      let retries = 3;

      while (retries > 0) {
        try {
          totalAuctions = await auctionContract.totalAuctions();
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error(
              "❌ Failed to get total auctions after retries:",
              error
            );
            toast.error(
              "Failed to connect to blockchain. Please try again later."
            );
            return;
          }
          console.log(`⚠️ Retrying totalAuctions (${retries} retries left)...`);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      }

      console.log(`🔍 Checking ${totalAuctions} auctions for ENDED status...`);

      const ended: EndedAuction[] = [];

      // Check auctions from 1 to totalAuctions
      for (let auctionId = 1; auctionId <= totalAuctions; auctionId++) {
        try {
          const auctionData = await auctionContract.getAuction(auctionId);
          const status = Number(auctionData.status);
          const endTime = Number(auctionData.endTime);
          const highestBidder = auctionData.highestBidder;
          const auctionType = Number(auctionData.auctionType);
          const highestBid = ethers.formatEther(auctionData.highestBid);
          const now = Math.floor(Date.now() / 1000);

          // Check if auction is ENDED (status 3) and user is winner
          if (status === 3) {
            const isUserWinner =
              highestBidder.toLowerCase() === address.toLowerCase();
            const timeSinceEnded = Math.floor((now - endTime) / 60); // minutes

            if (isUserWinner) {
              const endedAuction: EndedAuction = {
                auctionId,
                status,
                endTime: new Date(endTime * 1000).toISOString(),
                highestBidder,
                auctionType,
                highestBid,
                isUserWinner,
                timeSinceEnded,
              };

              // Add reserve price for Reserve Auctions
              if (auctionType === 3) {
                endedAuction.reservePrice = ethers.formatEther(
                  auctionData.reservePrice
                );
              }

              ended.push(endedAuction);
              console.log(
                `🏆 Found ENDED auction #${auctionId} where user is winner`
              );
            }
          }
        } catch (error) {
          // Auction doesn't exist or error reading it
          continue;
        }
      }

      setEndedAuctions(ended);
      console.log(
        `✅ Found ${ended.length} ENDED auctions where user is winner`
      );

      if (ended.length > 0) {
        toast.success(`Found ${ended.length} auctions ready for settlement!`);
      } else {
        toast.info("No ENDED auctions found where you are the winner");
      }
    } catch (error) {
      console.error("Error fetching ended auctions:", error);
      toast.error("Error fetching ended auctions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const settleAuction = async (auctionId: number) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsProcessing(auctionId);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        signer
      );

      console.log(`🏆 Settling auction #${auctionId}...`);

      // Call settleAuction
      const tx = await auctionContract.settleAuction(auctionId, {
        gasLimit: 300000, // Gas limit for settleAuction
      });

      console.log(`📝 Settle auction transaction sent: ${tx.hash}`);
      toast.success(`Settling auction #${auctionId}...`, { duration: 3000 });

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Auction #${auctionId} settled successfully:`, receipt);

      toast.success(
        `Auction #${auctionId} settled successfully! NFT transferred to your wallet.`,
        { duration: 5000 }
      );

      // Remove from list
      setEndedAuctions((prev) =>
        prev.filter((auction) => auction.auctionId !== auctionId)
      );

      // Refresh the list
      setTimeout(() => {
        fetchEndedAuctions();
      }, 2000);
    } catch (error) {
      console.error(`❌ Error settling auction #${auctionId}:`, error);

      const errorMessage = (error as Error).message;
      if (errorMessage.includes("Auction is not ended")) {
        toast.error(`Auction #${auctionId} is not in ENDED status`);
      } else if (errorMessage.includes("Not the winner")) {
        toast.error(`You are not the winner of auction #${auctionId}`);
      } else if (errorMessage.includes("Already settled")) {
        toast.error(`Auction #${auctionId} is already settled`);
      } else {
        toast.error(`Failed to settle auction #${auctionId}: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const settleAllAuctions = async () => {
    if (endedAuctions.length === 0) {
      toast.error("No auctions to settle");
      return;
    }

    toast.info(`Settling ${endedAuctions.length} auctions...`);

    for (const auction of endedAuctions) {
      await settleAuction(auction.auctionId);
      // Small delay between transactions
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  // ✅ DISABLED: Auto-refresh to prevent RPC rate limiting
  // useEffect(() => {
  //   if (isConnected && address) {
  //     fetchEndedAuctions();

  //     const interval = setInterval(() => {
  //       fetchEndedAuctions();
  //     }, 30000); // 30 seconds

  //     return () => clearInterval(interval);
  //   }
  // }, [isConnected, address]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        🏆 Ended Auctions Manager
      </h2>

      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            💡 How This Works
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>Purpose:</strong> Find all auctions with status 3 (ENDED)
              where you are the winner
            </p>
            <p>
              <strong>Action:</strong> Click "Settle Auction" to call
              settleAuction() and claim your NFT
            </p>
            <p>
              <strong>Auto-refresh:</strong> List updates every 30 seconds
              automatically
            </p>
            <p>
              <strong>Gas:</strong> Each settlement costs ~300,000 gas
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchEndedAuctions}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Checking..." : "Check Ended Auctions"}
          </button>

          {endedAuctions.length > 0 && (
            <button
              onClick={settleAllAuctions}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Settle All ({endedAuctions.length})
            </button>
          )}
        </div>

        {endedAuctions.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">
              📊 Ended Auctions ({endedAuctions.length})
            </h3>

            <div className="grid gap-4">
              {endedAuctions.map((auction) => (
                <div
                  key={auction.auctionId}
                  className="bg-white p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="font-semibold text-lg">
                          Auction #{auction.auctionId}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            auction.auctionType === 0
                              ? "bg-blue-100 text-blue-800"
                              : auction.auctionType === 1
                              ? "bg-green-100 text-green-800"
                              : auction.auctionType === 2
                              ? "bg-purple-100 text-purple-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {auction.auctionType === 0
                            ? "ENGLISH"
                            : auction.auctionType === 1
                            ? "DUTCH"
                            : auction.auctionType === 2
                            ? "SEALED BID"
                            : "RESERVE"}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                          ENDED
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Ended:</strong> {auction.endTime}
                        </div>
                        <div>
                          <strong>Time Since Ended:</strong>{" "}
                          {auction.timeSinceEnded} minutes
                        </div>
                        <div>
                          <strong>Highest Bid:</strong> {auction.highestBid} ETH
                        </div>
                        <div>
                          <strong>Winner:</strong> {auction.highestBidder}
                        </div>
                        {auction.reservePrice && (
                          <div>
                            <strong>Reserve Price:</strong>{" "}
                            {auction.reservePrice} ETH
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => settleAuction(auction.auctionId)}
                        disabled={isProcessing === auction.auctionId}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {isProcessing === auction.auctionId
                          ? "Settling..."
                          : "Settle Auction"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {endedAuctions.length === 0 && !isLoading && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-600">
              No ENDED auctions found where you are the winner.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Check back later or try refreshing the list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
