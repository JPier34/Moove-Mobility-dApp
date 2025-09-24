"use client";

import { useState, useCallback } from "react";
import { AuctionType } from "@/types/auction";

// ============================================================================
// SIMPLE MODULAR VALIDATION (NO COMPLEX HOOKS)
// ============================================================================

export interface AuctionFormData {
  auctionType: AuctionType;
  startPrice: string;
  duration: string;
  durationUnit: "minutes" | "hours";
  bidIncrement: string;
  reservePrice: string;
  buyNowPrice: string;
  // English auction extension settings
  extensionThresholdMinutes: string;
  extensionDurationMinutes: string;
  // Test mode
  testMode?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

// Default form data
const DEFAULT_FORM_DATA: AuctionFormData = {
  auctionType: AuctionType.ENGLISH,
  startPrice: "0.001", // Default start price
  duration: "24", // Default to 24 hours
  durationUnit: "hours",
  bidIncrement: "0.001", // Default bid increment
  reservePrice: "",
  buyNowPrice: "",
  // English auction extension defaults
  extensionThresholdMinutes: "5",
  extensionDurationMinutes: "10",
};

export function useAuctionValidationModular() {
  const [formData, setFormData] = useState<AuctionFormData>(DEFAULT_FORM_DATA);

  const updateField = useCallback(
    (field: keyof AuctionFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const validateForTransaction = useCallback((): ValidationResult => {
    // Simple validation
    if (!formData.startPrice || !formData.duration) {
      return { isValid: false, error: "Missing required fields" };
    }

    // Validate start price is a positive number
    const startPriceNum = parseFloat(formData.startPrice);
    if (isNaN(startPriceNum) || startPriceNum <= 0) {
      return { isValid: false, error: "Start price must be a positive number" };
    }

    // Validate duration is a positive number
    const durationNum = parseInt(formData.duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return { isValid: false, error: "Duration must be a positive number" };
    }

    // Validate bid increment for English and Reserve auctions only
    if (
      formData.auctionType === AuctionType.ENGLISH ||
      formData.auctionType === AuctionType.RESERVE
    ) {
      if (!formData.bidIncrement) {
        return { isValid: false, error: "Bid increment is required" };
      }
      const bidIncrementNum = parseFloat(formData.bidIncrement);
      if (isNaN(bidIncrementNum) || bidIncrementNum <= 0) {
        return {
          isValid: false,
          error: "Bid increment must be a positive number",
        };
      }
    }

    return { isValid: true, error: null };
  }, [formData]);

  // Simple validation check
  const isValid =
    formData.startPrice !== "" &&
    formData.duration !== "" &&
    (formData.auctionType === AuctionType.SEALED_BID ||
      formData.auctionType === AuctionType.DUTCH ||
      formData.bidIncrement !== "");

  return {
    formData,
    isValid,
    updateField,
    validateForTransaction,
  };
}
