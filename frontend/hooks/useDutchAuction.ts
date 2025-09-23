import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { useTransactionTracker } from "./useTransactionTracker";

interface DutchAuctionSuccessData {
  auctionId: number;
  price: number;
  transactionHash: string;
}

export const useDutchAuction = () => {
  const { isConnected, address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "buying" | "success">("idle");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] =
    useState<DutchAuctionSuccessData | null>(null);
  const { addTransaction, updateTransactionStatus } = useTransactionTracker();

  const closeSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setSuccessData(null);
  }, []);

  const handleDutchAuction = useCallback(
    async (
      auctionId: number,
      currentPrice: number,
      onSuccess?: () => void
    ): Promise<boolean> => {
      if (!isConnected || !address) {
        toast.error("Please connect your wallet");
        return false;
      }

      if (isProcessing) {
        toast.error("Transaction already in progress");
        return false;
      }

      // Validate price
      if (currentPrice <= 0 || !isFinite(currentPrice)) {
        toast.error("Invalid price for Dutch auction");
        return false;
      }

      setIsProcessing(true);
      setError(null);
      setStep("buying");

      try {
        // Setup contracts for direct transaction handling
        if (typeof window === "undefined" || !window.ethereum) {
          throw new Error("Ethereum provider not available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const auctionContract = new ethers.Contract(
          "0x6eC7eeB61A8C5b37F7e1812E16c353fe00B1A84D", // Updated MooveAuction address
          [
            "function buyNowDutch(uint256 auctionId) external payable",
            "event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 finalPrice, uint256 platformFee, uint256 royaltyFee)",
          ],
          signer
        );

        console.log("💰 Buying Dutch auction directly...");
        console.log("📊 Auction ID:", auctionId);
        console.log("💰 Current Price:", currentPrice, "ETH");

        // Direct buy now - simplified process
        const buyTx = await auctionContract.buyNowDutch(auctionId, {
          value: ethers.parseEther(currentPrice.toString()),
        });
        console.log("📡 Buy transaction sent:", buyTx.hash);

        // Track buy transaction
        addTransaction({
          hash: buyTx.hash,
          auctionId: auctionId.toString(),
          type: "dutch_buy",
          status: "pending",
        });

        // Wait for confirmation
        const buyReceipt = await buyTx.wait();
        console.log("✅ Buy confirmed in block:", buyReceipt.blockNumber);

        // Update transaction status
        updateTransactionStatus(
          buyTx.hash,
          "confirmed",
          buyReceipt.blockNumber
        );

        // Check for AuctionSettled event in the buy transaction
        console.log(
          "📋 Total logs in buy transaction:",
          buyReceipt.logs.length
        );

        const settledEvents = buyReceipt.logs
          .map((log: any) => {
            try {
              const parsed = auctionContract.interface.parseLog(log);
              console.log("📋 Parsed log:", parsed);
              return parsed;
            } catch (error) {
              console.log("⚠️ Failed to parse log with our interface:", error);
              return null;
            }
          })
          .filter((event: any) => event?.name === "AuctionSettled");

        if (settledEvents.length === 0) {
          console.warn(
            "⚠️ No AuctionSettled event found - but transaction was successful"
          );
          console.log("✅ Dutch auction purchase completed successfully");
        } else {
          console.log(
            "🎉 Auction settled successfully:",
            settledEvents[0].args
          );
        }

        setStep("success");
        setSuccessData({
          auctionId,
          price: currentPrice,
          transactionHash: buyTx.hash, // Use buy transaction hash as the final confirmation
        });
        setShowSuccessModal(true);
        toast.success(
          `Successfully purchased Dutch auction for ${currentPrice} ETH!`
        );

        if (onSuccess) {
          onSuccess();
        }

        // Auto-refresh after 8 seconds to give more time to see the success modal
        setTimeout(() => {
          window.location.reload();
        }, 8000);

        return true;
      } catch (error: any) {
        console.error("❌ Dutch auction failed:", error);

        let errorMessage = "Dutch auction failed";

        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.reason) {
          errorMessage = error.reason;
        } else if (error?.data) {
          errorMessage = error.data;
        }

        // Handle specific error cases
        if (errorMessage.includes("execution reverted")) {
          if (errorMessage.includes("Auction not active")) {
            errorMessage = "This auction is no longer active";
          } else if (errorMessage.includes("Insufficient payment")) {
            errorMessage = "Insufficient payment for current Dutch price";
          } else if (errorMessage.includes("Not a Dutch auction")) {
            errorMessage = "This is not a Dutch auction";
          } else if (errorMessage.includes("Seller cannot buy")) {
            errorMessage = "Seller cannot buy their own auction";
          } else {
            errorMessage =
              "Transaction failed - check auction status and price";
          }
        }

        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      } finally {
        setIsProcessing(false);
        if (step !== "success") {
          setTimeout(() => {
            setStep("idle");
          }, 3000);
        }
      }
    },
    [isConnected, address, isProcessing]
  );

  return {
    handleDutchAuction,
    isProcessing,
    error,
    step,
    showSuccessModal,
    successData,
    closeSuccessModal,
  };
};
