"use client";

import React, { useState, useContext } from "react";
import { AuctionNotificationsContext } from "@/providers/AuctionNotificationsProvider";
import {
  BellIcon,
  XMarkIcon,
  GiftIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

// ✅ CONFIGURATION: Centralized configuration for external URLs
const CONFIG = {
  // ✅ SMART: Use existing EXPLORER_URL from environment
  get ETHERSCAN_BASE_URL() {
    return (
      process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.etherscan.io"
    );
  },
  TOAST_DURATION: 3000, // 3 seconds
  GAS_LIMITS: {
    END_AUCTION: 200000,
    SETTLE_AUCTION: 300000,
  },
} as const;

interface ConsolidatedNotificationBadgeProps {
  className?: string;
}

export default function ConsolidatedNotificationBadge({
  className = "",
}: ConsolidatedNotificationBadgeProps) {
  const { address } = useAccount();
  const context = useContext(AuctionNotificationsContext);

  if (!context) {
    return null;
  }

  const {
    refundNotifications,
    markRefundAsRead,
    clearAllRefundNotifications,
    removeRefundNotification,
    claimNotifications,
    markClaimAsRead,
    clearAllClaimNotifications,
    removeClaimNotification,
    removePermanentClaimNotification,
  } = context;

  const [isOpen, setIsOpen] = useState(false);

  // ✅ FILTER: Remove duplicates from refund notifications
  const uniqueRefundNotifications = refundNotifications.filter(
    (refund, index, self) => index === self.findIndex((r) => r.id === refund.id)
  );

  // Convert refund notifications to the format expected by the UI
  const refundNotificationsFormatted = uniqueRefundNotifications.map(
    (refund) => ({
      id: refund.id,
      type: "refund",
      message: refund.message,
      timestamp: refund.timestamp,
      isRead: refund.isRead,
      auctionId: refund.auctionId,
      amount: refund.amount,
      transactionHash: refund.transactionHash,
      priority: "medium" as const,
    })
  );

  // ✅ FILTER: Remove duplicates from claim notifications
  const uniqueClaimNotifications = claimNotifications.filter(
    (claim, index, self) => index === self.findIndex((c) => c.id === claim.id)
  );

  // Convert claim notifications to the format expected by the UI
  const claimNotificationsFormatted = uniqueClaimNotifications.map((claim) => ({
    id: claim.id,
    type: claim.notificationType || "claim", // Use notificationType to distinguish
    message: claim.message,
    timestamp: claim.timestamp,
    isRead: claim.isRead,
    auctionId: claim.auctionId,
    transactionHash: claim.transactionHash,
    priority: claim.priority,
    notificationType: claim.notificationType, // Pass through the notification type
  }));

  // Combine all notifications and filter for current user
  const allNotifications = [
    ...refundNotificationsFormatted,
    ...claimNotificationsFormatted,
  ];

  // ✅ FILTER: Remove duplicates from combined notifications
  const uniqueNotifications = allNotifications.filter(
    (notification, index, self) =>
      index === self.findIndex((n) => n.id === notification.id)
  );

  // Additional safety check - ensure notifications are for current user
  const notifications = uniqueNotifications.filter((notification) => {
    // This should already be filtered in the provider, but adding extra safety
    return true; // For now, trust the provider filtering
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const highPriorityCount = notifications.filter(
    (n) => n.priority === "high"
  ).length;

  const handleNotificationClick = async (notification: any) => {
    if (notification.type === "refund") {
      markRefundAsRead(notification.id);
      // Open Etherscan for refund transaction
      window.open(
        `${CONFIG.ETHERSCAN_BASE_URL}/tx/${notification.transactionHash}#internal`,
        "_blank"
      );
    } else if (notification.type === "endAuction") {
      markClaimAsRead(notification.id);

      // Handle endAuction
      // ✅ SECURITY: Rate limiting check (moved outside try block for error handling)
      const userAttemptsKey = `endAuction_attempts_${address}_${notification.auctionId}`;
      const attempts = parseInt(localStorage.getItem(userAttemptsKey) || "0");
      const MAX_ATTEMPTS = 3;

      if (attempts >= MAX_ATTEMPTS) {
        toast.error(
          `Too many attempts for auction ${notification.auctionId}. Please wait before trying again.`
        );
        return;
      }

      try {
        console.log(
          `🏁 [EndAuction] Starting endAuction process for auction ${notification.auctionId}`
        );

        // First, verify the auction is actually expired and claimable
        const { contracts } = await import("@/utils/contracts");
        const { ethers } = await import("ethers");

        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          signer
        );

        // ✅ SECURITY: Minimal logging to reduce information disclosure
        console.log(`🏁 Processing auction ${notification.auctionId}...`);

        // ✅ SECURITY: Atomic check - verify auction state immediately before action
        const currentAuctionData = await auctionContract.getAuction(
          notification.auctionId
        );
        const currentStatus = Number(currentAuctionData.status);
        const currentEndTime = Number(currentAuctionData.endTime);
        const currentTime = Math.floor(Date.now() / 1000);

        // ✅ SECURITY: Double-check auction state to prevent race conditions
        if (currentStatus !== 1) {
          toast.error(
            `Auction ${notification.auctionId} status changed (now: ${currentStatus}). Cannot end auction.`
          );
          return;
        }

        if (currentTime <= currentEndTime) {
          toast.error(
            `Auction ${notification.auctionId} has not expired yet. Cannot end auction.`
          );
          return;
        }

        // ✅ SECURITY: Call endAuction with gas limit to prevent griefing
        const tx = await auctionContract.endAuction(notification.auctionId, {
          gasLimit: CONFIG.GAS_LIMITS.END_AUCTION,
        });
        console.log(`🏁 [EndAuction] Transaction sent: ${tx.hash}`);

        toast.success(`Ending auction ${notification.auctionId}...`, {
          duration: CONFIG.TOAST_DURATION,
        });

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log(`🏁 [EndAuction] Transaction confirmed:`, receipt);

        // ✅ SECURITY: Only increment counter AFTER successful confirmation
        localStorage.setItem(userAttemptsKey, (attempts + 1).toString());

        toast.success(
          `Auction ${notification.auctionId} ended successfully! You can now settle it.`,
          {
            duration: 5000,
          }
        );

        // ✅ SECURITY: Reset attempt counter on success
        localStorage.removeItem(userAttemptsKey);

        // ✅ Remove the permanent notification since endAuction was successful
        removePermanentClaimNotification(notification.id);

        // ✅ IMMEDIATE CHECK: Force immediate status check to detect ENDED status
        console.log(
          `🔄 [EndAuction] Triggering immediate status check for auction ${notification.auctionId}`
        );

        // Trigger immediate claim check by dispatching a custom event
        window.dispatchEvent(
          new CustomEvent("forceClaimCheck", {
            detail: { auctionId: notification.auctionId },
          })
        );
      } catch (error) {
        console.error(
          `❌ [EndAuction] Error handling endAuction for auction ${notification.auctionId}:`,
          error
        );

        // ✅ SECURITY: Don't penalize users for network errors
        const errorMessage = (error as Error).message;
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("connection")
        ) {
          toast.error(
            `Network error ending auction ${notification.auctionId}. Please check your connection and try again.`
          );
          return; // Don't increment counter for network errors
        }

        // ✅ SECURITY: Only increment counter for real errors (revert, invalid state, etc.)
        localStorage.setItem(userAttemptsKey, (attempts + 1).toString());
        toast.error(
          `Failed to end auction ${notification.auctionId}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else if (
      notification.type === "settleAuction" &&
      notification.auctionType === "SEALED_BID"
    ) {
      // Per Sealed Bid, rimuovi direttamente la notifica senza chiamare settleAuction
      // perché endAuction() ha già fatto tutto automaticamente
      removePermanentClaimNotification(notification.id);
      markClaimAsRead(notification.id);
      return;
    } else if (notification.type === "settleAuction") {
      markClaimAsRead(notification.id);

      // Handle settleAuction
      // ✅ SECURITY: Rate limiting check (moved outside try block for error handling)
      const userAttemptsKey = `settleAuction_attempts_${address}_${notification.auctionId}`;
      const attempts = parseInt(localStorage.getItem(userAttemptsKey) || "0");
      const MAX_ATTEMPTS = 3;

      if (attempts >= MAX_ATTEMPTS) {
        toast.error(
          `Too many attempts for auction ${notification.auctionId}. Please wait before trying again.`
        );
        return;
      }

      try {
        console.log(
          `🏆 [SettleAuction] Starting settleAuction process for auction ${notification.auctionId}`
        );

        // First, verify the auction is actually ended and claimable
        const { contracts } = await import("@/utils/contracts");
        const { ethers } = await import("ethers");

        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          signer
        );

        // ✅ SECURITY: Atomic check - verify auction state immediately before action
        const currentAuctionData = await auctionContract.getAuction(
          notification.auctionId
        );
        const currentStatus = Number(currentAuctionData.status);
        const auctionType = Number(currentAuctionData.auctionType);

        // ✅ SECURITY: Double-check auction state to prevent race conditions
        if (currentStatus !== 3) {
          toast.error(
            `Auction ${notification.auctionId} status changed (now: ${currentStatus}). Cannot settle auction.`
          );
          return;
        }

        // ✅ SECURITY: Minimal logging to reduce information disclosure
        console.log(
          `🏆 Processing settlement for auction ${notification.auctionId}...`
        );

        // ✅ SECURITY: Get Reserve Auction data for later use
        let highestBid = 0;
        let reservePrice = 0;

        if (auctionType === 3) {
          highestBid = Number(
            ethers.formatEther(currentAuctionData.highestBid)
          );
          reservePrice = Number(
            ethers.formatEther(currentAuctionData.reservePrice)
          );

          if (highestBid < reservePrice) {
            toast.success(
              `Reserve Auction ${notification.auctionId} has bid below reserve. This will automatically cancel the auction and refund all bidders.`,
              { duration: 5000 }
            );
          }
        }

        // ✅ SECURITY: Call settleAuction with gas limit to prevent griefing
        const tx = await auctionContract.settleAuction(notification.auctionId, {
          gasLimit: CONFIG.GAS_LIMITS.SETTLE_AUCTION,
        });
        console.log(`🏆 [SettleAuction] Transaction sent: ${tx.hash}`);

        toast.success(`Settling auction ${notification.auctionId}...`, {
          duration: CONFIG.TOAST_DURATION,
        });

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log(`🏆 [SettleAuction] Transaction confirmed:`, receipt);

        // ✅ SECURITY: Only increment counter AFTER successful confirmation
        localStorage.setItem(userAttemptsKey, (attempts + 1).toString());

        // Check if it was a Reserve Auction below reserve (cancelled automatically)
        if (auctionType === 3 && highestBid < reservePrice) {
          toast.success(
            `Reserve Auction ${notification.auctionId} cancelled automatically. You will receive a refund.`,
            {
              duration: 5000,
            }
          );
        } else {
          toast.success(
            `Auction ${notification.auctionId} settled successfully! NFT transferred to your wallet.`,
            {
              duration: 5000,
            }
          );
        }

        // ✅ SECURITY: Reset attempt counter on success
        localStorage.removeItem(userAttemptsKey);

        // ✅ Remove the permanent notification since settleAuction was successful
        removePermanentClaimNotification(notification.id);
      } catch (error: any) {
        console.error(
          `❌ [SettleAuction] Error settling auction ${notification.auctionId}:`,
          error
        );

        // ✅ SECURITY: Don't penalize users for network errors
        const errorMessage = error.message || "";
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("connection")
        ) {
          toast.error(
            `Network error settling auction ${notification.auctionId}. Please check your connection and try again.`
          );
          return; // Don't increment counter for network errors
        }

        // ✅ SECURITY: Only increment counter for real errors (revert, invalid state, etc.)
        localStorage.setItem(userAttemptsKey, (attempts + 1).toString());
        toast.error(
          `Failed to settle auction ${notification.auctionId}: ${error.message}`
        );
      }
    }
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification?.type === "refund") {
      removeRefundNotification(notificationId);
    } else if (
      notification?.type === "endAuction" ||
      notification?.type === "settleAuction"
    ) {
      removeClaimNotification(notificationId);
    }
  };

  const handleClearAll = () => {
    clearAllRefundNotifications();
    clearAllClaimNotifications();
    setIsOpen(false);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-20 right-4 z-[99999] ${className}`}>
      {/* Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full bg-white shadow-lg border border-gray-200"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-6 w-6 text-blue-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}

        {/* Notification count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* High priority indicator */}
        {highPriorityCount > 0 && (
          <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-orange-500 rounded-full"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({unreadCount} unread)
                  </span>
                )}
              </h3>
              <div className="flex space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {notification.type === "endAuction" ? (
                            <CheckIcon className="h-4 w-4 text-blue-600" />
                          ) : notification.type === "settleAuction" ? (
                            <GiftIcon className="h-4 w-4 text-green-600" />
                          ) : notification.type === "refund" ? (
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          ) : (
                            <div
                              className={`w-2 h-2 rounded-full ${
                                notification.priority === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                              }`}
                            ></div>
                          )}
                          <p className="text-sm font-medium text-gray-900">
                            {notification.message}
                          </p>
                        </div>

                        {notification.type === "refund" &&
                          (notification as any).amount && (
                            <p className="text-sm text-green-600 font-semibold mt-1">
                              {(notification as any).amount} ETH
                            </p>
                          )}

                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>

                        {"transactionHash" in notification &&
                          notification.transactionHash &&
                          notification.transactionHash !== "expired-auction" &&
                          notification.type !== "sealedBidWin" &&
                          notification.type !== "sealedBidLoss" && (
                            <a
                              href={`${CONFIG.ETHERSCAN_BASE_URL}/tx/${notification.transactionHash}#internal`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1 block"
                            >
                              View Transaction
                            </a>
                          )}

                        {notification.type === "endAuction" && (
                          <div className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-semibold">
                            Click to End Auction
                          </div>
                        )}

                        {notification.type === "settleAuction" && (
                          <div className="text-xs text-green-600 hover:text-green-800 mt-1 font-semibold">
                            Click to Claim NFT
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-2">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => handleDismiss(e, notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
