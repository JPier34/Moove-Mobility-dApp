"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
// import { contracts } from "../../utils/contracts"; // Not needed anymore
import { useAccount } from "wagmi";

interface NFTCollectionCheckerProps {
  tokenId?: number;
  userAddress?: string;
}

export default function NFTCollectionChecker({
  tokenId: initialTokenId = 0,
  userAddress: initialUserAddress,
}: NFTCollectionCheckerProps) {
  const { address: connectedAddress } = useAccount();
  const [tokenId, setTokenId] = useState(initialTokenId);
  const [userAddress, setUserAddress] = useState(
    initialUserAddress ||
      connectedAddress ||
      "0x777382955f33Bb8540602E914D9b650C962EF6Cc"
  );
  const [nftData, setNftData] = useState<any>(null);
  const [auctionData, setAuctionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update userAddress when wallet connects/disconnects
  useEffect(() => {
    if (connectedAddress && !initialUserAddress) {
      setUserAddress(connectedAddress);
    }
  }, [connectedAddress, initialUserAddress]);

  const checkNFTOwnership = async () => {
    setLoading(true);
    setError(null);

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No ethereum provider available");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const nftContract = new ethers.Contract(
        "0x40E455515bf712144C1A5D859F19d64b537754f7", // MooveNFT address
        [
          "function totalSupply() view returns (uint256)",
          "function ownerOf(uint256 tokenId) view returns (address)",
          "function tokenURI(uint256 tokenId) view returns (string)",
        ],
        provider
      );

      console.log(`🔍 Checking NFT ${tokenId} ownership for ${userAddress}...`);
      console.log(
        `📋 Using contract:`,
        "0x40E455515bf712144C1A5D859F19d64b537754f7"
      );

      // Check owner
      const owner = await nftContract.ownerOf(tokenId);
      console.log(`👤 Owner of token ${tokenId}:`, owner);

      // Check if user owns it
      const ownerLower = owner.toLowerCase();
      const userLower = userAddress.toLowerCase();
      const isOwner = ownerLower === userLower;

      console.log(`🔍 Ownership Debug:`, {
        owner: owner,
        ownerLower: ownerLower,
        userAddress: userAddress,
        userLower: userLower,
        isOwner: isOwner,
        contract: "0x40E455515bf712144C1A5D859F19d64b537754f7",
      });

      // Get token URI
      const tokenURI = await nftContract.tokenURI(tokenId);
      console.log(`🔗 Token URI:`, tokenURI);

      // Get metadata
      let metadata = null;
      if (tokenURI) {
        try {
          const response = await fetch(tokenURI);
          metadata = await response.json();
          console.log(`📄 Metadata:`, metadata);
        } catch (metaError) {
          console.warn("⚠️ Could not fetch metadata:", metaError);
        }
      }

      const result = {
        tokenId: tokenId.toString(),
        owner: owner,
        isOwner: isOwner,
        userAddress: userAddress,
        tokenURI: tokenURI,
        metadata: metadata,
        contractAddress: "0x40E455515bf712144C1A5D859F19d64b537754f7",
      };

      console.log(`📊 NFT ownership data:`, result);
      setNftData(result);

      // Now analyze the auction for this NFT
      await analyzeAuctionForNFT(tokenId, provider);
    } catch (error: any) {
      console.error(`❌ Error checking NFT ${tokenId} ownership:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAuctionForNFT = async (
    tokenId: number,
    provider: ethers.BrowserProvider
  ) => {
    try {
      console.log(`🔍 Analyzing auction for NFT ${tokenId}...`);

      const auctionContract = new ethers.Contract(
        "0xF3A15bf233D28435E338DFF2aF2E33c72b701525", // CORRECTED MooveAuction address
        [
          "function totalAuctions() view returns (uint256)",
          "function getAuction(uint256 auctionId) view returns (bytes)",
        ],
        provider
      );

      // Also check contract functions to debug ABI mismatch
      try {
        console.log(`🔍 Testing contract functions...`);

        // Test basic functions
        const testTotalAuctions = await auctionContract.totalAuctions();
        console.log(`✅ totalAuctions(): ${testTotalAuctions}`);

        // Try to get contract interface
        const contractInterface = auctionContract.interface;
        console.log(`📋 Contract interface:`, contractInterface);

        // Check available functions
        if (contractInterface && contractInterface.fragments) {
          const functions = contractInterface.fragments.filter(
            (f) => f.type === "function"
          );
          console.log(
            `📋 Available functions:`,
            functions.map((f) => f.name)
          );
        } else {
          console.log(
            `📋 Contract interface fragments:`,
            contractInterface?.fragments
          );
        }

        // Check if getAuction function exists
        try {
          const getAuctionFunction =
            contractInterface.getFunction("getAuction");
          console.log(`✅ getAuction function exists:`, getAuctionFunction);
        } catch (error) {
          console.log(
            `❌ getAuction function NOT found in ABI:`,
            error.message
          );
        }
      } catch (error) {
        console.error(`❌ Error testing contract functions:`, error);
      }

      // Get total auctions
      const totalAuctions = await auctionContract.totalAuctions();
      const totalCount = Number(totalAuctions);
      console.log(`📊 Total auctions: ${totalCount}`);

      // Also check if there's a nextAuctionId function
      let nextAuctionId = 0;
      try {
        const nextId = await auctionContract.nextAuctionId();
        nextAuctionId = Number(nextId);
        console.log(`📊 Next auction ID: ${nextAuctionId}`);
      } catch (error) {
        console.log(`⚠️ nextAuctionId function not available:`, error.message);
      }

      // Search for auction with this tokenId
      let foundAuction = null;
      let auctionId = -1;

      // Try different starting points for auction IDs
      const startPoints = [0, 1, nextAuctionId - totalCount, nextAuctionId - 1];
      console.log(`🔍 Trying different starting points:`, startPoints);

      for (const startPoint of startPoints) {
        console.log(`🔍 Trying starting point: ${startPoint}`);
        for (let i = startPoint; i < startPoint + totalCount + 5; i++) {
          try {
            const rawData = await auctionContract.getAuction(i);
            console.log(`🔍 Checking auction ${i} for tokenId ${tokenId}...`);

            // Manual hex parsing
            const hexData = rawData.slice(2);
            const dataBytes = hexData.length / 2;

            if (dataBytes >= 256) {
              // Parse tokenId from position 104-168 (3rd field)
              const auctionTokenId = BigInt("0x" + hexData.slice(104, 168));
              console.log(
                `🔍 Auction ${i} tokenId: ${auctionTokenId.toString()}`
              );

              if (auctionTokenId.toString() === tokenId.toString()) {
                console.log(`✅ Found auction ${i} for tokenId ${tokenId}!`);
                auctionId = i;

                // Parse all auction data
                const auctionIdBig = BigInt("0x" + hexData.slice(0, 64));
                const nftContract = "0x" + hexData.slice(64, 104);
                const seller = "0x" + hexData.slice(168, 208);
                const auctionType = parseInt(hexData.slice(208, 210), 16);
                const startingPrice = BigInt("0x" + hexData.slice(210, 274));
                const reservePrice = BigInt("0x" + hexData.slice(274, 338));
                const buyNowPrice = BigInt("0x" + hexData.slice(338, 402));

                foundAuction = {
                  auctionId: auctionIdBig.toString(),
                  nftContract,
                  tokenId: auctionTokenId.toString(),
                  seller,
                  auctionType,
                  auctionTypeName: getAuctionTypeName(auctionType),
                  startingPrice: ethers.formatEther(startingPrice),
                  reservePrice: ethers.formatEther(reservePrice),
                  buyNowPrice: ethers.formatEther(buyNowPrice),
                  // Default values for missing fields
                  currentPrice: "0.0",
                  startTime: 0,
                  endTime: 0,
                  bidIncrement: "0.0",
                  highestBidder: "0x0000000000000000000000000000000000000000",
                  highestBid: "0.0",
                  status: 0,
                  statusName: "UNKNOWN",
                  allowPartialFulfillment: false,
                  minBidders: 0,
                  totalBidders: 0,
                  isSettled: false,
                  extensionThreshold: "0.0",
                  extensionDuration: 0,
                };

                console.log(`📊 Auction data:`, foundAuction);
                break;
              }
            }
          } catch (error) {
            console.log(`⚠️ Error checking auction ${i}:`, error.message);
          }
        }
        if (foundAuction) break;
      }

      if (foundAuction) {
        console.log(`✅ Found auction ${auctionId} for NFT ${tokenId}`);
        setAuctionData(foundAuction);
      } else {
        console.log(`❌ No auction found for NFT ${tokenId}`);
        console.log(
          `📊 Summary: NFT ${tokenId} is owned by auction contract but no auction was found`
        );
        console.log(`📊 Contract has ${totalCount} auctions total`);
        console.log(`📊 Next auction ID: ${nextAuctionId}`);
        setAuctionData(null);
      }
    } catch (error) {
      console.error(`❌ Error analyzing auction for NFT ${tokenId}:`, error);
    }
  };

  const getAuctionTypeName = (type: number): string => {
    switch (type) {
      case 0:
        return "ENGLISH";
      case 1:
        return "DUTCH";
      case 2:
        return "SEALED_BID";
      case 3:
        return "RESERVE";
      default:
        return "UNKNOWN";
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🖼️ NFT Collection Checker</h3>

      {/* Input Controls */}
      <div className="mb-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token ID:
          </label>
          <input
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Address:
            {connectedAddress && userAddress === connectedAddress && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                🔗 Connected Wallet
              </span>
            )}
          </label>
          <input
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
          />
          {connectedAddress && (
            <button
              onClick={() => setUserAddress(connectedAddress)}
              className="mt-1 text-xs text-blue-600 hover:text-blue-800"
            >
              Use Connected Wallet ({connectedAddress.slice(0, 6)}...
              {connectedAddress.slice(-4)})
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={checkNFTOwnership}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Checking..." : `Check NFT ${tokenId} Ownership`}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {nftData && (
        <div className="space-y-2">
          <h4
            className={`font-semibold ${
              nftData.isOwner ? "text-green-600" : "text-red-600"
            }`}
          >
            {nftData.isOwner
              ? "✅ NFT Owned by User"
              : "❌ NFT Not Owned by User"}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Token ID:</strong> {nftData.tokenId}
            </div>
            <div>
              <strong>Owner:</strong> {nftData.owner}
            </div>
            <div>
              <strong>User Address:</strong> {nftData.userAddress}
            </div>
            <div>
              <strong>Contract:</strong> {nftData.contractAddress}
            </div>
            <div>
              <strong>Token URI:</strong> {nftData.tokenURI}
            </div>
            {nftData.metadata && (
              <>
                <div>
                  <strong>Name:</strong> {nftData.metadata.name}
                </div>
                <div>
                  <strong>Description:</strong> {nftData.metadata.description}
                </div>
                <div>
                  <strong>Image:</strong> {nftData.metadata.image}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {auctionData && (
        <div className="mt-6 space-y-2">
          <h4 className="font-semibold text-blue-600">🏆 Auction Analysis</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Auction ID:</strong> {auctionData.auctionId}
            </div>
            <div>
              <strong>Type:</strong> {auctionData.auctionTypeName} (
              {auctionData.auctionType})
            </div>
            <div>
              <strong>Seller:</strong> {auctionData.seller}
            </div>
            <div>
              <strong>Starting Price:</strong> {auctionData.startingPrice} ETH
            </div>
            <div>
              <strong>Reserve Price:</strong> {auctionData.reservePrice} ETH
            </div>
            <div>
              <strong>Buy Now Price:</strong> {auctionData.buyNowPrice} ETH
            </div>
            <div>
              <strong>Status:</strong> {auctionData.statusName} (
              {auctionData.status})
            </div>
            <div>
              <strong>Highest Bidder:</strong> {auctionData.highestBidder}
            </div>
            <div>
              <strong>Highest Bid:</strong> {auctionData.highestBid} ETH
            </div>
            <div>
              <strong>Is Settled:</strong>{" "}
              {auctionData.isSettled ? "Yes" : "No"}
            </div>
          </div>

          {/* Analysis */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h5 className="font-semibold text-yellow-800 mb-2">🔍 Analysis:</h5>
            <div className="text-sm text-yellow-700 space-y-1">
              {auctionData.auctionTypeName === "SEALED_BID" ? (
                <>
                  <div>
                    • This is a <strong>SEALED_BID</strong> auction
                  </div>
                  <div>
                    • Status: <strong>{auctionData.statusName}</strong>
                  </div>
                  {auctionData.status === 0 && (
                    <div>
                      • ⚠️ Auction is still PENDING - reveal phase may not have
                      started
                    </div>
                  )}
                  {auctionData.status === 1 && (
                    <div>
                      • ⚠️ Auction is ACTIVE - should transition to REVEAL phase
                    </div>
                  )}
                  {auctionData.status === 2 && (
                    <div>
                      • 🔓 Auction is in REVEAL phase - bids should be revealed
                    </div>
                  )}
                  {auctionData.status === 3 && (
                    <div>
                      • 🏁 Auction is ENDED - winner should be determined
                    </div>
                  )}
                  {auctionData.highestBidder ===
                    "0x0000000000000000000000000000000000000000" && (
                    <div>
                      • ❌ No valid winner found - reveal may have failed
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    • This is a <strong>{auctionData.auctionTypeName}</strong>{" "}
                    auction
                  </div>
                  <div>
                    • Status: <strong>{auctionData.statusName}</strong>
                  </div>
                  {auctionData.highestBidder ===
                    "0x0000000000000000000000000000000000000000" && (
                    <div>• ❌ No bids found - auction may have failed</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!auctionData && nftData && (
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="font-semibold text-red-600">❌ No Auction Found</h4>
          <div className="text-sm text-red-700">
            <p className="mb-2">
              <strong>NFT #{nftData.tokenId}</strong> is owned by the auction
              contract but no auction was found.
            </p>
            <p className="mb-2">
              <strong>Current Owner:</strong> {nftData.owner} (Auction Contract)
            </p>
            <p className="mb-2">
              <strong>Possible Scenarios:</strong>
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Auction Not Created:</strong> The NFT was transferred to
                the auction contract but the auction was never created
              </li>
              <li>
                <strong>Wrong Auction ID:</strong> The auction exists but with a
                different ID than expected
              </li>
              <li>
                <strong>Contract Mismatch:</strong> The auction was created on a
                different contract version
              </li>
              <li>
                <strong>Data Corruption:</strong> The auction data was corrupted
                or deleted
              </li>
            </ul>
            <div className="mt-3 p-2 bg-yellow-100 rounded">
              <p className="text-xs">
                <strong>Note:</strong> This indicates a problem with the auction
                creation process. The NFT was transferred to the auction
                contract but the auction was never properly created.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
