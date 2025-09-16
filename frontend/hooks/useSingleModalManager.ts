"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WonAuction } from "@/hooks/useWonAuctions";

interface ModalState {
  isOpen: boolean;
  currentAuction: WonAuction | null;
  queue: WonAuction[];
  isProcessing: boolean;
  transactionHash: string | null;
  isWaitingForConfirmation: boolean;
}

export function useSingleModalManager(unsettledAuctions: WonAuction[]) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    currentAuction: null,
    queue: [],
    isProcessing: false,
    transactionHash: null,
    isWaitingForConfirmation: false,
  });

  // Use ref to track the last processed auctions to avoid loops
  const lastProcessedAuctionsRef = useRef<WonAuction[]>([]);
  const lastProcessedLengthRef = useRef(0);

  // DISABLED: Update modal queue only when length changes
  // This was causing infinite loops due to unsettledAuctions changing continuously
  useEffect(() => {
    // PERMANENTLY DISABLED TO FIX INFINITE LOOP
    // The useSingleModalManager is causing infinite re-renders
    // We'll use the simpler modal management from useWonAuctionsManager instead
    return;

    // Skip if length hasn't changed
    if (unsettledAuctions.length === lastProcessedLengthRef.current) {
      return;
    }

    lastProcessedLengthRef.current = unsettledAuctions.length;

    if (unsettledAuctions.length > 0) {
      console.log(
        "🎯 Updating modal queue with",
        unsettledAuctions.length,
        "auctions"
      );

      setModalState((prev) => {
        // If no modal is open AND not processing, open the first one
        if (
          !prev.isOpen &&
          !prev.isProcessing &&
          !prev.isWaitingForConfirmation
        ) {
          const [firstAuction, ...remainingAuctions] = unsettledAuctions;
          console.log(
            "🎯 Opening first modal for auction:",
            firstAuction.auctionId
          );

          return {
            isOpen: true,
            currentAuction: firstAuction,
            queue: remainingAuctions,
            isProcessing: false,
            transactionHash: null,
            isWaitingForConfirmation: false,
          };
        }

        // If modal is open, update only the queue
        if (prev.isOpen) {
          return {
            ...prev,
            queue: unsettledAuctions.filter(
              (a) => a.auctionId !== prev.currentAuction?.auctionId
            ),
          };
        }

        // If processing, don't change anything
        return prev;
      });
    } else {
      // No unsettled auction, close everything only if not processing
      setModalState((prev) => {
        if (prev.isProcessing || prev.isWaitingForConfirmation) {
          return prev; // Don't close during processing
        }

        return {
          isOpen: false,
          currentAuction: null,
          queue: [],
          isProcessing: false,
          transactionHash: null,
          isWaitingForConfirmation: false,
        };
      });
    }
  }, []); // Empty dependency array to prevent loops

  const closeModal = useCallback(() => {
    console.log("🎯 Closing current modal");

    setModalState((prev) => {
      if (prev.queue.length > 0) {
        // There is another auction in the queue, open that one
        const [nextAuction, ...remainingQueue] = prev.queue;
        console.log(
          "🎯 Opening next modal for auction:",
          nextAuction.auctionId
        );

        return {
          isOpen: true,
          currentAuction: nextAuction,
          queue: remainingQueue,
          isProcessing: false,
          transactionHash: null,
          isWaitingForConfirmation: false,
        };
      } else {
        // No auction in queue, close everything
        return {
          isOpen: false,
          currentAuction: null,
          queue: [],
          isProcessing: false,
          transactionHash: null,
          isWaitingForConfirmation: false,
        };
      }
    });
  }, []);

  const startProcessing = useCallback(() => {
    console.log("🎯 Starting settlement process");
    setModalState((prev) => ({
      ...prev,
      isProcessing: true,
      isWaitingForConfirmation: false,
      transactionHash: null,
    }));
  }, []);

  const setTransactionHash = useCallback((txHash: string) => {
    console.log("🎯 Transaction submitted:", txHash);
    setModalState((prev) => ({
      ...prev,
      transactionHash: txHash,
      isWaitingForConfirmation: true,
    }));
  }, []);

  const confirmTransaction = useCallback(() => {
    console.log("🎯 Transaction confirmed!");
    setModalState((prev) => ({
      ...prev,
      isWaitingForConfirmation: false,
    }));
  }, []);

  const finishProcessing = useCallback(() => {
    console.log("🎯 Settlement process completed");
    setModalState((prev) => ({
      ...prev,
      isProcessing: false,
    }));

    // Close the current modal and pass to the next one
    setTimeout(() => {
      closeModal();
    }, 1000); // Wait 1 second to show the success
  }, [closeModal]);

  return {
    isOpen: modalState.isOpen,
    currentAuction: modalState.currentAuction,
    isProcessing: modalState.isProcessing,
    queueLength: modalState.queue.length,
    transactionHash: modalState.transactionHash,
    isWaitingForConfirmation: modalState.isWaitingForConfirmation,
    closeModal,
    startProcessing,
    finishProcessing,
    setTransactionHash,
    confirmTransaction,
  };
}
