"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";

interface UseBlockConfirmationsProps {
  transactionHash?: string;
  requiredConfirmations?: number;
}

export const useBlockConfirmations = ({
  transactionHash,
  requiredConfirmations = 3,
}: UseBlockConfirmationsProps) => {
  const [confirmations, setConfirmations] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!transactionHash || !publicClient) return;

    const checkConfirmations = async () => {
      setLoading(true);
      try {
        // Get transaction receipt
        const receipt = await publicClient.getTransactionReceipt({
          hash: transactionHash as `0x${string}`,
        });

        if (receipt) {
          // Get current block number
          const currentBlock = await publicClient.getBlockNumber();
          const txBlock = receipt.blockNumber;
          const currentConfirmations = Number(currentBlock - txBlock) + 1;

          setConfirmations(currentConfirmations);
          setIsConfirmed(currentConfirmations >= requiredConfirmations);
        }
      } catch (error) {
        console.error("Error checking confirmations:", error);
      } finally {
        setLoading(false);
      }
    };

    // Check immediately
    checkConfirmations();

    // Set up polling
    const interval = setInterval(checkConfirmations, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [transactionHash, requiredConfirmations, publicClient]);

  return {
    confirmations,
    isConfirmed,
    loading,
    progress: Math.min(confirmations / requiredConfirmations, 1),
  };
};
