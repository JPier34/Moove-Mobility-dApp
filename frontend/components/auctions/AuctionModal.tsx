"use client";

import React, { useState, useEffect } from "react";
import { Auction, AuctionType, AuctionStatus } from "../../types/auction";
import Button from "../ui/Button";
import { shortenAddress } from "../../utils/shortenAddress";
import { useAccount } from "wagmi";
import { useModalLock } from "@/hooks/useModalLock";
import {
  usePlaceBid,
  useCurrentDutchPrice,
  useBuyNowDutch,
} from "@/hooks/useAuction";
import { useDutchAuction } from "../../hooks/useDutchAuction";
import { useDutchPrice } from "@/hooks/useDutchPrice";
import { useAuctionHandler } from "@/hooks/useAuctionHandler";
import { useSealedBidAuction } from "@/hooks/useSealedBidAuction";
import DutchAuctionSuccessModal from "./DutchAuctionSuccessModal";
import { AuctionRefundStatus } from "./AuctionRefundStatus";
import { formatEther, parseEther } from "viem";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { useAuctionsEnhanced } from "@/hooks/enhanced-auction-utils";
import { useAuctionRefresh } from "@/hooks/useAuctionRefresh";

interface AuctionModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

// Category emojis
const categoryEmojis = {
  scooter: "🛴",
  bike: "🚲",
  skateboard: "🛹",
  moped: "🛵",
};

export default function AuctionModal({
  auction,
  isOpen,
  onClose,
  onRefresh,
}: AuctionModalProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"details">("details");
  const [timeLeft, setTimeLeft] = useState("");

  // Local auction state that can be updated
  const [localAuction, setLocalAuction] = useState<Auction>(auction);

  // Use the global auction refresh system
  const { auctions, refreshTrigger, triggerRefresh } = useAuctionRefresh();

  // DISABLED: Automatic refresh system to prevent infinite loops
  // The auction data will be updated only when explicitly triggered by user actions
  // (like placing a bid, claiming, etc.)

  // Listen for manual refresh events
  useEffect(() => {
    const handleManualRefresh = () => {
      const updatedAuction = auctions.find(
        (a) => a.auctionId === auction.auctionId
      );
      if (updatedAuction) {
        console.log(
          `🔄 [AuctionModal ${auction.auctionId}] Manual refresh triggered`
        );
        setLocalAuction(updatedAuction);
      }
    };

    // Listen for custom refresh events
    window.addEventListener("auction-refresh", handleManualRefresh);
    return () =>
      window.removeEventListener("auction-refresh", handleManualRefresh);
  }, [auctions, auction.auctionId]);

  // Update local auction when prop changes
  useEffect(() => {
    console.log("🔄 Auction prop changed, updating local state:", {
      auctionId: auction.auctionId,
      currentBid: auction.currentBid,
      startPrice: auction.startPrice,
      oldCurrentBid: localAuction.currentBid,
      oldStartPrice: localAuction.startPrice,
    });
    setLocalAuction(auction);
  }, [auction]);

  // Use the unified Dutch price hook with local auction
  const { currentPrice: currentDutchPrice, isActive: isDutchActive } =
    useDutchPrice(localAuction, 1000);

  // Bidding state
  const [bidAmount, setBidAmount] = useState("");
  const [customBidAmount, setCustomBidAmount] = useState("");
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isRefreshingAuction, setIsRefreshingAuction] = useState(false);
  const [lastBidAmount, setLastBidAmount] = useState<string | null>(null);

  // Sealed bid state - initialize with start price
  const [sealedBidAmount, setSealedBidAmount] = useState(
    localAuction.startPrice || "0.001"
  );

  // Hooks for auction interactions
  const { placeBid } = usePlaceBid();
  const { buyNowDutch } = useBuyNowDutch();
  const {
    handleDutchAuction,
    isProcessing: isDutchProcessing,
    step: dutchStep,
    showSuccessModal,
    successData,
    closeSuccessModal,
  } = useDutchAuction();

  const {
    handleAuctionAction,
    isProcessing: isHandlerProcessing,
    error: handlerError,
    step: handlerStep,
  } = useAuctionHandler();

  const sealedBidAuction = useSealedBidAuction();

  // Check if user has already submitted a sealed bid
  const [hasSubmittedSealedBid, setHasSubmittedSealedBid] = useState(false);
  const [sealedBidStatus, setSealedBidStatus] = useState<string>("");

  // Simple modal lock during transactions
  const { lockedOnClose, isLocked } = useModalLock({
    isLocked: isSubmittingBid || isHandlerProcessing,
    onClose,
  });

  // Simple body scroll management
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Check sealed bid status when auction changes
  useEffect(() => {
    const checkSealedBidStatus = async () => {
      if (
        Number(localAuction.auctionType) === AuctionType.SEALED_BID &&
        address
      ) {
        try {
          // Check if user has already submitted a sealed bid
          const bidData = localStorage.getItem(
            `sealed_bid_${localAuction.nftId}_${address}`
          );
          if (bidData) {
            const parsedData = JSON.parse(bidData);
            setHasSubmittedSealedBid(true);
            setSealedBidStatus(
              parsedData.status === "committed" ? "committed" : "revealed"
            );
          } else {
            setHasSubmittedSealedBid(false);
            setSealedBidStatus("");
          }
        } catch (error) {
          console.error("Error checking sealed bid status:", error);
          setHasSubmittedSealedBid(false);
          setSealedBidStatus("");
        }
      } else {
        setHasSubmittedSealedBid(false);
        setSealedBidStatus("");
      }
    };

    checkSealedBidStatus();
  }, [localAuction.auctionId, localAuction.auctionType, address]);

  // Debug Sealed Bid visibility
  useEffect(() => {
    if (Number(localAuction.auctionType) === AuctionType.SEALED_BID) {
      console.log("🔍 [Sealed Bid Debug]", {
        auctionId: localAuction.auctionId,
        auctionType: Number(localAuction.auctionType),
        status: Number(localAuction.status),
        isSealedBid:
          Number(localAuction.auctionType) === AuctionType.SEALED_BID,
        isActive: Number(localAuction.status) === AuctionStatus.ACTIVE,
        isReveal: Number(localAuction.status) === AuctionStatus.REVEAL,
        shouldShow:
          Number(localAuction.auctionType) === AuctionType.SEALED_BID &&
          (Number(localAuction.status) === AuctionStatus.ACTIVE ||
            Number(localAuction.status) === AuctionStatus.REVEAL),
      });
    }
  }, [localAuction.auctionId, localAuction.auctionType, localAuction.status]);

  // Calculate time remaining
  useEffect(() => {
    if (!isOpen) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      // ✅ FIX: Handle both Date objects and ISO strings
      const endTime =
        typeof localAuction.endTime === "string"
          ? new Date(localAuction.endTime).getTime()
          : localAuction.endTime.getTime();
      const difference = endTime - now;

      // ✅ DEBUG: Log time calculation for auction #4
      if (localAuction.auctionId === "4") {
        console.log("🔍 [AuctionModal #4] Time calculation:", {
          auctionId: localAuction.auctionId,
          now: now,
          endTime: endTime,
          endTimeString: localAuction.endTime,
          difference: difference,
          differenceMinutes: Math.floor(difference / 60000),
          differenceSeconds: Math.floor(difference / 1000),
        });
      }

      if (difference > 0) {
        // Calculate auto-extend zone for English auctions
        const extensionThresholdMinutes =
          localAuction.extensionThresholdMinutes || 5; // Default 5 minutes
        const extensionThreshold = extensionThresholdMinutes * 60 * 1000; // Convert to milliseconds
        const isExtensionZone = difference <= extensionThreshold;

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        let timeString = "";
        if (days > 0) {
          timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else if (hours > 0) {
          timeString = `${hours}h ${minutes}m ${seconds}s`;
        } else {
          timeString = `${minutes}m ${seconds}s`;
        }

        // Add auto-extend indicator for English auctions in extension zone
        if (
          isExtensionZone &&
          Number(localAuction.auctionType) === AuctionType.ENGLISH
        ) {
          timeString += ` ⏰ +${
            localAuction.extensionDurationMinutes || 10
          }min on bid`;
        }

        // ✅ DEBUG: Log timeLeft setting for auction #4
        if (localAuction.auctionId === "4") {
          console.log("🔍 [AuctionModal #4] Setting timeLeft:", {
            auctionId: localAuction.auctionId,
            difference: difference,
            timeString: timeString,
            isExtensionZone: isExtensionZone,
          });
        }

        setTimeLeft(timeString);
      } else {
        // ✅ DEBUG: Log when setting "Auction Ended" for auction #4
        if (localAuction.auctionId === "4") {
          console.log(
            "🔍 [AuctionModal #4] Setting timeLeft to 'Auction Ended':",
            {
              auctionId: localAuction.auctionId,
              difference: difference,
              now: now,
              endTime: endTime,
            }
          );
        }
        setTimeLeft("Auction Ended");
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [localAuction.endTime, isOpen]);

  // Dutch price calculation is now handled by useDutchPrice hook

  // Function to manually update local auction state
  const updateLocalAuction = (updatedAuction: Auction) => {
    console.log("🔄 Updating local auction state:", {
      oldCurrentBid: localAuction.currentBid,
      newCurrentBid: updatedAuction.currentBid,
      oldStartPrice: localAuction.startPrice,
      newStartPrice: updatedAuction.startPrice,
    });
    setLocalAuction(updatedAuction);
  };

  // Function to fetch fresh auction data directly
  const fetchFreshAuctionData = async () => {
    try {
      console.log(
        `🔄 Fetching fresh data for auction ${localAuction.auctionId}...`
      );

      // Use the global refresh system instead of calling hook inside function
      triggerRefresh();

      // Wait a bit for the refresh to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Find the specific auction from the global auctions data
      const freshAuction = auctions.find(
        (a: Auction) => a.auctionId === localAuction.auctionId
      );

      if (freshAuction) {
        console.log("✅ Fresh auction data found:", {
          auctionId: freshAuction.auctionId,
          currentBid: freshAuction.currentBid,
          startPrice: freshAuction.startPrice,
          status: freshAuction.status,
        });
        setLocalAuction(freshAuction);
        return freshAuction;
      } else {
        console.warn("⚠️ Fresh auction data not found");
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching fresh auction data:", error);
      return null;
    }
  };

  // Function to refresh only this specific auction data
  const refreshAuctionData = async () => {
    setIsRefreshingAuction(true);
    try {
      console.log(`🔄 Refreshing auction ${localAuction.auctionId} data...`);

      // Use the global refresh system
      triggerRefresh();
      console.log("✅ Auction data refresh triggered globally");

      // Also try parent refresh function as fallback
      if (onRefresh && typeof onRefresh === "function") {
        await onRefresh();
        console.log(
          `✅ Auction ${localAuction.auctionId} data refreshed via parent`
        );
      }
    } catch (error) {
      console.error("❌ Error refreshing auction data:", error);
      // Fallback to page reload on error
      console.log("🔄 Fallback: reloading page due to refresh error");
      window.location.reload();
    } finally {
      setIsRefreshingAuction(false);
    }
  };

  const handleBid = async (amount: string) => {
    if (!isConnected) {
      toast.error("Connect wallet to place bid");
      return;
    }

    // Check if auction has ended
    const now = new Date();
    const endTime = new Date(localAuction.endTime);

    if (now >= endTime) {
      toast.error("❌ This auction has already ended. Cannot place bid.");
      return;
    }

    // Validate bid amount vs Buy Now price (only for Dutch auctions)
    if (Number(auction.auctionType) === AuctionType.DUTCH) {
      const bidAmount = parseFloat(amount);
      const buyNowPrice = parseFloat(auction.buyNowPrice || "0");

      if (buyNowPrice > 0 && bidAmount >= buyNowPrice) {
        toast.error(
          `Your bid (${amount} ETH) should be less than Buy Now price (${auction.buyNowPrice} ETH). Use Buy Now instead!`
        );
        return;
      }
    }

    // Prevent modal from closing during MetaMask interaction
    console.log("🔒 Preventing modal close during bid process");
    setIsSubmittingBid(true);

    // Show initial message
    toast.success(
      `🚀 Sending bid of ${amount} ETH... Please confirm in MetaMask`,
      { duration: 3000 }
    );

    try {
      console.log(
        "Placing bid:",
        amount,
        "ETH for auction:",
        localAuction.auctionId,
        "Type:",
        localAuction.auctionType
      );

      // Use the unified auction handler for all auction types
      const result = await handleAuctionAction(localAuction, "bid", amount);

      if (result.success) {
        console.log("✅ Bid transaction CONFIRMED on blockchain!");
        setLastBidAmount(amount);
        setBidAmount(""); // Clear the bid field

        // Show success message - transaction is already confirmed
        toast.success(`🎉 Bid of ${amount} ETH confirmed on blockchain!`, {
          duration: 3000,
        });

        // ✅ OPTIMIZED: Single event emission only after MetaMask confirmation
        console.log(
          "🔄 Transaction confirmed, emitting single refresh event..."
        );

        // Single consolidated event for all refresh needs
        window.dispatchEvent(
          new CustomEvent("bidConfirmed", {
            detail: {
              auctionId: localAuction.auctionId,
              bidAmount: amount,
              bidder: address,
              timestamp: Date.now(),
              confirmed: true,
            },
          })
        );

        // Store original bid to verify changes
        const originalCurrentBid = localAuction.currentBid;
        console.log("📊 Original current bid:", originalCurrentBid);
        console.log("📊 Expected new bid:", amount);

        // Single refresh attempt - no retry needed since we're not waiting for confirmation
        try {
          await refreshAuctionData();
          console.log("✅ Auction data refresh completed");

          // Show final success message with updated data
          toast.success(
            `✅ Bid of ${amount} ETH placed successfully! Current bid updated.`,
            {
              duration: 5000,
            }
          );
        } catch (error) {
          console.error("❌ Failed to refresh auction data:", error);
          // Fallback message
          toast.success(
            `✅ Bid of ${amount} ETH placed successfully! The auction will update shortly.`,
            {
              duration: 5000,
            }
          );
        }
      } else {
        console.error("❌ Bid transaction failed:", result.error);
        toast.error(result.error || "Error placing bid");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      toast.error("Error placing bid");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleSealedBid = async () => {
    if (!sealedBidAmount) {
      toast.error("Please enter bid amount");
      return;
    }

    setIsSubmittingBid(true);
    try {
      console.log("Submitting sealed bid for auction:", auction.auctionId);

      // Use the new sealed bid handler with automatic nonce
      const success = await sealedBidAuction.submitSealedBid(
        parseInt(auction.auctionId),
        parseInt(auction.nftId),
        sealedBidAmount,
        auction.startPrice // Pass minimum price for validation
      );

      if (success) {
        setSealedBidAmount("");
        setHasSubmittedSealedBid(true);
        setSealedBidStatus("committed");

        toast.success(
          "Sealed bid submitted successfully! Refreshing auction data...",
          { duration: 3000 }
        );

        // Refresh auction data without closing modal
        await refreshAuctionData();

        toast.success("✅ Your sealed bid is now registered!", {
          duration: 4000,
        });
      } else {
        toast.error("Error submitting sealed bid");
      }
    } catch (error) {
      console.error("Error submitting sealed bid:", error);
      toast.error("Error submitting sealed bid");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleDutchBuy = async () => {
    if (!isConnected) {
      toast.error("Connect wallet to buy");
      return;
    }

    setIsSubmittingBid(true);
    try {
      // Use the direct Dutch auction handler to show success modal
      const success = await handleDutchAuction(
        parseInt(auction.auctionId),
        parseFloat(currentDutchPrice),
        () => {
          // Success callback - close the auction modal after Dutch success modal
          console.log("Dutch auction purchase successful");
          setTimeout(() => {
            onClose();
          }, 5000); // Close after 5 seconds to let user see the success
        }
      );

      if (!success) {
        toast.error("Error processing Dutch auction purchase");
      }
    } catch (error) {
      console.error("Error buying:", error);
      toast.error("Error processing purchase");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Quick bid amounts - first bid can be startPrice, subsequent bids need increment
  const getQuickBidAmounts = () => {
    const currentBidStr = localAuction.currentBid || "0";
    const currentBid = parseFloat(currentBidStr);
    const increment = parseFloat(localAuction.bidIncrement) || 0.001;
    const startPrice = parseFloat(localAuction.startPrice) || 0.001;

    // If no bids yet, first bid can be startPrice
    if (currentBid === 0 || isNaN(currentBid)) {
      return [
        {
          label: `${startPrice.toFixed(6)} ETH`,
          amount: startPrice.toFixed(6),
        },
        {
          label: `+${increment.toFixed(6)} ETH`,
          amount: (startPrice + increment).toFixed(6),
        },
        {
          label: `+${(increment * 2).toFixed(6)} ETH`,
          amount: (startPrice + increment * 2).toFixed(6),
        },
        { label: "Custom", amount: "custom" },
      ];
    }

    // If bids exist, need to add increment
    return [
      {
        label: `+${increment.toFixed(6)} ETH`,
        amount: (currentBid + increment).toFixed(6),
      },
      {
        label: `+${(increment * 2).toFixed(6)} ETH`,
        amount: (currentBid + increment * 2).toFixed(6),
      },
      {
        label: `+${(increment * 5).toFixed(6)} ETH`,
        amount: (currentBid + increment * 5).toFixed(6),
      },
      { label: "Custom", amount: "custom" },
    ];
  };

  const isOwner =
    address && address.toLowerCase() === auction.seller.toLowerCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" data-modal="true">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={lockedOnClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden ${
            isLocked ? "ring-4 ring-blue-500 ring-opacity-50" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Transaction in progress overlay */}
          {isLocked && (
            <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium z-10">
              🔒 Transaction in progress
            </div>
          )}
          {/* Header */}
          <div
            className={`flex items-center justify-between p-6 border-b border-gray-200 ${
              isLocked ? "pt-14" : ""
            }`}
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {auction.nftName}
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-500">
                  Auction #{auction.auctionId}
                </span>
                <span
                  className={`text-sm font-medium ${
                    timeLeft.includes("⏰")
                      ? "text-orange-500 animate-pulse"
                      : "text-moove-primary"
                  }`}
                >
                  {timeLeft}
                </span>
              </div>
            </div>
            <button
              onClick={lockedOnClose}
              disabled={isLocked}
              className={`transition-colors ${
                isLocked
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title={
                isLocked ? "Cannot close during transaction" : "Close modal"
              }
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Left column - Image and details */}
            <div className="space-y-6">
              {/* NFT Image */}
              <div className="aspect-square bg-gradient-to-br from-moove-50 to-moove-100 rounded-xl p-8">
                {auction.nftImage &&
                auction.nftImage !== "/images/default-nft.png" ? (
                  <img
                    src={auction.nftImage}
                    alt={auction.nftName}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      console.log(
                        "❌ Modal image failed to load:",
                        auction.nftImage
                      );
                      e.currentTarget.style.display = "none";
                    }}
                    onLoad={() =>
                      console.log(
                        "✅ Modal image loaded successfully:",
                        auction.nftImage
                      )
                    }
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-moove-primary to-moove-secondary rounded-xl flex items-center justify-center text-8xl text-white">
                    {categoryEmojis[
                      auction.nftCategory as keyof typeof categoryEmojis
                    ] || "🚗"}
                  </div>
                )}
              </div>

              {/* NFT Details */}
              <div>
                {/* NFT Title and Description */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {auction.nftName}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {auction.attributes.special ||
                      auction.attributes.traits ||
                      "Unique NFT for vehicle access"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Auction ID: #{auction.auctionId}
                    </span>
                    <span className="text-sm text-gray-500">
                      NFT ID: #{auction.nftId}
                    </span>
                  </div>
                </div>

                {/* Details content */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(auction.attributes).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500 mb-1">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </div>
                        <div className="font-medium text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Seller info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Venditore</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-moove-primary rounded-full flex items-center justify-center text-white text-sm">
                        {auction.seller.slice(2, 4).toUpperCase()}
                      </div>
                      <span className="font-mono text-gray-900">
                        {auction.seller}
                      </span>
                      {isOwner && (
                        <span className="px-2 py-1 bg-moove-100 text-moove-700 rounded-full text-xs">
                          Tu
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Success banner for recent bid */}
                  {lastBidAmount && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="text-green-600">
                            {isRefreshingAuction ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                            ) : (
                              "✅"
                            )}
                          </div>
                          <div>
                            <div className="text-green-800 font-medium text-sm">
                              {isRefreshingAuction
                                ? "Processing your bid..."
                                : "Bid placed successfully!"}
                            </div>
                            <div className="text-green-700 text-xs">
                              Your bid of {lastBidAmount} ETH is{" "}
                              {isRefreshingAuction
                                ? "being processed"
                                : "now active"}
                            </div>
                          </div>
                        </div>
                        {!isRefreshingAuction && (
                          <button
                            onClick={() => setLastBidAmount(null)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column - Bidding interface */}
            <div className="space-y-6">
              {/* Current price */}
              <div className="bg-gradient-to-r from-moove-50 to-moove-100 rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-2">
                  {Number(localAuction.auctionType) === AuctionType.DUTCH
                    ? "Current Price"
                    : Number(localAuction.auctionType) ===
                        AuctionType.SEALED_BID &&
                      Number(localAuction.status) === AuctionStatus.PENDING
                    ? "Hidden Bids"
                    : localAuction.currentBid === "0"
                    ? "Starting Price"
                    : (Number(localAuction.auctionType) ===
                        AuctionType.RESERVE ||
                        Number(localAuction.auctionType) ===
                          AuctionType.ENGLISH) &&
                      localAuction.highestBidder &&
                      localAuction.highestBidder.toLowerCase() ===
                        address?.toLowerCase()
                    ? "Your Bid"
                    : "Current Bid"}
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {Number(localAuction.auctionType) === AuctionType.DUTCH
                      ? currentDutchPrice
                      : Number(localAuction.auctionType) ===
                          AuctionType.SEALED_BID &&
                        Number(localAuction.status) === AuctionStatus.PENDING
                      ? "???"
                      : localAuction.currentBid === "0"
                      ? localAuction.startPrice
                      : localAuction.currentBid}
                  </span>
                  <span className="text-xl text-gray-600">
                    {auction.currency}
                  </span>
                  {isRefreshingAuction && (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-moove-primary border-t-transparent ml-2"></div>
                  )}
                </div>
                {localAuction.currentBid !== "0" &&
                  localAuction.auctionType !== AuctionType.DUTCH && (
                    <div className="text-sm text-gray-500 mt-1">
                      Minimum bid:{" "}
                      {(
                        parseFloat(localAuction.currentBid) +
                        parseFloat(localAuction.bidIncrement)
                      ).toFixed(4)}{" "}
                      ETH
                    </div>
                  )}
              </div>

              {/* Bidding interface */}
              {!isOwner &&
                Number(localAuction.status) === AuctionStatus.ACTIVE && (
                  <div className="space-y-4">
                    {Number(localAuction.auctionType) === AuctionType.DUTCH && (
                      <Button
                        onClick={handleDutchBuy}
                        disabled={
                          !isConnected ||
                          isSubmittingBid ||
                          isDutchProcessing ||
                          !isDutchActive
                        }
                        className="w-full"
                        size="lg"
                      >
                        {isSubmittingBid || isDutchProcessing
                          ? dutchStep === "buying"
                            ? "Buying..."
                            : "Processing..."
                          : !isDutchActive
                          ? "Auction Ended"
                          : `Buy Now for ${currentDutchPrice} ETH`}
                      </Button>
                    )}

                    {Number(localAuction.auctionType) ===
                      AuctionType.SEALED_BID &&
                      (Number(localAuction.status) === AuctionStatus.ACTIVE ||
                        Number(localAuction.status) ===
                          AuctionStatus.REVEAL) && (
                        <div className="space-y-4">
                          {/* Debug info - removed console.log from JSX */}
                          {hasSubmittedSealedBid ? (
                            /* User has already submitted a sealed bid */
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="text-green-800 font-medium mb-2">
                                ✅ Sealed Bid Submitted
                              </div>
                              <div className="text-green-700 text-sm mb-2">
                                You have already submitted a sealed bid for this
                                auction.
                              </div>
                              <div className="text-green-600 text-xs">
                                Status:{" "}
                                <span className="font-semibold">
                                  {sealedBidStatus}
                                </span>
                              </div>
                              <div className="text-green-600 text-xs mt-1">
                                Wait for the reveal phase to see the results.
                              </div>
                            </div>
                          ) : (
                            /* User can still submit a sealed bid */
                            <>
                              {/* Check if auction is still active (not expired) */}
                              {new Date().getTime() >
                              new Date(localAuction.endTime).getTime() ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                  <div className="text-red-800 font-medium mb-2">
                                    ⏰ Auction Expired
                                  </div>
                                  <div className="text-red-700 text-sm">
                                    This sealed bid auction has expired. You can
                                    no longer submit bids.
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Bid (ETH) - Minimum: {auction.startPrice}{" "}
                                      ETH
                                    </label>
                                    <input
                                      type="number"
                                      step="0.0001"
                                      placeholder={auction.startPrice}
                                      value={sealedBidAmount}
                                      onChange={(e) =>
                                        setSealedBidAmount(e.target.value)
                                      }
                                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary ${
                                        sealedBidAmount &&
                                        parseFloat(sealedBidAmount) <
                                          parseFloat(auction.startPrice)
                                          ? "border-red-300 bg-red-50"
                                          : "border-gray-300"
                                      }`}
                                    />
                                    {sealedBidAmount &&
                                      parseFloat(sealedBidAmount) <
                                        parseFloat(auction.startPrice) && (
                                        <p className="text-red-600 text-sm mt-1">
                                          ❌ Bid must be at least{" "}
                                          {auction.startPrice} ETH
                                        </p>
                                      )}
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="text-sm text-blue-800">
                                      🔒 <strong>Sealed Bid:</strong> Your bid
                                      amount will be hidden until the reveal
                                      phase. A secure nonce will be generated
                                      automatically.
                                    </div>
                                  </div>
                                  <Button
                                    onClick={handleSealedBid}
                                    disabled={
                                      !isConnected ||
                                      isSubmittingBid ||
                                      !sealedBidAmount ||
                                      parseFloat(sealedBidAmount) <
                                        parseFloat(auction.startPrice)
                                    }
                                    className="w-full"
                                    size="lg"
                                  >
                                    {isSubmittingBid
                                      ? "Submitting..."
                                      : "Submit Sealed Bid"}
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}

                    {Number(localAuction.auctionType) ===
                      AuctionType.SEALED_BID &&
                      (localAuction.status as AuctionStatus) ===
                        AuctionStatus.REVEAL && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="text-yellow-800 font-medium mb-2">
                            🔓 Reveal phase active
                          </div>
                          <div className="text-yellow-700 text-sm mb-4">
                            If you have sent a sealed bid, you must reveal it
                            now with your original amount and nonce.
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                          >
                            Reveal my bid
                          </Button>
                        </div>
                      )}

                    {(Number(localAuction.auctionType) ===
                      AuctionType.RESERVE ||
                      Number(localAuction.auctionType) ===
                        AuctionType.ENGLISH) && (
                      <div className="space-y-4">
                        {/* Quick bid buttons */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Quick bid
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {getQuickBidAmounts().map((bid, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (bid.amount === "custom") {
                                    // Focus custom input
                                    const customInput = document.querySelector(
                                      'input[placeholder="Enter custom amount"]'
                                    ) as HTMLInputElement;
                                    customInput?.focus();
                                    return;
                                  }
                                  // Set the amount in the custom bid field
                                  console.log("🚀 Quick bid clicked:", {
                                    label: bid.label,
                                    amount: bid.amount,
                                    currentBidAmount: bidAmount,
                                  });
                                  setBidAmount(bid.amount);
                                  console.log(
                                    "✅ BidAmount set to:",
                                    bid.amount
                                  );
                                }}
                                className={
                                  bidAmount === bid.amount
                                    ? "border-moove-primary bg-moove-50"
                                    : ""
                                }
                              >
                                {bid.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Custom bid amount */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom bid (ETH)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="Enter custom amount"
                            value={bidAmount}
                            onChange={(e) => {
                              setBidAmount(e.target.value);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-moove-primary focus:border-moove-primary"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Minimum:{" "}
                            {(() => {
                              const currentBid = parseFloat(
                                localAuction.currentBid || "0"
                              );
                              const startPrice = parseFloat(
                                localAuction.startPrice || "0"
                              );
                              const bidIncrement = parseFloat(
                                localAuction.bidIncrement || "0"
                              );

                              if (currentBid === 0 || isNaN(currentBid)) {
                                return startPrice.toFixed(6);
                              } else {
                                return (currentBid + bidIncrement).toFixed(6);
                              }
                            })()}{" "}
                            ETH
                          </p>
                          {/* Buy Now warning - only for Dutch auctions */}
                          {Number(localAuction.auctionType) ===
                            AuctionType.DUTCH &&
                            (() => {
                              const currentBidAmount = parseFloat(
                                bidAmount || "0"
                              );
                              const buyNowPrice = parseFloat(
                                localAuction.buyNowPrice || "0"
                              );

                              if (
                                buyNowPrice > 0 &&
                                currentBidAmount >= buyNowPrice
                              ) {
                                return (
                                  <p className="text-xs text-red-600 mt-1 font-medium">
                                    ⚠️ Your bid ({currentBidAmount.toFixed(6)}{" "}
                                    ETH) is ≥ Buy Now price (
                                    {buyNowPrice.toFixed(6)} ETH). Use Buy Now
                                    instead!
                                  </p>
                                );
                              }
                              return null;
                            })()}
                        </div>

                        {/* Bid button */}
                        <Button
                          onClick={() => handleBid(bidAmount)}
                          disabled={
                            !isConnected ||
                            isSubmittingBid ||
                            !bidAmount ||
                            (!!localAuction.buyNowPrice &&
                              parseFloat(localAuction.buyNowPrice) > 0 &&
                              parseFloat(bidAmount || "0") >=
                                parseFloat(localAuction.buyNowPrice)) ||
                            (!!localAuction.highestBidder &&
                              localAuction.highestBidder.toLowerCase() ===
                                address?.toLowerCase())
                          }
                          className="w-full"
                          size="lg"
                        >
                          {isSubmittingBid ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Placing bid...
                            </>
                          ) : !!localAuction.highestBidder &&
                            localAuction.highestBidder.toLowerCase() ===
                              address?.toLowerCase() ? (
                            "You already are the highest bidder!"
                          ) : (
                            `Place Bid: ${bidAmount || "0.0000"} ETH`
                          )}
                        </Button>

                        {/* Buy now option - Only for Dutch auctions */}
                        {localAuction.buyNowPrice &&
                          parseFloat(localAuction.buyNowPrice) > 0 &&
                          Number(localAuction.auctionType) ===
                            AuctionType.DUTCH && (
                            <div className="pt-4 border-t border-gray-200">
                              <Button
                                onClick={() =>
                                  handleBid(localAuction.buyNowPrice!)
                                }
                                disabled={!isConnected || isSubmittingBid}
                                variant="secondary"
                                className="w-full"
                                size="lg"
                              >
                                Buy Now for {localAuction.buyNowPrice} ETH
                              </Button>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}

              {/* Owner message */}
              {isOwner && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-blue-800 font-medium mb-2">
                    🎉 This is your auction!
                  </div>
                  <div className="text-blue-700 text-sm">
                    You can't place a bid on your own auction.
                  </div>
                </div>
              )}

              {/* Not connected message */}
              {!isConnected &&
                Number(localAuction.status) === AuctionStatus.ACTIVE && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-yellow-800 font-medium mb-2">
                      ⚠️ Wallet not connected
                    </div>
                    <div className="text-yellow-700 text-sm">
                      Connect your wallet to place a bid.
                    </div>
                  </div>
                )}

              {/* Auction ended message */}
              {(() => {
                const now = new Date().getTime();
                const endTime =
                  typeof localAuction.endTime === "string"
                    ? new Date(localAuction.endTime).getTime()
                    : localAuction.endTime.getTime();
                const isStatusNotActive =
                  Number(localAuction.status) !== AuctionStatus.ACTIVE;
                const isTimeExpired = now > endTime;
                const shouldShowEnded =
                  isStatusNotActive ||
                  (Number(localAuction.status) === AuctionStatus.ACTIVE &&
                    isTimeExpired);

                // ✅ DEBUG: Log the values for auction #4
                if (localAuction.auctionId === "4") {
                  console.log(
                    "🔍 [AuctionModal #4] Debug auction ended logic:",
                    {
                      auctionId: localAuction.auctionId,
                      status: Number(localAuction.status),
                      statusNotActive: isStatusNotActive,
                      now: now,
                      endTime: endTime,
                      endTimeString: localAuction.endTime,
                      timeExpired: isTimeExpired,
                      shouldShowEnded: shouldShowEnded,
                      timeRemaining: endTime - now,
                      timeRemainingMinutes: Math.floor((endTime - now) / 60000),
                    }
                  );
                }

                return shouldShowEnded;
              })() && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-gray-800 font-medium mb-2">
                    {Number(localAuction.status) === AuctionStatus.ENDED
                      ? "🏁 Auction Ended"
                      : Number(localAuction.status) === AuctionStatus.CANCELLED
                      ? "❌ Auction Cancelled"
                      : Number(localAuction.status) === AuctionStatus.ACTIVE &&
                        new Date().getTime() >
                          (typeof localAuction.endTime === "string"
                            ? new Date(localAuction.endTime).getTime()
                            : localAuction.endTime.getTime())
                      ? "🏁 Auction Ended (Time Expired)"
                      : "⏸️ Auction Inactive"}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {Number(localAuction.status) === AuctionStatus.ENDED &&
                    localAuction.highestBidder
                      ? `Won by ${shortenAddress(
                          localAuction.highestBidder
                        )} for ${localAuction.currentBid} ETH`
                      : Number(localAuction.status) === AuctionStatus.ACTIVE &&
                        new Date().getTime() >
                          (typeof localAuction.endTime === "string"
                            ? new Date(localAuction.endTime).getTime()
                            : localAuction.endTime.getTime())
                      ? "Time has expired. Auction can be ended and settled."
                      : "This auction is no longer active."}
                  </div>
                </div>
              )}

              {/* Auction info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Auction Type</span>
                  <span className="font-medium text-gray-700">
                    {Number(localAuction.auctionType) === AuctionType.RESERVE
                      ? "🏛️ Reserve"
                      : Number(localAuction.auctionType) === AuctionType.ENGLISH
                      ? "⬆️ English"
                      : Number(localAuction.auctionType) === AuctionType.DUTCH
                      ? "⬇️ Dutch"
                      : "🔒 Sealed Bid"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Start Price</span>
                  <span className="font-medium text-gray-700">
                    {localAuction.startPrice} ETH
                  </span>
                </div>
                {/* Only show reserve price for Reserve auctions */}
                {Number(localAuction.auctionType) === AuctionType.RESERVE && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reserve Price</span>
                    <span className="font-medium text-gray-700">
                      {localAuction.reservePrice} ETH
                    </span>
                  </div>
                )}
                {localAuction.buyNowPrice &&
                  Number(localAuction.auctionType) === AuctionType.DUTCH && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Buy Now</span>
                      <span className="font-medium text-gray-700">
                        {localAuction.buyNowPrice} ETH
                      </span>
                    </div>
                  )}
                {/*                 <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bid Increment</span>
                  <span className="font-medium text-gray-700">
                    {localAuction.bidIncrement} ETH
                  </span>
                </div> */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time Left</span>
                  <span className="font-medium text-gray-700">{timeLeft}</span>
                </div>
              </div>

              {/* Refund Status - Only show for ended auctions */}
              <AuctionRefundStatus
                auctionId={parseInt(localAuction.auctionId)}
                auctionStatus={localAuction.status.toString()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dutch Auction Success Modal */}
      {successData && (
        <DutchAuctionSuccessModal
          isOpen={showSuccessModal}
          onClose={closeSuccessModal}
          auctionId={successData.auctionId}
          price={successData.price}
          transactionHash={successData.transactionHash}
        />
      )}
    </div>
  );
}
