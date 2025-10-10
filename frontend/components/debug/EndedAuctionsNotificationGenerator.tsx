"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import toast from "react-hot-toast";
import { useAuctionNotifications } from "@/providers/AuctionNotificationsProvider";

export default function EndedAuctionsNotificationGenerator() {
  const { address, isConnected } = useAccount();
  const { reloadClaimNotifications } = useAuctionNotifications();
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const generateNotificationsForEndedAuctions = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsGenerating(true);
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

      const endedAuctions = [];
      const notifications = [];

      // Check auctions from 1 to totalAuctions
      for (let auctionId = 1; auctionId <= totalAuctions; auctionId++) {
        try {
          const auctionData = await auctionContract.getAuction(auctionId);
          const status = Number(auctionData.status);
          const endTime = Number(auctionData.endTime);
          const highestBidder = auctionData.highestBidder;
          const auctionType = Number(auctionData.auctionType);
          const highestBid = ethers.formatEther(auctionData.highestBid);

          // Check if auction is ENDED (status 3) and user is winner
          if (status === 3) {
            const isUserWinner =
              highestBidder.toLowerCase() === address.toLowerCase();

            if (isUserWinner) {
              const endedAuction = {
                auctionId,
                status,
                endTime: new Date(endTime * 1000).toISOString(),
                highestBidder,
                auctionType,
                highestBid,
                isUserWinner,
                timeSinceEnded: Math.floor((Date.now() / 1000 - endTime) / 60), // minutes
              };

              endedAuctions.push(endedAuction);

              // Create notification
              const notification = {
                id: `${auctionId}-settleAuction-${Date.now()}`,
                auctionId: auctionId.toString(),
                message: `🎉 You won auction #${auctionId}! Click to claim your NFT.`,
                timestamp: Date.now(),
                isRead: false,
                transactionHash: "ended-auction",
                priority: "high" as const,
                notificationType: "settleAuction" as const,
                isPermanent: true,
              };

              notifications.push(notification);
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

      // Save notifications to localStorage
      if (notifications.length > 0) {
        const existingNotifications = JSON.parse(
          localStorage.getItem("moove-claim-notifications") || "[]"
        );

        // Filter out duplicates
        const newNotifications = notifications.filter(
          (notification) =>
            !existingNotifications.some(
              (existing: any) =>
                existing.auctionId === notification.auctionId &&
                existing.notificationType === notification.notificationType
            )
        );

        if (newNotifications.length > 0) {
          const updatedNotifications = [
            ...existingNotifications,
            ...newNotifications,
          ];
          localStorage.setItem(
            "moove-claim-notifications",
            JSON.stringify(updatedNotifications)
          );

          // Mark auctions as processed
          const processedAuctions = JSON.parse(
            localStorage.getItem("moove-processed-claim-auctions") || "[]"
          );

          newNotifications.forEach((notification) => {
            if (!processedAuctions.includes(notification.auctionId)) {
              processedAuctions.push(notification.auctionId);
            }
          });

          localStorage.setItem(
            "moove-processed-claim-auctions",
            JSON.stringify(processedAuctions)
          );

          toast.success(
            `✅ Generated ${newNotifications.length} notifications for ENDED auctions!`
          );

          // ✅ NEW: Reload notifications in the context
          reloadClaimNotifications();
        } else {
          toast("ℹ️ All ENDED auctions already have notifications");
        }
      } else {
        toast("ℹ️ No ENDED auctions found where you are the winner");
      }

      const results = {
        totalAuctionsChecked: totalAuctions,
        endedAuctionsFound: endedAuctions.length,
        notificationsGenerated: notifications.length,
        endedAuctions,
        timestamp: new Date().toISOString(),
      };

      setResults(results);
      console.log("🔔 Notification Generation Results:", results);
    } catch (error) {
      console.error("Error generating notifications:", error);
      toast.error("Error generating notifications");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        🔔 Ended Auctions Notification Generator
      </h2>

      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            💡 How This Works
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>Purpose:</strong> Find all ENDED auctions where you are
              the winner and generate notifications
            </p>
            <p>
              <strong>Integration:</strong> Notifications appear in the
              notification bell (top-right)
            </p>
            <p>
              <strong>Action:</strong> Click on notifications to call
              settleAuction() and claim your NFT
            </p>
            <p>
              <strong>Permanent:</strong> These notifications cannot be
              dismissed until you claim the NFT
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={generateNotificationsForEndedAuctions}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Notifications"}
          </button>

          <button
            onClick={reloadClaimNotifications}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Reload Notifications
          </button>
        </div>

        {results && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📊 Generation Results</h3>

            <div className="text-sm space-y-2">
              <div>
                <strong>Total Auctions Checked:</strong>{" "}
                {results.totalAuctionsChecked}
              </div>
              <div>
                <strong>Ended Auctions Found:</strong>{" "}
                {results.endedAuctionsFound}
              </div>
              <div>
                <strong>Notifications Generated:</strong>{" "}
                {results.notificationsGenerated}
              </div>
              <div>
                <strong>Timestamp:</strong> {results.timestamp}
              </div>
            </div>

            {results.endedAuctions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-blue-800 mb-2">
                  Ended Auctions
                </h4>
                <div className="space-y-2">
                  {results.endedAuctions.map((auction: any) => (
                    <div
                      key={auction.auctionId}
                      className="bg-blue-50 p-2 rounded text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>Auction #{auction.auctionId}</strong> -
                          {auction.auctionType === 0
                            ? " ENGLISH"
                            : auction.auctionType === 1
                            ? " DUTCH"
                            : auction.auctionType === 2
                            ? " SEALED BID"
                            : " RESERVE"}
                        </div>
                        <div className="text-gray-600">
                          {auction.timeSinceEnded} min ago
                        </div>
                      </div>
                      <div className="text-gray-600">
                        Bid: {auction.highestBid} ETH
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✅ Benefits</h3>
          <div className="text-sm text-green-700 space-y-1">
            <p>
              <strong>Automatic Detection:</strong> Finds all ENDED auctions
              where you are the winner
            </p>
            <p>
              <strong>Notification Integration:</strong> Works with the existing
              notification system
            </p>
            <p>
              <strong>No Missed Claims:</strong> Ensures you don't miss any
              claim opportunities
            </p>
            <p>
              <strong>Easy Access:</strong> Click notifications to claim NFTs
              directly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
