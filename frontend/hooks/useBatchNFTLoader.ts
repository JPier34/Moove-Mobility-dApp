"use client";

import { useEffect, useState } from "react";
import { useMulticall } from "./useMulticall";
import { encodeFunctionData } from "viem";

interface NFTBatchData {
  tokenId: string;
  tokenURI?: string;
  owner?: string;
  name?: string;
  symbol?: string;
}

interface UseBatchNFTLoaderProps {
  contractAddress: string;
  tokenIds: string[];
  contractABI: any[];
}

export const useBatchNFTLoader = ({
  contractAddress,
  tokenIds,
  contractABI,
}: UseBatchNFTLoaderProps) => {
  const [nftData, setNftData] = useState<NFTBatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { executeBatch } = useMulticall();

  useEffect(() => {
    if (!contractAddress || tokenIds.length === 0) {
      setNftData([]);
      return;
    }

    const loadBatchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Prepare batch requests
        const requests = tokenIds.flatMap((tokenId) => [
          // Get token URI
          {
            target: contractAddress,
            callData: encodeFunctionData({
              abi: contractABI,
              functionName: "tokenURI",
              args: [BigInt(tokenId)],
            }),
            functionName: "tokenURI",
            abi: contractABI,
          },
          // Get owner
          {
            target: contractAddress,
            callData: encodeFunctionData({
              abi: contractABI,
              functionName: "ownerOf",
              args: [BigInt(tokenId)],
            }),
            functionName: "ownerOf",
            abi: contractABI,
          },
        ]);

        // Also get contract name and symbol (once)
        const contractInfoRequests = [
          {
            target: contractAddress,
            callData: encodeFunctionData({
              abi: contractABI,
              functionName: "name",
              args: [],
            }),
            functionName: "name",
            abi: contractABI,
          },
          {
            target: contractAddress,
            callData: encodeFunctionData({
              abi: contractABI,
              functionName: "symbol",
              args: [],
            }),
            functionName: "symbol",
            abi: contractABI,
          },
        ];

        // Execute all requests in single batch
        const allRequests = [...requests, ...contractInfoRequests];
        const results = await executeBatch(allRequests);

        // Process results
        const contractName = results[results.length - 2]?.decoded || "Unknown";
        const contractSymbol = results[results.length - 1]?.decoded || "UNK";

        const processedData: NFTBatchData[] = tokenIds.map((tokenId, index) => {
          const uriIndex = index * 2;
          const ownerIndex = index * 2 + 1;

          return {
            tokenId,
            tokenURI: results[uriIndex]?.decoded || undefined,
            owner: results[ownerIndex]?.decoded || undefined,
            name: contractName,
            symbol: contractSymbol,
          };
        });

        setNftData(processedData);
      } catch (err: any) {
        setError(err.message || "Failed to load NFT batch data");
      } finally {
        setLoading(false);
      }
    };

    loadBatchData();
  }, [contractAddress, tokenIds, contractABI, executeBatch]);

  return { nftData, loading, error };
};
