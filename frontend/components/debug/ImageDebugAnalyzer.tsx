"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";

interface ImageDebugData {
  tokenId: string;
  tokenURI: string;
  cleanTokenURI: string;
  metadata: any;
  imageUrl: string;
  imageStatus: "loading" | "success" | "error";
  errorMessage?: string;
}

export default function ImageDebugAnalyzer() {
  const { address, isConnected } = useAccount();
  const [debugData, setDebugData] = useState<ImageDebugData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testTokenIds, setTestTokenIds] = useState<string>("114,115,116");

  const analyzeImages = async () => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    setDebugData([]);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nftContract = new ethers.Contract(
        contracts.MooveNFT.address,
        contracts.MooveNFT.abi,
        provider
      );

      const tokenIds = testTokenIds.split(",").map((id) => id.trim());
      const results: ImageDebugData[] = [];

      for (const tokenId of tokenIds) {
        console.log(`🔍 Analyzing NFT ${tokenId}...`);

        try {
          // Get tokenURI from contract
          const tokenURI = await nftContract.tokenURI(tokenId);
          console.log(`🔍 [NFT ${tokenId}] Raw tokenURI:`, tokenURI);

          let cleanTokenURI = tokenURI.replace(/"/g, "");

          // Convert ipfs:// to https://ipfs.io/ipfs/ for browser compatibility
          if (cleanTokenURI.startsWith("ipfs://")) {
            cleanTokenURI = cleanTokenURI.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            );
          }

          console.log(`🔍 [NFT ${tokenId}] Clean tokenURI:`, cleanTokenURI);

          // Check if it's a mock hash
          if (cleanTokenURI.includes("QmMockMetadataHashForTesting")) {
            console.log(`🎭 [NFT ${tokenId}] Mock hash detected`);
            results.push({
              tokenId,
              tokenURI,
              cleanTokenURI,
              metadata: null,
              imageUrl: "/images/default-nft.svg",
              imageStatus: "error",
              errorMessage: "Mock hash detected",
            });
            continue;
          }

          // Fetch metadata
          console.log(
            `🔍 [NFT ${tokenId}] Fetching metadata from: ${cleanTokenURI}`
          );
          const response = await fetch(cleanTokenURI);
          console.log(
            `🔍 [NFT ${tokenId}] Fetch response:`,
            response.status,
            response.statusText
          );

          if (!response.ok) {
            results.push({
              tokenId,
              tokenURI,
              cleanTokenURI,
              metadata: null,
              imageUrl: "",
              imageStatus: "error",
              errorMessage: `HTTP ${response.status}: ${response.statusText}`,
            });
            continue;
          }

          const metadata = await response.json();
          console.log(`🔍 [NFT ${tokenId}] Raw metadata:`, metadata);

          // Process image URL
          let imageUrl = "";
          if (metadata.image) {
            if (metadata.image.startsWith("QmMockMetadataHashForTesting")) {
              imageUrl = "/images/default-nft.svg";
            } else if (metadata.image.startsWith("Qm")) {
              imageUrl = `https://ipfs.io/ipfs/${metadata.image}`;
            } else if (metadata.image.startsWith("http")) {
              imageUrl = metadata.image;
            } else {
              imageUrl = "/images/default-nft.svg";
            }
          } else {
            imageUrl = "/images/default-nft.svg";
          }

          console.log(`🔍 [NFT ${tokenId}] Processed image URL:`, imageUrl);

          // Test image loading
          let imageStatus: "loading" | "success" | "error" = "loading";
          let errorMessage = "";

          if (imageUrl !== "/images/default-nft.svg") {
            try {
              const imageResponse = await fetch(imageUrl, { method: "HEAD" });
              if (imageResponse.ok) {
                imageStatus = "success";
              } else {
                imageStatus = "error";
                errorMessage = `Image HTTP ${imageResponse.status}: ${imageResponse.statusText}`;
              }
            } catch (imageError) {
              imageStatus = "error";
              errorMessage = `Image fetch error: ${imageError}`;
            }
          } else {
            imageStatus = "success"; // Fallback is always "success"
          }

          results.push({
            tokenId,
            tokenURI,
            cleanTokenURI,
            metadata,
            imageUrl,
            imageStatus,
            errorMessage,
          });
        } catch (error) {
          console.error(`❌ Error analyzing NFT ${tokenId}:`, error);
          results.push({
            tokenId,
            tokenURI: "",
            cleanTokenURI: "",
            metadata: null,
            imageUrl: "",
            imageStatus: "error",
            errorMessage: `Analysis error: ${error}`,
          });
        }
      }

      setDebugData(results);
    } catch (error) {
      console.error("❌ Error in image analysis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testImageLoad = async (imageUrl: string) => {
    if (!imageUrl || imageUrl === "/images/default-nft.svg") return;

    try {
      console.log(`🖼️ Testing image load: ${imageUrl}`);
      const response = await fetch(imageUrl, { method: "HEAD" });
      console.log(
        `🖼️ Image test result:`,
        response.status,
        response.statusText
      );

      if (response.ok) {
        console.log(`✅ Image is accessible`);
      } else {
        console.log(`❌ Image not accessible: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Image test failed:`, error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🔍 Image Debug Analyzer
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Token IDs to analyze (comma-separated):
        </label>
        <input
          type="text"
          value={testTokenIds}
          onChange={(e) => setTestTokenIds(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="114,115,116"
        />
      </div>

      <button
        onClick={analyzeImages}
        disabled={isLoading || !isConnected}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Analyzing..." : "Analyze Images"}
      </button>

      {debugData.length > 0 && (
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Analysis Results
          </h3>

          {debugData.map((data, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  NFT #{data.tokenId}
                </h4>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    data.imageStatus === "success"
                      ? "bg-green-100 text-green-800"
                      : data.imageStatus === "error"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {data.imageStatus.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">
                    Token URI:
                  </strong>
                  <div className="font-mono text-xs break-all mt-1">
                    {data.tokenURI || "N/A"}
                  </div>
                </div>

                <div>
                  <strong className="text-gray-700 dark:text-gray-300">
                    Clean Token URI:
                  </strong>
                  <div className="font-mono text-xs break-all mt-1">
                    {data.cleanTokenURI || "N/A"}
                  </div>
                </div>

                <div>
                  <strong className="text-gray-700 dark:text-gray-300">
                    Image URL:
                  </strong>
                  <div className="font-mono text-xs break-all mt-1">
                    {data.imageUrl || "N/A"}
                  </div>
                </div>

                <div>
                  <strong className="text-gray-700 dark:text-gray-300">
                    Error:
                  </strong>
                  <div className="text-red-600 mt-1">
                    {data.errorMessage || "None"}
                  </div>
                </div>
              </div>

              {data.metadata && (
                <div className="mt-4">
                  <strong className="text-gray-700 dark:text-gray-300">
                    Metadata:
                  </strong>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 overflow-auto max-h-32">
                    {JSON.stringify(data.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {data.imageUrl && data.imageUrl !== "/images/default-nft.svg" && (
                <div className="mt-4">
                  <button
                    onClick={() => testImageLoad(data.imageUrl)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    Test Image Load
                  </button>
                </div>
              )}

              {/* Image Preview */}
              {data.imageUrl && data.imageStatus === "success" && (
                <div className="mt-4">
                  <strong className="text-gray-700 dark:text-gray-300">
                    Preview:
                  </strong>
                  <div className="mt-2 w-32 h-32 border border-gray-300 rounded">
                    <img
                      src={data.imageUrl}
                      alt={`NFT ${data.tokenId}`}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        console.log(
                          `❌ Preview image failed to load: ${data.imageUrl}`
                        );
                        e.currentTarget.style.display = "none";
                      }}
                      onLoad={() =>
                        console.log(`✅ Preview image loaded: ${data.imageUrl}`)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
