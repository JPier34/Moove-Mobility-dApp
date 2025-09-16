"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WonAuction } from "@/types/user";
import { useNFTTransfer } from "@/hooks/useNFTTransfer";
import Button from "./ui/Button";
import { toast } from "react-hot-toast";

interface TransferNFTModalProps {
  nft: WonAuction | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransferNFTModal({
  nft,
  isOpen,
  onClose,
  onSuccess,
}: TransferNFTModalProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    transferNFT,
    validateRecipientAddress,
    transferState,
    resetTransferState,
    isPending,
    isSuccess,
    error,
  } = useNFTTransfer();

  // Reset form quando il modal si apre/chiude
  useEffect(() => {
    if (isOpen) {
      setRecipientAddress("");
      setValidationError(null);
      setShowConfirmation(false);
      resetTransferState();
    }
  }, [isOpen, resetTransferState]);

  // Gestione successo trasferimento
  useEffect(() => {
    if (isSuccess && transferState.transactionHash) {
      toast.success("NFT transferred successfully!", {
        duration: 5000,
      });

      // Notifica al destinatario (placeholder)
      console.log(
        `📧 Notification sent to ${recipientAddress}: You received NFT ${nft?.nftId}`
      );

      onSuccess?.();
      onClose();
    }
  }, [
    isSuccess,
    transferState.transactionHash,
    recipientAddress,
    nft?.nftId,
    onSuccess,
    onClose,
  ]);

  // Gestione errori
  useEffect(() => {
    if (error) {
      toast.error(`Transfer failed: ${error}`, {
        duration: 5000,
      });
    }
  }, [error]);

  // Validazione real-time dell'indirizzo
  const handleAddressChange = async (address: string) => {
    setRecipientAddress(address);
    setValidationError(null);

    if (address.length === 0) {
      return;
    }

    setIsValidating(true);
    try {
      const validation = await validateRecipientAddress(address);
      if (!validation.isValid) {
        setValidationError(validation.error || "Invalid address");
      }
    } catch (error) {
      setValidationError("Failed to validate address");
    } finally {
      setIsValidating(false);
    }
  };

  // Copia indirizzo negli appunti
  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleAddressChange(text);
      }
    } catch (error) {
      toast.error("Failed to paste from clipboard");
    }
  };

  // Conferma trasferimento
  const handleConfirmTransfer = async () => {
    if (!nft || !recipientAddress) return;

    try {
      await transferNFT(nft.nftId, recipientAddress);
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

  // Annulla trasferimento
  const handleCancel = () => {
    setShowConfirmation(false);
    setRecipientAddress("");
    setValidationError(null);
    resetTransferState();
  };

  // Debug ownership
  const handleDebugOwnership = async () => {
    if (!nft) return;

    try {
      console.log("🔍 Debug ownership check for token:", nft.nftId);
      console.log("🔍 NFT data:", nft);

      // Verifica ownership senza trasferire
      const validation = await validateRecipientAddress(
        "0x1234567890123456789012345678901234567890"
      );
      console.log("🔍 Address validation result:", validation);

      // Log dei parametri che verrebbero usati
      console.log("🔍 Would transfer with params:", {
        tokenId: nft.nftId,
        from: "current_user",
        to: "recipient_address",
      });

      // Mostra un toast con le informazioni di debug
      toast(
        `Debug: Token ${nft.nftId} ownership check completed. Check console for details.`,
        {
          duration: 5000,
          icon: "🔍",
        }
      );
    } catch (error) {
      console.error("Debug error:", error);
      toast.error("Debug failed. Check console for details.");
    }
  };

  if (!nft) return null;

  const isAddressValid =
    recipientAddress.length > 0 && !validationError && !isValidating;
  const canProceed = isAddressValid && !isPending;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Transfer NFT
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={isPending}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* NFT Preview */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img
                  src={nft.nftImage || "/images/default-nft.svg"}
                  alt={nft.nftName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {nft.nftName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Token ID: {nft.nftId}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Category: {nft.category}
                  </p>
                </div>
              </div>

              {!showConfirmation ? (
                /* Transfer Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recipient Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        placeholder="0x..."
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          validationError
                            ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                            : isValidating
                            ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
                            : isAddressValid
                            ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                            : "border-gray-300 dark:border-gray-600"
                        } dark:bg-gray-700 dark:text-white`}
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        onClick={handlePasteAddress}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={isPending}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Validation Status */}
                    {isValidating && (
                      <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                        Validating address...
                      </p>
                    )}
                    {validationError && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {validationError}
                      </p>
                    )}
                    {isAddressValid && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        ✓ Valid address
                      </p>
                    )}
                  </div>

                  {/* Warning */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex">
                      <svg
                        className="w-5 h-5 text-yellow-400 mt-0.5 mr-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Important
                        </h3>
                        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                          This action cannot be undone. Make sure the recipient
                          address is correct.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Confirmation */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900">
                      <svg
                        className="h-6 w-6 text-purple-600 dark:text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      Confirm Transfer
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Are you sure you want to transfer this NFT?
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        NFT:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {nft.nftName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        To:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                        {recipientAddress.slice(0, 6)}...
                        {recipientAddress.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {/* Debug button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleDebugOwnership}
                    className="px-4 py-2 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
                    disabled={isPending}
                  >
                    🔍 Debug Ownership
                  </button>
                </div>

                <div className="flex space-x-3">
                  {!showConfirmation ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setShowConfirmation(true)}
                        disabled={!canProceed}
                        className="flex-1"
                      >
                        Continue
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="flex-1"
                        disabled={isPending}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleConfirmTransfer}
                        disabled={isPending}
                        className="flex-1"
                      >
                        {isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Transferring...
                          </>
                        ) : (
                          "Confirm Transfer"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
