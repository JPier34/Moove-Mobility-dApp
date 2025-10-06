import { useState, useCallback } from "react";
import { ethers, parseUnits } from "ethers";
import { useAccount } from "wagmi";
import { useTransactionTracker } from "./useTransactionTracker";
import { contracts } from "@/utils/contracts";
import { parseEther } from "viem";
import { useAuctionNotificationTriggers } from "./useUnifiedAuctionNotifications";
import toast from "react-hot-toast";

interface DutchAuctionSuccessData {
  auctionId: number;
  price: number;
  transactionHash: string;
}

export const useDutchAuction = () => {
  const { isConnected, address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "buying" | "claiming" | "success">(
    "idle"
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] =
    useState<DutchAuctionSuccessData | null>(null);
  const { addTransaction, updateTransactionStatus } = useTransactionTracker();
  const { notifyDutchPurchase, notifyAuctionFailed } =
    useAuctionNotificationTriggers();

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
        setError("Please connect your wallet");
        return false;
      }

      // Check if automatic system is active
      const isAutomaticSystemActive =
        typeof window !== "undefined" &&
        localStorage.getItem("auction-monitoring-active") === "true";

      if (isAutomaticSystemActive) {
        console.log(
          `⏭️ Automatic system is active, skipping manual buy for auction ${auctionId}`
        );
        toast.success(
          `Automatic system is processing auction ${auctionId}. Please wait...`
        );
        return false;
      }

      if (isProcessing) {
        setError("Transaction already in progress");
        return false;
      }

      // Validate price
      if (currentPrice <= 0 || !isFinite(currentPrice)) {
        setError("Invalid price for Dutch auction");
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
          contracts.MooveAuction.address, // Use modular contract address
          contracts.MooveAuction.abi, // Use modular ABI
          signer
        );

        console.log("💰 Buying Dutch auction directly...");
        console.log("📊 Auction ID:", auctionId);
        console.log("💰 Current Price:", currentPrice, "ETH");

        // FORCE DEBUG - This should always appear
        console.log("🚨 FORCE DEBUG - Code is executing at line 74");

        // Debug auction status before buying
        console.log("🔍 Attempting to fetch auction data for ID:", auctionId);
        console.log("🔍 Contract instance:", auctionContract);
        console.log("🔍 Contract address:", contracts.MooveAuction.address);
        console.log("🔍 ABI length:", contracts.MooveAuction.abi.length);

        let auctionData;
        try {
          console.log("🔍 Calling getAuction...");
          const rawAuctionData = await auctionContract.getAuction(auctionId);
          console.log("🔍 getAuction call successful");

          // Map raw contract data to correct fields based on Auction struct order:
          // 0: auctionId, 1: nftContract, 2: tokenId, 3: seller, 4: auctionType, 5: status,
          // 6: allowPartialFulfillment, 7: isSettled, 8: revealPhaseStarted, 9: startingPrice,
          // 10: reservePrice, 11: buyNowPrice, 12: currentPrice, 13: bidIncrement, 14: highestBid,
          // 15: startTime, 16: endTime, 17: extensionThreshold, 18: extensionDuration, 19: revealEndTime,
          // 20: highestBidder, 21: minBidders, 22: totalBidders
          auctionData = {
            auctionId: rawAuctionData[0].toString(),
            nftContract: rawAuctionData[1],
            tokenId: rawAuctionData[2].toString(),
            seller: rawAuctionData[3],
            auctionType: Number(rawAuctionData[4]),
            status: Number(rawAuctionData[5]),
            allowPartialFulfillment: rawAuctionData[6],
            isSettled: rawAuctionData[7],
            revealPhaseStarted: rawAuctionData[8],
            startingPrice: ethers.formatEther(rawAuctionData[9]),
            reservePrice: ethers.formatEther(rawAuctionData[10]),
            buyNowPrice: ethers.formatEther(rawAuctionData[11]),
            currentPrice: ethers.formatEther(rawAuctionData[12]),
            bidIncrement: ethers.formatEther(rawAuctionData[13]),
            highestBid: ethers.formatEther(rawAuctionData[14]),
            startTime: Number(rawAuctionData[15]),
            endTime: Number(rawAuctionData[16]),
            extensionThreshold: ethers.formatEther(rawAuctionData[17]),
            extensionDuration: Number(rawAuctionData[18]),
            revealEndTime: Number(rawAuctionData[19]),
            highestBidder: rawAuctionData[20],
            minBidders: Number(rawAuctionData[21]),
            totalBidders: Number(rawAuctionData[22]),
          };

          console.log("🔍 Mapped auction data:", {
            auctionType: auctionData.auctionType,
            status: auctionData.status,
            seller: auctionData.seller,
            isSettled: auctionData.isSettled,
            startTime: auctionData.startTime,
            endTime: auctionData.endTime,
            currentTime: Math.floor(Date.now() / 1000),
            startingPrice: auctionData.startingPrice,
            reservePrice: auctionData.reservePrice,
            reservePriceETH: (Number(auctionData.reservePrice) / 1e18).toFixed(
              6
            ),
            buyNowPrice: auctionData.buyNowPrice,
          });

          // Check each condition that could cause revert
          console.log("🔍 Condition checks:");
          console.log(
            "  - Is Dutch auction?",
            Number(auctionData.auctionType) === 1
          );
          console.log("  - Is active?", Number(auctionData.status) === 1); // ACTIVE (corrected to match contract)
          console.log("  - Is not seller?", auctionData.seller !== address);
          console.log("  - Is not settled?", !auctionData.isSettled);
          console.log(
            "  - Current time vs end time:",
            Math.floor(Date.now() / 1000),
            "vs",
            Number(auctionData.endTime)
          );
        } catch (error) {
          console.error("❌ Could not fetch auction data:", error);
          console.log("🔍 Contract address:", contracts.MooveAuction.address);
          console.log("🔍 ABI length:", contracts.MooveAuction.abi.length);
        }

        // Validate auction is available for purchase
        if (!auctionData) {
          throw new Error("Could not fetch auction data");
        }

        const isDutchAuction = Number(auctionData.auctionType) === 1;
        const isActive = Number(auctionData.status) === 1; // ACTIVE (corrected to match contract)
        const isNotSeller = auctionData.seller !== address;
        const isNotSettled = !auctionData.isSettled;

        // For Dutch auctions, allow purchase even if status is PENDING (0)
        // if the auction should be active based on timestamps
        const currentTime = Math.floor(Date.now() / 1000);
        const startTime = Number(auctionData.startTime);
        const endTime = Number(auctionData.endTime);
        const shouldBeActive =
          currentTime >= startTime && currentTime < endTime;

        if (!isDutchAuction || !isNotSeller || !isNotSettled) {
          throw new Error("Auction is not available for purchase");
        }

        if (!isActive && !shouldBeActive) {
          throw new Error("Auction is not active yet or has ended");
        }

        // Always use the contract's Dutch price calculation for accuracy
        let priceInWei: bigint;
        try {
          const contractPrice = await auctionContract.getDutchPrice(auctionId);
          console.log("🔍 Contract Dutch price:", contractPrice.toString());
          console.log(
            "🔍 Contract Dutch price in ETH:",
            (Number(contractPrice) / 1e18).toFixed(6)
          );

          // Convert to BigInt for Ethers.js v6
          priceInWei = BigInt(contractPrice.toString());
          console.log("🔍 Contract price as BigInt:", priceInWei.toString());
          console.log("🔍 BigInt type check:", typeof priceInWei);
        } catch (error) {
          console.error("❌ Could not fetch Dutch price from contract:", error);
          // Fallback to frontend calculation if contract fails
          const priceValue = currentPrice;
          const priceString = priceValue.toString();
          priceInWei = BigInt(parseEther(priceString).toString());
          console.log(
            "🔧 Using frontend fallback price:",
            priceInWei.toString()
          );
        }

        // Direct buy now - simplified process
        console.log("🔍 About to call buyNowDutch with:");
        console.log("  - auctionId:", auctionId);
        console.log("  - value:", priceInWei.toString());
        console.log("  - value type:", typeof priceInWei);
        console.log("  - value is BigInt:", typeof priceInWei === "bigint");
        console.log("  - gasLimit:", 300000);

        const buyTx = await auctionContract.buyNowDutch(auctionId, {
          value: priceInWei,
          gasLimit: 300000,
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

        // IMMEDIATELY claim the NFT after successful purchase
        // This is necessary for Dutch auctions since the purchase is always winning
        console.log("🔄 Claiming NFT automatically...");
        setStep("claiming");

        try {
          // Check auction status before claiming
          const auctionData = await auctionContract.getAuction(auctionId);
          const currentStatus = Number(auctionData.status);

          console.log(`🔍 Dutch auction ${auctionId} status before claim:`, {
            status: currentStatus,
            isSettled: auctionData.isSettled,
          });

          // For Dutch auctions, the auction should be ENDED after purchase
          // But let's add a safety check
          if (currentStatus === 1) {
            console.log(
              `⚠️ Dutch auction ${auctionId} is still ACTIVE after purchase. This shouldn't happen.`
            );
            console.log(`🔄 Attempting to end auction first...`);

            const endTx = await auctionContract.endAuction(auctionId);
            console.log(`📝 End auction transaction sent: ${endTx.hash}`);
            await endTx.wait();
            console.log(`✅ Dutch auction ${auctionId} ended successfully`);

            // Wait for blockchain to update
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          const claimTx = await auctionContract.settleAuction(auctionId);
          console.log("📡 Claim transaction sent:", claimTx.hash);

          // Track claim transaction
          addTransaction({
            hash: claimTx.hash,
            auctionId: auctionId.toString(),
            type: "claim",
            status: "pending",
          });

          // Wait for claim confirmation
          const claimReceipt = await claimTx.wait();
          console.log("✅ Claim confirmed in block:", claimReceipt.blockNumber);

          // Update transaction status
          updateTransactionStatus(
            claimTx.hash,
            "confirmed",
            claimReceipt.blockNumber
          );

          console.log("🎉 NFT successfully claimed and transferred!");
        } catch (claimError) {
          console.error("❌ Claim failed:", claimError);
          // Continue with success flow even if claim fails
          // The user can manually claim later
        }

        setStep("success");
        setSuccessData({
          auctionId,
          price: currentPrice,
          transactionHash: buyTx.hash, // Use buy transaction hash as the final confirmation
        });
        setShowSuccessModal(true);

        // Usa il sistema di notifiche unificato invece del toast duplicato
        notifyDutchPurchase(auctionId.toString(), currentPrice);

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
        notifyAuctionFailed(auctionId.toString(), errorMessage);
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
