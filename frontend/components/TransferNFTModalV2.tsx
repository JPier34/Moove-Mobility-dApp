"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WonAuction } from "@/types/user";
import { useNFTTransfer } from "@/hooks/useNFTTransfer";
import { useNFTTransferNotifications } from "@/providers/NFTTransferNotificationsProvider";
import Button from "./ui/Button";
import { toast } from "react-hot-toast";
import { nftEvents } from "@/utils/nftEvents";
import { ArrowRight, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface TransferNFTModalV2Props {
  nft: WonAuction | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransferNFTModalV2({
  nft,
  isOpen,
  onClose,
  onSuccess,
}: TransferNFTModalV2Props) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Rimossa showConfirmation - ora gestita dal provider

  const {
    transferNFT,
    validateRecipientAddress,
    transferState,
    resetTransferState,
    isPending,
    isSuccess,
    error,
    isTransferring,
  } = useNFTTransfer();

  const {
    startTransfer,
    confirmTransfer,
    cancelTransfer,
    isTransferring: isSystemTransferring,
  } = useNFTTransferNotifications();

  // Reset form quando il modal si apre/chiude
  useEffect(() => {
    if (isOpen) {
      setRecipientAddress("");
      setValidationError(null);
      resetTransferState();
    }
  }, [isOpen, resetTransferState]);

  // Gestione successo trasferimento
  useEffect(() => {
    if (isSuccess && transferState.transactionHash && nft) {
      console.log(`🎉 NFT transfer successful: ${nft.nftId}`);

      // Close modal and let the success modal handle the reload
      onSuccess?.();
      onClose();
      // NO automatic reload here - handled by success modal
    }
  }, [
    isSuccess,
    transferState.transactionHash,
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

  // Funzioni rimosse - ora gestite direttamente dal provider

  if (!nft) return null;

  const isAddressValid =
    recipientAddress.length > 0 && !validationError && !isValidating;
  const canProceed = isAddressValid && !isPending && !isTransferring;
  const isProcessing = isPending || isTransferring || isSystemTransferring;

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
                disabled={isProcessing}
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
                </div>
              </div>

              {/* Processing State */}
              {isProcessing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Processing Transfer
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Please wait while we process your NFT transfer...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isProcessing ? (
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
                        disabled={isProcessing}
                      />
                      <button
                        type="button"
                        onClick={handlePasteAddress}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={isProcessing}
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
              ) : null}

              {/* Actions */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  {!isProcessing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isProcessing}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (!nft || !recipientAddress) return;
                          startTransfer(nft.nftId, recipientAddress);
                          onClose(); // Close this modal, the confirmation modal will open via provider
                        }}
                        disabled={!canProceed}
                        className="flex-1"
                      >
                        Transfer NFT
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                      disabled={true}
                    >
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </Button>
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
