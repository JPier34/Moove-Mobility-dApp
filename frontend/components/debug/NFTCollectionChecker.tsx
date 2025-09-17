"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contracts } from "../../utils/contracts";
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
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      console.log(`🔍 Checking NFT ${tokenId} ownership for ${userAddress}...`);
      console.log(`📋 Using contract:`, contracts.MooveNFT.address);

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
        contract: contracts.MooveNFT.address,
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
        contractAddress: contracts.MooveNFT.address,
      };

      console.log(`📊 NFT ownership data:`, result);
      setNftData(result);
    } catch (error: any) {
      console.error(`❌ Error checking NFT ${tokenId} ownership:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
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
    </div>
  );
}
