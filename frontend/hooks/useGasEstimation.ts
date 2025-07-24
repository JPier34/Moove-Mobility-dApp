import { useState } from "react";
import { usePublicClient } from "wagmi";

interface GasEstimation {
  gasLimit: bigint;
  gasPrice: bigint;
  totalCostETH: string;
  totalCostUSD?: string;
}

export const useGasEstimation = () => {
  const [estimation, setEstimation] = useState<GasEstimation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  if (!publicClient) {
    setError("Public client not available");
    setLoading(false);
    return null;
  }

  const estimateGas = async (
    contractCall: any,
    ethPriceUSD?: number
  ): Promise<GasEstimation | null> => {
    setLoading(true);
    setError(null);

    try {
      // Estimate gas for the transaction
      const gasLimit = await contractCall.estimateGas();
      const gasPrice = await publicClient.getGasPrice();

      // Add 20% buffer to gas limit
      const gasLimitWithBuffer = (gasLimit * 120n) / 100n;

      // Calculate total cost
      const totalCost = gasLimitWithBuffer * gasPrice;
      const totalCostETH = Number(totalCost) / 1e18;

      const result: GasEstimation = {
        gasLimit: gasLimitWithBuffer,
        gasPrice,
        totalCostETH: totalCostETH.toFixed(6),
        totalCostUSD: ethPriceUSD
          ? (totalCostETH * ethPriceUSD).toFixed(2)
          : undefined,
      };

      setEstimation(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Gas estimation failed";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    estimation,
    loading,
    error,
    estimateGas,
  };
};
