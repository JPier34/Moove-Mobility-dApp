"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

export default function SealedBidNotificationTest() {
  const { address } = useAccount();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const testSealedBidNotifications = async () => {
    if (!address) {
      alert("Please connect wallet first");
      return;
    }

    setIsTesting(true);
    setTestResults([]);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        provider
      );

      const results = [];

      // Test auctions 1-10
      for (let i = 1; i <= 10; i++) {
        try {
          const auction = await auctionContract.getAuction(i);
          const auctionType = Number(auction.auctionType);
          const status = Number(auction.status);
          const endTime = Number(auction.endTime);
          const highestBidder = auction.highestBidder;
          const now = Math.floor(Date.now() / 1000);

          // Only check Sealed Bid auctions
          if (auctionType === 2) {
            const isExpired = now > endTime;

            // For Sealed Bid, we need to determine the winner from bids
            let actualWinner = highestBidder;
            let actualWinningBid = 0;
            let totalBids = 0;

            if (isExpired && status === 1) {
              try {
                // Get all bids for this auction
                const bids = await auctionContract.getAuctionBids(i);
                totalBids = bids.length;

                // Find the highest bid
                for (let j = 0; j < bids.length; j++) {
                  const bidAmount = Number(bids[j].amount);
                  if (bidAmount > actualWinningBid) {
                    actualWinningBid = bidAmount;
                    actualWinner = bids[j].bidder;
                  }
                }
              } catch (error) {
                console.warn(`Could not get bids for auction ${i}:`, error);
              }
            }

            const isUserWinner =
              actualWinner.toLowerCase() === address.toLowerCase();
            const shouldHaveNotification =
              status === 1 && isExpired && isUserWinner;

            results.push({
              auctionId: i,
              auctionType: "SEALED_BID",
              status,
              endTime: new Date(endTime * 1000).toISOString(),
              now: new Date().toISOString(),
              isExpired,
              highestBidder,
              actualWinner,
              actualWinningBid: actualWinningBid / 1e18, // Convert to ETH
              totalBids,
              isUserWinner,
              shouldHaveNotification,
              timeLeft: Math.max(0, endTime - now),
            });
          }
        } catch (error) {
          // Auction doesn't exist
        }
      }

      setTestResults(results);
    } catch (error) {
      console.error("Test failed:", error);
      alert(
        "Test failed: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsTesting(false);
    }
  };

  const endSealedBidAuction = async (auctionId: number) => {
    if (!address) {
      alert("Please connect wallet first");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        signer
      );

      console.log(`🏁 Ending Sealed Bid auction ${auctionId}...`);
      const tx = await auctionContract.endAuction(auctionId);
      console.log(`📝 Transaction sent: ${tx.hash}`);

      await tx.wait();
      console.log(`✅ Auction ${auctionId} ended successfully`);

      alert(`Auction ${auctionId} ended successfully! Check the results.`);

      // Refresh test results
      await testSealedBidNotifications();
    } catch (error) {
      console.error("End auction failed:", error);
      alert(
        "End auction failed: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  const endAllExpiredSealedBids = async () => {
    if (!address) {
      alert("Please connect wallet first");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        signer
      );

      // Find all expired Sealed Bid auctions
      const expiredAuctions = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const auction = await auctionContract.getAuction(i);
          const auctionType = Number(auction.auctionType);
          const status = Number(auction.status);
          const endTime = Number(auction.endTime);
          const now = Math.floor(Date.now() / 1000);

          if (auctionType === 2 && status === 1 && now > endTime) {
            expiredAuctions.push(i);
          }
        } catch (error) {
          // Auction doesn't exist
        }
      }

      if (expiredAuctions.length === 0) {
        alert("No expired Sealed Bid auctions found!");
        return;
      }

      console.log(
        `🏁 Ending ${expiredAuctions.length} expired Sealed Bid auctions...`
      );

      for (const auctionId of expiredAuctions) {
        try {
          console.log(`🏁 Ending auction ${auctionId}...`);
          const tx = await auctionContract.endAuction(auctionId);
          console.log(`📝 Transaction sent: ${tx.hash}`);

          await tx.wait();
          console.log(`✅ Auction ${auctionId} ended successfully`);

          // Wait between transactions to avoid nonce issues
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Failed to end auction ${auctionId}:`, error);
        }
      }

      alert(
        `Ended ${expiredAuctions.length} expired Sealed Bid auctions! Check the results.`
      );

      // Refresh test results
      await testSealedBidNotifications();
    } catch (error) {
      console.error("End all auctions failed:", error);
      alert(
        "End all auctions failed: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">
        🔍 Sealed Bid Notification Test
      </h2>

      <div className="flex gap-4">
        <button
          onClick={testSealedBidNotifications}
          disabled={isTesting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isTesting ? "Testing..." : "Test Sealed Bid Notifications"}
        </button>

        <button
          onClick={endAllExpiredSealedBids}
          disabled={isTesting}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          🏁 End All Expired Sealed Bids
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Test Results:</h3>
          <div className="space-y-2">
            {testResults.map((result) => (
              <div
                key={result.auctionId}
                className={`p-3 rounded border ${
                  result.shouldHaveNotification
                    ? "bg-red-100 border-red-300"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <div className="font-semibold">
                  Auction #{result.auctionId} - {result.auctionType}
                </div>
                <div className="text-sm">
                  Status: {result.status} | Expired:{" "}
                  {result.isExpired ? "✅" : "❌"} | User Winner:{" "}
                  {result.isUserWinner ? "✅" : "❌"} | Should Have
                  Notification:{" "}
                  {result.shouldHaveNotification ? "🚨 YES" : "❌ NO"}
                </div>
                <div className="text-xs text-gray-600">
                  End Time: {result.endTime} | Time Left: {result.timeLeft}s |
                  Total Bids: {result.totalBids}
                </div>
                <div className="text-xs text-gray-600">
                  Contract Winner: {result.highestBidder} | Actual Winner:{" "}
                  {result.actualWinner} | Winning Bid: {result.actualWinningBid}{" "}
                  ETH
                </div>
                <div className="text-xs text-blue-600 font-semibold">
                  🎯 Notification should appear for: {result.actualWinner}
                </div>
                {result.isExpired && result.status === 1 && (
                  <div className="mt-2">
                    {result.isUserWinner ? (
                      <div>
                        <button
                          onClick={() => endSealedBidAuction(result.auctionId)}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          🏁 End Auction #{result.auctionId} (You are the
                          winner!)
                        </button>
                        <div className="text-xs text-green-600 mt-1">
                          ✅ You are the winner - you can call endAuction()
                        </div>
                      </div>
                    ) : (
                      <div>
                        <button
                          onClick={() => endSealedBidAuction(result.auctionId)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          🏁 End Auction #{result.auctionId} (Emergency - anyone
                          can call)
                        </button>
                        <div className="text-xs text-red-600 mt-1">
                          ⚠️ You are NOT the winner - only emergency call
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
