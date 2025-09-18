"use client";

import React from "react";
import { useAccount } from "wagmi";
import { useUserRoles } from "@/hooks/useContract";
import { ErrorBoundary, useLastError } from "./ErrorBoundary";
import { useSecureNFTAuctionFlow } from "@/hooks/useSecureNFTAuction";
import { useRouter } from "next/navigation";
import { useIPFSUnified } from "@/hooks/useIPFSUnified";
import { useNFTValidationAPI } from "@/hooks/useNFTValidationAPI";
// Re-enabled modular hooks imports with simple, safe implementation
import { useAuctionValidationModular } from "@/hooks/useAuctionValidationModular";
import { useAuctionFormValidation } from "@/hooks/useAuctionFormValidation";

function AdminNFTCreatorMinimalContent() {
  const { address } = useAccount();
  const { canMint, isMasterAdmin, isLoading } = useUserRoles(address);
  const { error: lastError, clearError } = useLastError();

  // ALL EARLY RETURNS BEFORE ANY OTHER HOOKS
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

  // TEST: Adding multiple hooks
  const {
    executeFlow: executeSecureFlow,
    isProcessing: isSecureProcessing,
    currentPhase: securePhase,
    result: secureResult,
    error: secureError,
  } = useSecureNFTAuctionFlow();

  const router = useRouter();
  const {
    uploadNFT,
    isUploading: isUploadingToIPFS,
    uploadProgress,
  } = useIPFSUnified();
  const { validateNFT, isValidating: isValidatingNFT } = useNFTValidationAPI();
  const { isConnected } = useAccount();

  // RE-ENABLED: Simple, safe modular hooks
  const {
    formData: auctionFormData,
    isValid: isAuctionValid,
    updateField,
    validateForTransaction,
  } = useAuctionValidationModular();

  const { areRequiredFieldsFilled, getValidationSummary } =
    useAuctionFormValidation(auctionFormData);

  // NFT Form Data State (ADDED FOR FUNCTIONALITY)
  const [nftData, setNftData] = React.useState({
    name: "",
    description: "",
    rarity: "COMMON" as const,
    image: null as File | null,
  });

  // Step management
  const [step, setStep] = React.useState<"nft" | "auction">("nft");

  // MINIMAL COMPONENT CONTENT
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🎯 Debug: Test MODULAR HOOKS (Suspected Culprits!)
          </h1>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Address:</strong> {address || "Not connected"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Can Mint:</strong> {canMint ? "✅ Yes" : "❌ No"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Is Master Admin:</strong>{" "}
              {isMasterAdmin ? "✅ Yes" : "❌ No"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Has Admin Access:</strong>{" "}
              {hasAdminAccess ? "✅ Yes" : "❌ No"}
            </p>
            <hr className="my-4" />
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Secure Processing:</strong>{" "}
              {isSecureProcessing ? "🔄 Processing" : "⭕ Idle"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Current Phase:</strong> {securePhase || "None"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Secure Result:</strong>{" "}
              {secureResult ? "✅ Success" : "❌ None"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Secure Error:</strong> {secureError || "None"}
            </p>
            <hr className="my-4" />
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Is Connected (Wallet):</strong>{" "}
              {isConnected ? "✅ Yes" : "❌ No"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>IPFS Uploading:</strong>{" "}
              {isUploadingToIPFS ? "🔄 Uploading" : "⭕ Idle"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Upload Progress:</strong> {uploadProgress || "0"}%
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>NFT Validating:</strong>{" "}
              {isValidatingNFT ? "🔄 Validating" : "⭕ Idle"}
            </p>
            <hr className="my-4" />
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Auction Valid:</strong>{" "}
              {isAuctionValid ? "✅ Valid" : "❌ Invalid"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Required Fields Filled:</strong>{" "}
              {areRequiredFieldsFilled ? "✅ Yes" : "❌ No"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Auction Type:</strong>{" "}
              {auctionFormData?.auctionType || "ENGLISH"}
            </p>
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-800 dark:text-green-300 font-medium">
                ✅ Componente caricato correttamente senza errori di hooks!
              </p>
              <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                Se vedi questo messaggio, i nuovi files modulari semplificati
                funzionano!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNFTCreatorMinimal() {
  return (
    <ErrorBoundary>
      <AdminNFTCreatorMinimalContent />
    </ErrorBoundary>
  );
}
