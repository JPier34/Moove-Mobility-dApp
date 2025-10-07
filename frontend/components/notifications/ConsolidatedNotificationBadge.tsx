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

interface ConsolidatedNotificationBadgeProps {
  className?: string;
}

export default function ConsolidatedNotificationBadge({
  className = "",
}: ConsolidatedNotificationBadgeProps) {
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
    type: "claim",
    message: claim.message,
    timestamp: claim.timestamp,
    isRead: claim.isRead,
    auctionId: claim.auctionId,
    transactionHash: claim.transactionHash,
    priority: claim.priority,
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

      // Check if this is a Reserve Auction violation notification
      if (notification.transactionHash === "reserve-violation") {
        console.log(
          `🔧 [Reserve Violation] Handling violation for auction ${notification.auctionId}`
        );

        try {
          const { contracts } = await import("@/utils/contracts");
          const { ethers } = await import("ethers");

          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const signer = await provider.getSigner();
          const auctionContract = new ethers.Contract(
            contracts.MooveAuction.address,
            contracts.MooveAuction.abi,
            signer
          );

          // Get auction data to check if user is admin or seller
          const auctionData = await auctionContract.getAuction(
            notification.auctionId
          );
          const userAddress = await signer.getAddress();
          const isAdmin =
            userAddress.toLowerCase() ===
            process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
          const isSeller =
            auctionData.seller.toLowerCase() === userAddress.toLowerCase();

          if (isAdmin || isSeller) {
            console.log(
              `🔧 [Reserve Violation] User is ${
                isAdmin ? "admin" : "seller"
              }, cancelling auction`
            );

            // Check auction status - can only cancel PENDING or ACTIVE auctions
            const auctionStatus = Number(auctionData.status);
            const canCancel = auctionStatus === 0 || auctionStatus === 1; // PENDING or ACTIVE

            let cancelTx;
            if (canCancel) {
              // Cancel the auction (this refunds all bidders and returns NFT to seller)
              cancelTx = await (auctionContract as any).cancelAuction(
                notification.auctionId,
                "Reserve price not met"
              );
            } else if (isAdmin) {
              // For ENDED auctions, admin can use emergencyCancel
              console.log(
                `🔧 [Reserve Violation] Auction is ENDED, using emergencyCancel`
              );
              cancelTx = await (auctionContract as any).emergencyCancel(
                notification.auctionId,
                "Reserve price not met"
              );
            } else {
              console.log(
                `⚠️ [Reserve Violation] Cannot cancel ENDED auction as seller`
              );
              const { toast } = await import("react-hot-toast");
              toast.error(
                "Cannot cancel ENDED auction. Only admin can handle this."
              );
              return;
            }
            console.log(
              `📝 [Reserve Violation] Cancel transaction sent: ${cancelTx.hash}`
            );

            const receipt = await cancelTx.wait();
            console.log(
              `✅ [Reserve Violation] Auction ${notification.auctionId} cancelled successfully`
            );

            const { toast } = await import("react-hot-toast");
            toast.success(
              `✅ Reserve Auction #${notification.auctionId} cancelled. All bidders refunded, NFT returned to seller.`
            );

            // Remove the notification after successful cancellation
            removeRefundNotification(notification.id);
          } else {
            console.log(
              `⚠️ [Reserve Violation] User is not admin or seller, cannot cancel auction`
            );
            const { toast } = await import("react-hot-toast");
            toast.error(
              "Only admin or seller can cancel Reserve Auction violations"
            );
          }
        } catch (error) {
          console.error(
            `❌ [Reserve Violation] Error handling violation:`,
            error
          );
          const { toast } = await import("react-hot-toast");
          toast.error(
            `Failed to cancel Reserve Auction: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      } else {
        // Normal refund notification - navigate to auctions page
        window.location.href = "/auctions";
      }
    } else if (notification.type === "claim") {
      markClaimAsRead(notification.id);

      // Handle claim directly
      try {
        console.log(
          `🏆 [Claim] Starting claim process for auction ${notification.auctionId}`
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

        // Check auction status and end time
        const auctionData = await auctionContract.getAuction(notification.auctionId);
        const currentTime = Math.floor(Date.now() / 1000);
        const endTime = Number(auctionData.endTime);
        const status = Number(auctionData.status);
        const auctionType = Number(auctionData.auctionType);
        const highestBid = Number(ethers.formatEther(auctionData.highestBid));
        const reservePrice = Number(ethers.formatEther(auctionData.reservePrice));
        const highestBidder = auctionData.highestBidder;

        console.log(`🔍 [Claim] Auction ${notification.auctionId} status check:`, {
          status,
          endTime,
          currentTime,
          isExpired: currentTime > endTime,
          isActive: status === 1,
          isEnded: status === 3,
          auctionType,
          highestBid,
          reservePrice,
          highestBidder,
          isReserveAuction: auctionType === 3,
          isBelowReserve: auctionType === 3 && highestBid < reservePrice,
        });

        // Only allow claim if auction is expired OR already ended
        if (status !== 1 && status !== 3) {
          toast.error(`Auction ${notification.auctionId} is not in a claimable state (status: ${status})`);
          return;
        }

        if (status === 1 && currentTime <= endTime) {
          toast.error(`Auction ${notification.auctionId} is still active and not expired yet`);
          return;
        }

        // CRITICAL: Check Reserve Auction violation
        if (auctionType === 3 && highestBid < reservePrice) {
          toast.error(
            `🚨 Reserve Auction Violation! Your bid (${highestBid} ETH) is below the reserve price (${reservePrice} ETH). This auction should be cancelled.`
          );
          return;
        }

        console.log(`✅ [Claim] Auction ${notification.auctionId} is claimable, proceeding...`);

        // Call endAuction directly

        console.log(
          `🔄 [Claim] Step 1: Calling endAuction for auction ${notification.auctionId}`
        );
        const endTx = await (auctionContract as any).endAuction(
          notification.auctionId
        );
        console.log(`📝 [Claim] End auction transaction sent: ${endTx.hash}`);

        // Wait for endAuction transaction to be mined
        const endReceipt = await endTx.wait();
        console.log(
          `✅ [Claim] Step 1 completed: Auction ${notification.auctionId} ended successfully`
        );

        // Wait a moment for blockchain to update
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Step 2: Call settleAuction
        console.log(
          `🔄 [Claim] Step 2: Calling settleAuction for auction ${notification.auctionId}`
        );
        const settleTx = await (auctionContract as any).settleAuction(
          notification.auctionId
        );
        console.log(
          `📝 [Claim] Settle auction transaction sent: ${settleTx.hash}`
        );

        // Wait for settleAuction transaction to be mined
        const settleReceipt = await settleTx.wait();
        console.log(
          `✅ [Claim] Step 2 completed: Auction ${notification.auctionId} settled successfully`
        );

        // Show success message
        const { toast } = await import("react-hot-toast");
        toast.success(
          `🎉 Auction ${notification.auctionId} claimed successfully! NFT transferred to your wallet.`
        );
      } catch (error) {
        console.error(
          `❌ [Claim] Error handling claim for auction ${notification.auctionId}:`,
          error
        );

        // Show error message
        const { toast } = await import("react-hot-toast");
        toast.error(
          `Failed to end auction ${notification.auctionId}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification?.type === "refund") {
      removeRefundNotification(notificationId);
    } else if (notification?.type === "claim") {
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
                          {notification.type === "claim" ? (
                            <GiftIcon className="h-4 w-4 text-green-600" />
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

                        {notification.transactionHash &&
                          notification.transactionHash !==
                            "expired-auction" && (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${notification.transactionHash}#internal`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1 block"
                            >
                              View Transaction
                            </a>
                          )}

                        {notification.type === "claim" && (
                          <div className="text-xs text-green-600 hover:text-green-800 mt-1 font-semibold">
                            Click to Claim
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
