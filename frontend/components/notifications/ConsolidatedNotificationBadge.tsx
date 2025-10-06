"use client";

import React, { useState } from "react";
import { useConsolidatedNotifications } from "@/hooks/useConsolidatedNotifications";
import { BellIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";

interface ConsolidatedNotificationBadgeProps {
  className?: string;
}

export default function ConsolidatedNotificationBadge({
  className = "",
}: ConsolidatedNotificationBadgeProps) {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    unreadCount,
    highPriorityCount,
  } = useConsolidatedNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    // Navigate to relevant page if needed
    if (notification.type === "claim_ready") {
      window.location.href = "/my-collection";
    }
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    dismissNotification(notificationId);
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <BellIcon className="h-6 w-6 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <BellIcon className="h-6 w-6 text-red-500" />
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
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
                          <div
                            className={`w-2 h-2 rounded-full ${
                              notification.priority === "high"
                                ? "bg-red-500"
                                : notification.priority === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          ></div>
                          <p className="text-sm font-medium text-gray-900">
                            {notification.message}
                          </p>
                        </div>

                        {notification.amount && (
                          <p className="text-sm text-green-600 font-semibold mt-1">
                            {notification.amount} ETH
                          </p>
                        )}

                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>

                        {notification.transactionHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${notification.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 block"
                          >
                            View Transaction
                          </a>
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
