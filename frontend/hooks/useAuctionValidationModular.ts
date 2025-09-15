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
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

// Default form data
const DEFAULT_FORM_DATA: AuctionFormData = {
  auctionType: AuctionType.ENGLISH,
  startPrice: "",
  duration: "",
  durationUnit: "hours",
  bidIncrement: "",
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
    return { isValid: true, error: null };
  }, [formData]);

  // Simple validation check
  const isValid = formData.startPrice !== "" && formData.duration !== "";

  return {
    formData,
    isValid,
    updateField,
    validateForTransaction,
  };
}
