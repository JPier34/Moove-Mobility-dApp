"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { useUserRoles } from "@/hooks/useContract";
import { ErrorBoundary, useLastError } from "./ErrorBoundary";
import { useSecureNFTAuctionFlow } from "@/hooks/useSecureNFTAuction";
import { useRouter } from "next/navigation";
import { useIPFSUnified } from "@/hooks/useIPFSUnified";
import { useNFTValidationAPI } from "@/hooks/useNFTValidationAPI";
import { useWalletPersistence } from "@/hooks/useWalletPersistence";
import { useAuctionValidationModular } from "@/hooks/useAuctionValidationModular";
import { useAuctionFormValidation } from "@/hooks/useAuctionFormValidation";
import { AuctionType } from "@/types/auction";

// Temporary type definition
interface AuctionFormData {
  auctionType: any;
  startPrice: string;
  duration: string;
  durationUnit: "minutes" | "hours";
  bidIncrement: string;
  reservePrice: string;
  buyNowPrice: string;
}

interface NFTFormData {
  name: string;
  description: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";
  image: File | null;
  isLimitedEdition: boolean;
  editionSize: string;
  editionName: string;
  customizationOptions: {
    allowColorChange: boolean;
    allowTextChange: boolean;
    allowSizeChange: boolean;
    allowEffectsChange: boolean;
    availableColors: string[];
    maxTextLength: string;
  };
}

function AdminNFTCreatorDebugContent() {
  const { address } = useAccount();
  const { canMint, isMasterAdmin, isLoading } = useUserRoles(address);
  const { error: lastError, clearError } = useLastError();

  // Master admin wallet - always has access
  const MASTER_WALLET = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";
  const isMasterWallet = address?.toLowerCase() === MASTER_WALLET.toLowerCase();
  const hasAdminAccess = isMasterWallet || canMint || isMasterAdmin;

  // ALL EARLY RETURNS BEFORE ANY OTHER HOOKS
  if (lastError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-900 dark:text-red-300 mb-4">
              🚨 Last Error Detected
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Time:</strong> {lastError.timestamp}
              </p>
              <p>
                <strong>Error:</strong> {lastError.error.message}
              </p>
              <p>
                <strong>Name:</strong> {lastError.error.name}
              </p>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={clearError}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Error & Continue
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // TEST: Removing even more hooks - testing if useSecureNFTAuctionFlow is the culprit
  // const {
  //   executeFlow: executeSecureFlow,
  //   isProcessing: isSecureProcessing,
  //   currentPhase: securePhase,
  //   result: secureResult,
  //   error: secureError,
  // } = useSecureNFTAuctionFlow();

  // const router = useRouter();
  // Temporarily removed ALL additional hooks - testing absolute minimum

  // TEST: Removing modular hooks to see if they cause issues when combined with others
  // const {
  //   formData: auctionFormData,
  //   isValid: isAuctionValid,
  //   updateField,
  //   validateForTransaction,
  // } = useAuctionValidationModular();

  // const { areRequiredFieldsFilled, getValidationSummary } =
  //   useAuctionFormValidation(auctionFormData);

  // Temporary placeholders
  const isAuctionValid = true;
  const areRequiredFieldsFilled = true;

  // TEST: Removing states one by one to find the culprit
  const [step, setStep] = useState<"nft" | "auction">("nft");
  // Temporarily removed all other states

  // TEST: Removing useMemo hooks to isolate the issue
  // Temporarily removed all useMemo hooks
  const isFormCompletelyValid = true; // Simple variable instead of useMemo

  // MINIMAL COMPONENT CONTENT
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🎯 Debug: ABSOLUTE MINIMUM (3 hooks + 1 useState)
          </h1>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Address:</strong> {address || "Not connected"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Current Step:</strong> {step}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>NFT Name:</strong> Empty (no nftData state)
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Form Valid:</strong>{" "}
              {isFormCompletelyValid ? "✅ Valid" : "❌ Invalid"}
            </p>
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-800 dark:text-green-300 font-medium">
                ✅ Componente con struttura completa ma logica semplificata!
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                Se vedi questo messaggio, useRouter era il problema!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNFTCreatorDebug() {
  return (
    <ErrorBoundary>
      <AdminNFTCreatorDebugContent />
    </ErrorBoundary>
  );
}
