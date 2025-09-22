import React, { useState, useEffect } from "react";
import {
  useAuctionRefunds,
  BidRefundInfo,
  RefundStatus,
} from "@/hooks/useAuctionRefunds";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuctionRefundStatusProps {
  auctionId: number;
  auctionStatus: string;
  className?: string;
}

export function AuctionRefundStatus({
  auctionId,
  auctionStatus,
  className = "",
}: AuctionRefundStatusProps) {
  const { getRefundStatus, requestRefund, listenForRefunds, isLoading, error } =
    useAuctionRefunds();
  const [refundStatus, setRefundStatus] = useState<RefundStatus | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  // Load refund status on mount and when auction status changes
  useEffect(() => {
    if (auctionStatus === "ENDED" || auctionStatus === "SETTLED") {
      loadRefundStatus();
    }
  }, [auctionId, auctionStatus]);

  // Listen for refund events
  useEffect(() => {
    if (auctionStatus === "ENDED" || auctionStatus === "SETTLED") {
      const cleanup = listenForRefunds(auctionId, (refundInfo) => {
        // Update local state when refund is received
        loadRefundStatus();
      });

      return cleanup;
    }
  }, [auctionId, auctionStatus, listenForRefunds]);

  const loadRefundStatus = async () => {
    try {
      const status = await getRefundStatus(auctionId);
      setRefundStatus(status);
    } catch (error) {
      console.error("Failed to load refund status:", error);
    }
  };

  const handleRequestRefund = async () => {
    setIsRefunding(true);
    try {
      const success = await requestRefund(auctionId);
      if (success) {
        // Reload status after successful refund
        await loadRefundStatus();
      }
    } catch (error) {
      console.error("Refund request failed:", error);
    } finally {
      setIsRefunding(false);
    }
  };

  // Don't show if auction is not ended or no refund status
  if (
    !refundStatus ||
    (auctionStatus !== "ENDED" && auctionStatus !== "SETTLED")
  ) {
    return null;
  }

  const { canRefund, refundedAmount, pendingRefunds, totalPendingAmount } =
    refundStatus;

  return (
    <Card
      className={`border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 ${className}`}
    >
      <div className="p-6">
        <div className="pb-3">
          <h3 className="flex items-center gap-2 text-orange-800 dark:text-orange-200 text-lg font-semibold">
            <RefreshCw className="h-5 w-5" />
            Refund Status
          </h3>
        </div>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Refunded Amount */}
          {parseFloat(refundedAmount) > 0 && (
            <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Refunded
                </span>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
              >
                {refundedAmount} ETH
              </Badge>
            </div>
          )}

          {/* Pending Refunds */}
          {pendingRefunds.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Pending Refunds
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-orange-300 text-orange-800 dark:border-orange-700 dark:text-orange-200"
                >
                  {pendingRefunds.length} bid
                  {pendingRefunds.length > 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Pending refunds list */}
              <div className="space-y-2">
                {pendingRefunds.map((refund, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                      <span className="text-xs text-orange-700 dark:text-orange-300">
                        {formatDistanceToNow(
                          new Date(refund.timestamp * 1000),
                          {
                            addSuffix: true,
                          }
                        )}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs border-orange-300 text-orange-800 dark:border-orange-700 dark:text-orange-200"
                    >
                      {refund.amount} ETH
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Total pending amount */}
              <div className="flex items-center justify-between p-2 bg-orange-200 dark:bg-orange-800 rounded">
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Total Pending
                </span>
                <Badge
                  variant="secondary"
                  className="bg-orange-300 text-orange-900 dark:bg-orange-700 dark:text-orange-100"
                >
                  {totalPendingAmount} ETH
                </Badge>
              </div>

              {/* Request Refund Button */}
              {canRefund && (
                <Button
                  onClick={handleRequestRefund}
                  disabled={isRefunding || isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  {isRefunding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Refund...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Request Refund ({totalPendingAmount} ETH)
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* No pending refunds */}
          {pendingRefunds.length === 0 && parseFloat(refundedAmount) === 0 && (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No refunds available
              </p>
            </div>
          )}

          {/* Refresh Button */}
          <Button
            onClick={loadRefundStatus}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
