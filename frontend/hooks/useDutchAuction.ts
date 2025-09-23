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
  const [step, setStep] = useState<
    "idle" | "committing" | "buying" | "settling" | "success"
  >("idle");
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
      setStep("committing");

      try {
        // Setup contracts for direct transaction handling
        if (typeof window === "undefined" || !window.ethereum) {
          throw new Error("Ethereum provider not available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const auctionContract = new ethers.Contract(
          "0xF3A15bf233D28435E338DFF2aF2E33c72b701525", // MooveAuction address
          [
            "function commitToBuyDutch(uint256 auctionId, bytes32 commitment) external payable",
            "function buyNowDutch(uint256 auctionId, uint256 nonce) external payable",
            "function settleAuction(uint256 auctionId) external",
            "event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 finalPrice, uint256 platformFee, uint256 royaltyFee)",
          ],
          signer
        );

        // Generate a random nonce for the commitment
        // Use timestamp + random to ensure uniqueness even if retrying
        const nonce = BigInt(
          Date.now() + Math.floor(Math.random() * 1000000000)
        );

        // Create commitment hash
        const commitment = ethers.solidityPackedKeccak256(
          ["address", "uint256"],
          [address, nonce]
        );

        console.log("🔐 Step 1: Committing to buy Dutch auction...");
        console.log("📊 Auction ID:", auctionId);
        console.log("💰 Current Price:", currentPrice, "ETH");
        console.log("🎲 Nonce:", nonce.toString());
        console.log("🔑 Commitment:", commitment);

        // First commit to buy - wait for confirmation
        const commitTx = await auctionContract.commitToBuyDutch(
          auctionId,
          commitment
        );
        console.log("📡 Commit transaction sent:", commitTx.hash);

        // Track commit transaction
        addTransaction({
          hash: commitTx.hash,
          auctionId: auctionId.toString(),
          type: "dutch_commit",
          status: "pending",
        });

        // Wait for confirmation
        const commitReceipt = await commitTx.wait();
        console.log("✅ Commit confirmed in block:", commitReceipt.blockNumber);

        // Update transaction status
        updateTransactionStatus(
          commitTx.hash,
          "confirmed",
          commitReceipt.blockNumber
        );

        // Wait a bit for the commitment to be processed
        console.log("⏳ Waiting for commitment to be processed...");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds

        console.log("💰 Step 2: Buying at Dutch price...");
        setStep("buying");

        // Then buy with the commitment - wait for confirmation
        const buyTx = await auctionContract.buyNowDutch(auctionId, nonce, {
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

        // Step 3: Settle the auction to complete the process
        console.log("🏁 Step 3: Settling auction...");
        setStep("settling");

        const settleTx = await auctionContract.settleAuction(auctionId);
        console.log("📡 Settle transaction sent:", settleTx.hash);

        // Track settle transaction
        addTransaction({
          hash: settleTx.hash,
          auctionId: auctionId.toString(),
          type: "dutch_settle",
          status: "pending",
        });

        const settleReceipt = await settleTx.wait();
        console.log("✅ Settle confirmed in block:", settleReceipt.blockNumber);

        // Update transaction status
        updateTransactionStatus(
          settleTx.hash,
          "confirmed",
          settleReceipt.blockNumber
        );

        // Check for AuctionSettled event in the settle transaction
        console.log(
          "📋 Total logs in settle transaction:",
          settleReceipt.logs.length
        );

        const settledEvents = settleReceipt.logs
          .map((log: any) => {
            console.log("📋 Raw log:", {
              address: log.address,
              topics: log.topics,
              data: log.data,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
            });

            // Decode the first topic (event signature)
            if (log.topics && log.topics.length > 0) {
              const eventSignature = log.topics[0];
              console.log("🔍 Event signature:", eventSignature);

              // Common event signatures
              const commonSignatures = {
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef":
                  "Transfer(address,address,uint256)",
                "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925":
                  "Approval(address,address,uint256)",
                "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31":
                  "ApprovalForAll(address,address,bool)",
              };

              if (
                commonSignatures[
                  eventSignature as keyof typeof commonSignatures
                ]
              ) {
                console.log(
                  "🎯 Known event:",
                  commonSignatures[
                    eventSignature as keyof typeof commonSignatures
                  ]
                );
              }
            }

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
          transactionHash: settleTx.hash, // Use settle transaction hash as the final confirmation
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
          if (errorMessage.includes("Already committed")) {
            errorMessage =
              "You have already committed to this auction. Please try with a different auction or wait for the current commitment to expire.";
          } else if (errorMessage.includes("Auction not active")) {
            errorMessage = "This auction is no longer active";
          } else if (errorMessage.includes("Insufficient funds")) {
            errorMessage = "Insufficient funds for this purchase";
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
