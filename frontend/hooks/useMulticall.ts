"use client";

import { useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { Abi } from "viem";

interface MulticallRequest {
  target: `0x${string}`;
  abi: Abi; // ✅ FIXED: Use proper Abi type
  functionName: string;
  args?: readonly unknown[];
}

interface MulticallResult {
  success: boolean;
  returnData: any;
  error?: string;
}

export const useMulticall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const executeBatch = useCallback(
    async (requests: MulticallRequest[]): Promise<MulticallResult[]> => {
      if (requests.length === 0) return [];

      // ✅ FIXED: Check if publicClient exists
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      setLoading(true);
      setError(null);

      try {
        // ✅ FIXED: Use correct multicall format for Wagmi v2
        const results = await publicClient.multicall({
          contracts: requests.map((req) => ({
            address: req.target,
            abi: req.abi,
            functionName: req.functionName,
            args: req.args || [],
          })),
        });

        // Process results
        const processedResults: MulticallResult[] = results.map(
          (result, index) => {
            if (result.status === "success") {
              return {
                success: true,
                returnData: result.result,
              };
            } else {
              return {
                success: false,
                returnData: null,
                error: result.error?.message || "Call failed",
              };
            }
          }
        );

        return processedResults;
      } catch (err: any) {
        const errorMessage = err?.message || "Multicall batch failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [publicClient]
  );

  return {
    executeBatch,
    loading,
    error,
  };
};
