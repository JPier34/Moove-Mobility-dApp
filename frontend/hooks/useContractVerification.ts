/**
 * Hook for contract verification and debugging
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  verifyDeployedContract,
  analyzeBidPlacedEvents,
} from "../utils/contractVerification";

export interface ContractDebugInfo {
  isVerified: boolean;
  issues: string[];
  contractInfo: {
    address: string;
    codeHash: string;
    isVerified: boolean;
  };
  eventAnalysis: {
    totalEvents: number;
    corruptedEvents: number;
    corruptionPatterns: {
      invalidAuctionIds: number[];
      invalidBidders: string[];
      zeroValues: number[];
    };
    additionalInfo: {
      rawLogCount: number;
      contractQueryEvents: number;
      eventDetails: any[];
    };
  };
}

export function useContractVerification() {
  const [debugInfo, setDebugInfo] = useState<ContractDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  const verifyContract = useCallback(async () => {
    if (!isConnected) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 Starting contract verification...");

      // Verify contract
      const verificationResult = await verifyDeployedContract();

      // Analyze events
      const eventAnalysis = await analyzeBidPlacedEvents();

      const debugInfo: ContractDebugInfo = {
        isVerified: verificationResult.isValid,
        issues: verificationResult.issues,
        contractInfo: verificationResult.contractInfo,
        eventAnalysis,
      };

      setDebugInfo(debugInfo);

      // Log results
      console.log("📊 Contract Verification Results:", {
        isValid: verificationResult.isValid,
        issues: verificationResult.issues,
        totalEvents: eventAnalysis.totalEvents,
        corruptedEvents: eventAnalysis.corruptedEvents,
        corruptionRate:
          eventAnalysis.totalEvents > 0
            ? (
                (eventAnalysis.corruptedEvents / eventAnalysis.totalEvents) *
                100
              ).toFixed(2) + "%"
            : "0%",
      });

      if (verificationResult.issues.length > 0) {
        console.warn(
          "⚠️ Contract verification issues:",
          verificationResult.issues
        );
      }

      if (eventAnalysis.corruptedEvents > 0) {
        console.warn("🚨 Corrupted events detected:", {
          corruptedEvents: eventAnalysis.corruptedEvents,
          totalEvents: eventAnalysis.totalEvents,
          patterns: eventAnalysis.corruptionPatterns,
        });
      }
    } catch (error) {
      console.error("❌ Contract verification failed:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Auto-verify on mount
  useEffect(() => {
    if (isConnected) {
      verifyContract();
    }
  }, [isConnected, verifyContract]);

  return {
    debugInfo,
    isLoading,
    error,
    verifyContract,
  };
}

