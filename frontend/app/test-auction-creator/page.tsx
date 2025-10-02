"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "../../utils/contracts";

export default function TestAuctionCreator() {
  const { address, isConnected } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<string>("");

  const createTestAuction = async () => {
    if (!isConnected || !address) {
      setResult("❌ Wallet not connected");
      return;
    }

    setIsCreating(true);
    setResult("");

    try {
      console.log("🚀 Creating test auction...");
      setResult("🚀 Creating test auction...");

      // Connect to contracts
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();

      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        signer
      );

      const auctionContract = new ethers.Contract(
        contracts.MooveAuction.address,
        contracts.MooveAuction.abi,
        signer
      );

      // Step 1: Create a test NFT
      console.log("📝 Step 1: Creating test NFT...");
      setResult("📝 Step 1: Creating test NFT...");

      // Create real metadata for the NFT
      const metadata = {
        name: `Moove Test NFT #${Date.now()}`,
        description: "Test NFT created for auction testing - Moove Mobility",
        image: "https://ipfs.io/ipfs/QmYourRealImageHash", // Replace with real IPFS hash
        attributes: [
          { trait_type: "Rarity", value: "test" },
          { trait_type: "Type", value: "Auction Test" },
          { trait_type: "Collection", value: "Moove Mobility" },
          { trait_type: "Created", value: new Date().toISOString() },
        ],
      };

      // For now, use a simple string metadata (you should upload to IPFS in production)
      const metadataString = JSON.stringify(metadata);

      const mintTx = await nftContract.mintNFT(
        address,
        metadataString // Use real metadata instead of mock hash
      );

      console.log("📡 NFT mint transaction:", mintTx.hash);
      const mintReceipt = await mintTx.wait();
      console.log("✅ NFT minted in block:", mintReceipt.blockNumber);

      // Extract tokenId from the transaction receipt
      const transferEvent = mintReceipt.logs.find((log: ethers.Log) => {
        try {
          const parsed = nftContract.interface.parseLog(log);
          return parsed?.name === "Transfer";
        } catch {
          return false;
        }
      });

      if (!transferEvent) {
        throw new Error("No Transfer event found for NFT mint");
      }

      const parsed = nftContract.interface.parseLog(transferEvent);
      const tokenId = parsed?.args.tokenId;

      if (!tokenId) {
        throw new Error("Could not extract tokenId from Transfer event");
      }

      console.log("🆔 NFT created with tokenId:", tokenId.toString());

      // Step 2: Approve NFT for auction contract
      console.log("📝 Step 2: Approving NFT for auction contract...");
      setResult("📝 Step 2: Approving NFT for auction contract...");

      const approveTx = await nftContract.approve(
        auctionContract.target,
        tokenId
      );
      console.log("📡 Approve transaction:", approveTx.hash);
      await approveTx.wait();
      console.log("✅ NFT approved for auction contract");

      // Step 3: Create auction
      console.log("📝 Step 3: Creating auction...");
      setResult("📝 Step 3: Creating auction...");

      const auctionTx = await auctionContract.createAuction(
        contracts.MooveNFT.address,
        tokenId,
        0, // English auction
        ethers.parseEther("0.001"), // startPrice
        ethers.parseEther("0.005"), // reservePrice
        ethers.parseEther("0.01"), // buyNowPrice
        300, // duration (5 minutes)
        ethers.parseEther("0.0001"), // bidIncrement
        60, // extensionThreshold
        120 // extensionDuration
      );

      console.log("📡 Auction creation transaction:", auctionTx.hash);
      const auctionReceipt = await auctionTx.wait();
      console.log("✅ Auction created in block:", auctionReceipt.blockNumber);

      // Extract auctionId from events
      const auctionEvents = auctionReceipt.logs
        .map((log: ethers.Log) => {
          try {
            return auctionContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter(
          (event: ethers.LogDescription | null) =>
            event?.name === "AuctionCreated"
        );

      if (auctionEvents.length === 0) {
        throw new Error("No AuctionCreated event found");
      }

      const auctionId = auctionEvents[0].args.auctionId;
      console.log("🆔 Auction created with ID:", auctionId.toString());

      // Step 4: Verify auction data with detailed type checking
      console.log("📝 Step 4: Verifying auction data with type analysis...");
      setResult("📝 Step 4: Verifying auction data with type analysis...");

      const auctionData = await auctionContract.getAuction(auctionId);

      // Detailed type analysis and logging
      console.log("🔍 DETAILED AUCTION DATA ANALYSIS:");
      console.log("📊 Raw contract data structure:", {
        totalFields: auctionData.length,
        fieldTypes: auctionData.map((field: any, index: number) => ({
          index,
          value: field.toString(),
          type: typeof field,
          isBigInt: typeof field === "bigint",
          isString: typeof field === "string",
          isNumber: typeof field === "number",
          isBoolean: typeof field === "boolean",
        })),
      });

      // Map to our unified types for verification
      const mappedData = {
        auctionId: auctionData[0].toString(),
        nftContract: auctionData[1],
        tokenId: auctionData[2].toString(),
        seller: auctionData[3],
        auctionType: Number(auctionData[4]),
        status: Number(auctionData[5]),
        allowPartialFulfillment: auctionData[6],
        isSettled: auctionData[7],
        revealPhaseStarted: auctionData[8],
        startingPrice: ethers.formatEther(auctionData[9]),
        reservePrice: ethers.formatEther(auctionData[10]),
        buyNowPrice: ethers.formatEther(auctionData[11]),
        currentPrice: ethers.formatEther(auctionData[12]),
        bidIncrement: ethers.formatEther(auctionData[13]),
        highestBid: ethers.formatEther(auctionData[14]),
        startTime: Number(auctionData[15]),
        endTime: Number(auctionData[16]),
        extensionThreshold: ethers.formatEther(auctionData[17]),
        extensionDuration: Number(auctionData[18]),
        revealEndTime: Number(auctionData[19]),
        highestBidder: auctionData[20],
        minBidders: Number(auctionData[21]),
        totalBidders: Number(auctionData[22]),
      };

      console.log("🎯 MAPPED DATA (Frontend Format):", mappedData);
      console.log("✅ Type compatibility check:", {
        auctionIdType: typeof mappedData.auctionId,
        tokenIdType: typeof mappedData.tokenId,
        pricesType: typeof mappedData.startingPrice,
        timestampsType: typeof mappedData.startTime,
        numbersType: typeof mappedData.auctionType,
      });

      // Verify data integrity
      const integrityCheck = {
        auctionIdMatches: mappedData.auctionId === auctionId.toString(),
        tokenIdMatches: mappedData.tokenId === tokenId.toString(),
        sellerMatches:
          mappedData.seller.toLowerCase() === address.toLowerCase(),
        auctionTypeValid:
          mappedData.auctionType >= 0 && mappedData.auctionType <= 3,
        pricesValid: parseFloat(mappedData.startingPrice) > 0,
        timestampsValid:
          mappedData.startTime > 0 && mappedData.endTime > mappedData.startTime,
      };

      console.log("🔍 DATA INTEGRITY CHECK:", integrityCheck);
      console.log(
        "📈 All checks passed:",
        Object.values(integrityCheck).every((check) => check)
      );

      setResult(
        "✅ Test auction created successfully! Check console for details."
      );
    } catch (error) {
      console.error("❌ Error creating test auction:", error);
      setResult(
        `❌ Error creating test auction: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🔌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Wallet Not Connected
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to create test auctions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Test Auction Creator
            </h1>
            <button
              onClick={createTestAuction}
              disabled={isCreating}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
            >
              {isCreating ? "Creating..." : "Create Test Auction"}
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              What This Does
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <ul className="space-y-2 text-blue-700 dark:text-blue-300">
                <li>• Creates a test NFT with fake metadata</li>
                <li>• Approves the NFT for the auction contract</li>
                <li>• Creates an English auction with 5-minute duration</li>
                <li>• Verifies the auction data from the contract</li>
                <li>• Provides transaction hashes for verification</li>
              </ul>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Auction Parameters
            </h2>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-gray-800 dark:text-gray-200 text-sm">
              <p>
                <strong>Type:</strong> English Auction (0)
              </p>
              <p>
                <strong>Starting Price:</strong> 0.001 ETH
              </p>
              <p>
                <strong>Reserve Price:</strong> 0.005 ETH
              </p>
              <p>
                <strong>Buy Now Price:</strong> 0.01 ETH
              </p>
              <p>
                <strong>Duration:</strong> 5 minutes
              </p>
              <p>
                <strong>Bid Increment:</strong> 0.0001 ETH
              </p>
              <p>
                <strong>Extension Threshold:</strong> 1 minute
              </p>
              <p>
                <strong>Extension Duration:</strong> 2 minutes
              </p>
            </div>
          </div>

          {result && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Result
              </h2>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                <pre
                  className={`text-sm ${
                    result.startsWith("✅")
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {result}
                </pre>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ Important Notes
            </h3>
            <ul className="space-y-1 text-yellow-700 dark:text-yellow-300 text-sm">
              <li>• This creates real transactions on Sepolia testnet</li>
              <li>• You need Sepolia ETH to pay for gas fees</li>
              <li>• The auction will be visible in the /auctions page</li>
              <li>• You can bid on your own auction for testing</li>
              <li>• The auction will end in 5 minutes for quick testing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
