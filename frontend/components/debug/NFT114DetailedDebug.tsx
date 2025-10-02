"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { contracts } from "@/utils/contracts";
import { ethers } from "ethers";

export default function NFT114DetailedDebug() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Read tokenURI for NFT 114
  const { data: tokenURI, isLoading: uriLoading } = useReadContract({
    address: contracts.MooveNFT.address,
    abi: contracts.MooveNFT.abi,
    functionName: "tokenURI",
    args: [BigInt(114)],
  });

  useEffect(() => {
    if (!tokenURI || uriLoading) return;

    const fetchDetailedData = async () => {
      setLoading(true);
      try {
        console.log("🔍 NFT 114 Detailed Debug - TokenURI:", tokenURI);

        // 1. Fetch metadata from IPFS
        const httpUrl = (tokenURI as string).startsWith("ipfs://")
          ? `https://ipfs.io/ipfs/${(tokenURI as string).slice(7)}`
          : (tokenURI as string);

        const metadataResponse = await fetch(httpUrl);
        const metadata = metadataResponse.ok ? await metadataResponse.json() : null;

        // 2. Check image URL
        let imageUrl = metadata?.image || "/images/default-nft.svg";
        let imageLoads = false;
        let imageError = null;

        if (imageUrl.startsWith("ipfs://")) {
          imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
        }

        try {
          const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
          imageLoads = imageResponse.ok;
          if (!imageResponse.ok) {
            imageError = `HTTP ${imageResponse.status}`;
          }
        } catch (imgError) {
          imageError = imgError instanceof Error ? imgError.message : "Unknown error";
        }

        // 3. Try to find auction data for this NFT
        let auctionData = null;
        try {
          const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.infura.io/v3/YOUR_PROJECT_ID");
          const auctionContract = new ethers.Contract(
            contracts.MooveAuction.address,
            contracts.MooveAuction.abi,
            provider
          );

          // Check if this NFT was in any auction
          const totalAuctions = await auctionContract.totalAuctions();
          console.log("🔍 Total auctions:", Number(totalAuctions));

          for (let i = 0; i < Math.min(Number(totalAuctions), 50); i++) {
            try {
              const auction = await auctionContract.getAuction(i);
              const auctionTokenId = Number(auction.tokenId);
              if (auctionTokenId === 114) {
                auctionData = {
                  auctionId: i,
                  tokenId: auctionTokenId,
                  status: Number(auction.status),
                  isSettled: auction.isSettled,
                  highestBidder: auction.highestBidder,
                  currentPrice: auction.currentPrice ? ethers.formatEther(auction.currentPrice) : "0",
                  endTime: Number(auction.endTime),
                  seller: auction.seller,
                };
                console.log("🎯 Found auction for NFT 114:", auctionData);
                break;
              }
            } catch (auctionError) {
              // Continue searching
            }
          }
        } catch (error) {
          console.warn("⚠️ Error searching for auction data:", error);
        }

        // 4. Try to find transfer events
        let transferData = null;
        try {
          const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.infura.io/v3/YOUR_PROJECT_ID");
          const nftContract = new ethers.Contract(
            contracts.MooveNFT.address,
            contracts.MooveNFT.abi,
            provider
          );

          // Get Transfer events for token 114
          const filter = nftContract.filters.Transfer(null, null, 114);
          const events = await nftContract.queryFilter(filter, -10000); // Last 10000 blocks
          
          if (events.length > 0) {
            const lastTransfer = events[events.length - 1];
            const block = await provider.getBlock(lastTransfer.blockNumber);
            
            transferData = {
              transactionHash: lastTransfer.transactionHash,
              blockNumber: lastTransfer.blockNumber,
              timestamp: block?.timestamp,
              from: lastTransfer.args.from,
              to: lastTransfer.args.to,
              date: block ? new Date(block.timestamp * 1000).toISOString() : "Unknown",
            };
            console.log("📄 Transfer data for NFT 114:", transferData);
          }
        } catch (error) {
          console.warn("⚠️ Error fetching transfer data:", error);
        }

        setDebugData({
          tokenURI: tokenURI as string,
          httpUrl,
          metadata,
          imageUrl,
          imageLoads,
          imageError,
          auctionData,
          transferData,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        console.error("❌ Error in detailed debug:", error);
        setDebugData({
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedData();
  }, [tokenURI, uriLoading]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-2">NFT 114 Detailed Debug</h3>
      
      <div className="mb-2">
        <strong>Status:</strong> {loading ? "Loading..." : "Complete"}
      </div>
      
      {debugData && (
        <div className="mt-4 space-y-4">
          {/* TokenURI */}
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold mb-2">📄 TokenURI</h4>
            <div className="text-sm font-mono break-all">{debugData.tokenURI}</div>
            <div className="text-sm text-gray-600 mt-1">HTTP URL: {debugData.httpUrl}</div>
          </div>

          {/* Metadata */}
          {debugData.metadata && (
            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold mb-2">📋 Metadata</h4>
              <div className="text-sm">
                <div><strong>Name:</strong> {debugData.metadata.name}</div>
                <div><strong>Description:</strong> {debugData.metadata.description}</div>
                <div><strong>Image URL:</strong> {debugData.metadata.image}</div>
                {debugData.metadata.attributes && (
                  <div>
                    <strong>Attributes:</strong>
                    <ul className="ml-4">
                      {debugData.metadata.attributes.map((attr: any, index: number) => (
                        <li key={index}>{attr.trait_type}: {attr.value}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Status */}
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold mb-2">🖼️ Image Status</h4>
            <div className="text-sm">
              <div><strong>Image URL:</strong> {debugData.imageUrl}</div>
              <div><strong>Loads:</strong> {debugData.imageLoads ? "✅ YES" : "❌ NO"}</div>
              {debugData.imageError && (
                <div><strong>Error:</strong> {debugData.imageError}</div>
              )}
            </div>
          </div>

          {/* Auction Data */}
          {debugData.auctionData && (
            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold mb-2">🎯 Auction Data</h4>
              <div className="text-sm">
                <div><strong>Auction ID:</strong> {debugData.auctionData.auctionId}</div>
                <div><strong>Status:</strong> {debugData.auctionData.status}</div>
                <div><strong>Is Settled:</strong> {debugData.auctionData.isSettled ? "✅ YES" : "❌ NO"}</div>
                <div><strong>Current Price:</strong> {debugData.auctionData.currentPrice} ETH</div>
                <div><strong>Highest Bidder:</strong> {debugData.auctionData.highestBidder}</div>
                <div><strong>Seller:</strong> {debugData.auctionData.seller}</div>
                <div><strong>End Time:</strong> {new Date(debugData.auctionData.endTime * 1000).toISOString()}</div>
              </div>
            </div>
          )}

          {/* Transfer Data */}
          {debugData.transferData && (
            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold mb-2">📄 Transfer Data</h4>
              <div className="text-sm">
                <div><strong>Transaction Hash:</strong> {debugData.transferData.transactionHash}</div>
                <div><strong>Block Number:</strong> {debugData.transferData.blockNumber}</div>
                <div><strong>Date:</strong> {debugData.transferData.date}</div>
                <div><strong>From:</strong> {debugData.transferData.from}</div>
                <div><strong>To:</strong> {debugData.transferData.to}</div>
              </div>
            </div>
          )}

          {/* Error */}
          {debugData.error && (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">❌ Error</h4>
              <div className="text-sm text-red-700">{debugData.error}</div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Debug completed at: {debugData.timestamp}
          </div>
        </div>
      )}
    </div>
  );
}
