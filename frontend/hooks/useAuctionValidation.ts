"use client";

import { useState, useCallback, useMemo } from "react";
import { AuctionType } from "@/types/auction";
import { ethers } from "ethers";

// ============================================================================
// AUCTION VALIDATION TYPES
// ============================================================================

export interface AuctionFormData {
  auctionType: AuctionType;
  startPrice: string;
  reservePrice: string;
  buyNowPrice: string;
  duration: string;
  durationUnit: "minutes" | "hours";
  bidIncrement: string;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  data?: AuctionFormData;
}

// ============================================================================
// AUCTION TYPE SPECIFIC VALIDATION RULES
// ============================================================================

const AUCTION_TYPE_RULES = {
  [AuctionType.ENGLISH]: {
    name: "English Auction",
    description: "Public auction with ascending bids",
    requiredFields: ["startPrice", "duration", "bidIncrement"],
    optionalFields: ["reservePrice"],
    priceRules: {
      startPrice: { min: 0.000001, max: 1000, required: true },
      reservePrice: {
        min: 0.000001,
        max: 1000,
        required: false,
        mustBeGreaterThan: "startPrice",
      },
      buyNowPrice: { required: false },
    },
    durationRules: {
      min: 3600, // 1 hour in seconds
      max: 30 * 24 * 3600, // 30 days in seconds
    },
  },
  [AuctionType.DUTCH]: {
    name: "Dutch Auction",
    description: "Price decreases over time - users buy at current price",
    requiredFields: ["startPrice", "duration", "bidIncrement"],
    optionalFields: ["reservePrice"],
    priceRules: {
      startPrice: { min: 0.000001, max: 1000, required: true },
      reservePrice: {
        min: 0.000001,
        max: 1000,
        required: false,
        mustBeLessThan: "startPrice",
      },
      bidIncrement: {
        min: 0.0000001, // Very small minimum for price decrease rate
        max: 0.1, // Increased max to allow more flexibility (10% of start price)
        required: true,
      },
    },
    durationRules: {
      min: 3600, // 1 hour in seconds
      max: 30 * 24 * 3600, // 30 days in seconds
    },
  },
  [AuctionType.SEALED_BID]: {
    name: "Sealed Bid Auction",
    description: "Private bids revealed at the end",
    requiredFields: ["startPrice", "duration", "bidIncrement"],
    optionalFields: ["reservePrice"],
    priceRules: {
      startPrice: { min: 0.000001, max: 1000, required: true },
      reservePrice: {
        min: 0.000001,
        max: 1000,
        required: false,
        mustBeGreaterThan: "startPrice",
      },
      buyNowPrice: { required: false },
    },
    durationRules: {
      min: 3600, // 1 hour in seconds
      max: 30 * 24 * 3600, // 30 days in seconds
    },
  },
  [AuctionType.RESERVE]: {
    name: "Reserve Auction",
    description: "Auction with hidden minimum price",
    requiredFields: ["startPrice", "reservePrice", "duration", "bidIncrement"],
    optionalFields: ["buyNowPrice"],
    priceRules: {
      startPrice: { min: 0.000001, max: 1000, required: true },
      reservePrice: {
        min: 0.000001,
        max: 1000,
        required: true, // Reserve price is required for RESERVE auctions
        mustBeGreaterThanOrEqual: "startPrice", // Reserve >= start for RESERVE auctions
      },
      buyNowPrice: {
        min: 0.000001,
        max: 1000,
        required: false,
        mustBeGreaterThan: "startPrice",
      },
    },
    durationRules: {
      min: 3600, // 1 hour in seconds
      max: 30 * 24 * 3600, // 30 days in seconds
    },
  },
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validatePrice(
  value: string,
  field: string,
  rules: any,
  formData: AuctionFormData
): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = parseFloat(value);

  // Check if required
  if (rules.required && (!value || value.trim() === "")) {
    errors.push({
      field,
      message: `${field} is required for ${
        AUCTION_TYPE_RULES[formData.auctionType].name
      }`,
      severity: "error",
    });
    return errors;
  }

  // Skip validation if not required and empty
  if (!rules.required && (!value || value.trim() === "")) {
    return errors;
  }

  // Check if valid number
  if (isNaN(numValue)) {
    errors.push({
      field,
      message: `${field} must be a valid number`,
      severity: "error",
    });
    return errors;
  }

  // Check minimum value
  if (numValue < rules.min) {
    const fieldName =
      field === "bidIncrement" && formData.auctionType === AuctionType.DUTCH
        ? "Price decrease rate"
        : field;
    errors.push({
      field,
      message: `${fieldName} must be at least ${rules.min} ETH`,
      severity: "error",
    });
  }

  // Check maximum value
  if (numValue > rules.max) {
    const fieldName =
      field === "bidIncrement" && formData.auctionType === AuctionType.DUTCH
        ? "Price decrease rate"
        : field;
    errors.push({
      field,
      message: `${fieldName} cannot exceed ${rules.max} ETH`,
      severity: "error",
    });
  }

  // Basic validation for Dutch auction bidIncrement (must be positive)
  if (field === "bidIncrement" && formData.auctionType === AuctionType.DUTCH) {
    if (numValue <= 0) {
      errors.push({
        field,
        message:
          "Price decrease rate must be positive for Dutch auctions (how much price decreases per time unit)",
        severity: "error",
      });
    }
    // Simplified validation - removed complex calculations to improve performance
  }

  // Check relative values
  if (rules.mustBeGreaterThan) {
    const otherValue = parseFloat(
      formData[rules.mustBeGreaterThan as keyof AuctionFormData] as string
    );
    if (!isNaN(otherValue) && numValue <= otherValue) {
      errors.push({
        field,
        message: `${field} must be greater than ${rules.mustBeGreaterThan}`,
        severity: "error",
      });
    }
  }

  if (rules.mustBeGreaterThanOrEqual) {
    const otherValue = parseFloat(
      formData[
        rules.mustBeGreaterThanOrEqual as keyof AuctionFormData
      ] as string
    );
    if (!isNaN(otherValue) && numValue < otherValue) {
      errors.push({
        field,
        message: `${field} must be greater than or equal to ${rules.mustBeGreaterThanOrEqual}`,
        severity: "error",
      });
    }
  }

  if (rules.mustBeLessThan) {
    const otherValue = parseFloat(
      formData[rules.mustBeLessThan as keyof AuctionFormData] as string
    );
    if (!isNaN(otherValue) && numValue >= otherValue) {
      errors.push({
        field,
        message: `${field} must be less than ${rules.mustBeLessThan}`,
        severity: "error",
      });
    }
  }

  return errors;
}

function validateDuration(
  duration: string,
  durationUnit: "minutes" | "hours",
  rules: any
): ValidationError[] {
  const errors: ValidationError[] = [];
  const numDuration = parseInt(duration);

  if (isNaN(numDuration) || numDuration <= 0) {
    errors.push({
      field: "duration",
      message: "Duration must be a valid positive number",
      severity: "error",
    });
    return errors;
  }

  // Convert to seconds
  const durationInSeconds =
    durationUnit === "minutes" ? numDuration * 60 : numDuration * 3600;

  if (durationInSeconds < rules.min) {
    errors.push({
      field: "duration",
      message: `Duration must be at least ${rules.min / 3600} hours`,
      severity: "error",
    });
  }

  if (durationInSeconds > rules.max) {
    errors.push({
      field: "duration",
      message: `Duration cannot exceed ${rules.max / 3600} hours`,
      severity: "error",
    });
  }

  return errors;
}

function validateBidIncrement(
  value: string,
  startPrice: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const numValue = parseFloat(value);
  const numStartPrice = parseFloat(startPrice);

  if (isNaN(numValue) || numValue <= 0) {
    errors.push({
      field: "bidIncrement",
      message: "Bid increment must be greater than 0",
      severity: "error",
    });
    return errors;
  }

  if (!isNaN(numStartPrice) && numValue > numStartPrice) {
    errors.push({
      field: "bidIncrement",
      message: "Bid increment cannot exceed start price",
      severity: "error",
    });
  }

  return errors;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export function validateAuctionForm(
  formData: AuctionFormData
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const rules = AUCTION_TYPE_RULES[formData.auctionType];
  if (!rules) {
    errors.push({
      field: "auctionType",
      message: "Invalid auction type",
      severity: "error",
    });
    return { isValid: false, errors, warnings };
  }

  // Validate prices
  Object.entries(rules.priceRules).forEach(([field, fieldRules]) => {
    const value = formData[field as keyof AuctionFormData] as string;
    const fieldErrors = validatePrice(value, field, fieldRules, formData);
    errors.push(...fieldErrors);
  });

  // Validate duration
  const durationErrors = validateDuration(
    formData.duration,
    formData.durationUnit,
    rules.durationRules
  );
  errors.push(...durationErrors);

  // Validate bid increment
  const bidIncrementErrors = validateBidIncrement(
    formData.bidIncrement,
    formData.startPrice
  );
  errors.push(...bidIncrementErrors);

  // Add warnings for potential issues
  if (formData.auctionType === AuctionType.DUTCH) {
    const startPrice = parseFloat(formData.startPrice);
    const buyNowPrice = parseFloat(formData.buyNowPrice);
    if (!isNaN(startPrice) && !isNaN(buyNowPrice)) {
      const discount = ((startPrice - buyNowPrice) / startPrice) * 100;
      if (discount < 1) {
        warnings.push({
          field: "buyNowPrice",
          message:
            "Discount is very small (less than 1%). Consider a larger price difference.",
          severity: "warning",
        });
      }
    }
  }

  // Only count real errors (exclude info messages) for validation
  const realErrors = errors.filter(
    (error) => error.severity === "error" || error.severity === "warning"
  );

  return {
    isValid: realErrors.length === 0,
    errors,
    warnings,
    data: formData,
  };
}

// ============================================================================
// REACT HOOK
// ============================================================================

export function useAuctionValidation() {
  const [formData, setFormData] = useState<AuctionFormData>({
    auctionType: AuctionType.ENGLISH,
    startPrice: "0.001",
    reservePrice: "",
    buyNowPrice: "",
    duration: "1",
    durationUnit: "hours",
    bidIncrement: "0.001",
  });

  const validation = useMemo(() => {
    return validateAuctionForm(formData);
  }, [formData]);

  // Default values are set in updateField when switching auction types

  const updateField = useCallback(
    (field: keyof AuctionFormData, value: string | AuctionType) => {
      setFormData((prev) => {
        // Skip update if value hasn't changed
        if (prev[field] === value) {
          return prev;
        }

        const newData = { ...prev, [field]: value };

        // Set appropriate default values when switching auction types
        if (field === "auctionType") {
          switch (value) {
            case AuctionType.DUTCH:
              newData.startPrice = "0.01";
              newData.reservePrice = "0.001";
              newData.buyNowPrice = "0.001"; // For Dutch auctions, buyNowPrice = reservePrice (final price)
              newData.bidIncrement = "0.001"; // Price decreases by 0.001 ETH every 20 minutes (more reasonable)
              break;
            case AuctionType.ENGLISH:
              newData.startPrice = "0.001";
              newData.buyNowPrice = "0.01";
              newData.reservePrice = "";
              newData.bidIncrement = "0.001";
              break;
            case AuctionType.SEALED_BID:
              newData.startPrice = "0.001";
              newData.buyNowPrice = "";
              newData.reservePrice = "";
              newData.bidIncrement = "0.001";
              break;
            case AuctionType.RESERVE:
              newData.startPrice = "0.001";
              newData.buyNowPrice = "0.01";
              newData.reservePrice = "0.005"; // Reserve price required for RESERVE auctions
              newData.bidIncrement = "0.001";
              break;
          }
        }

        // For Dutch auctions, automatically sync buyNowPrice with reservePrice
        if (
          field === "reservePrice" &&
          newData.auctionType === AuctionType.DUTCH
        ) {
          newData.buyNowPrice = value as string;
        }

        return newData;
      });
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      auctionType: AuctionType.ENGLISH,
      startPrice: "0.001",
      reservePrice: "",
      buyNowPrice: "",
      duration: "1",
      durationUnit: "hours",
      bidIncrement: "0.001",
    });
  }, []);

  const getFieldErrors = useCallback(
    (field: string) => {
      return validation.errors.filter((error) => error.field === field);
    },
    [validation.errors]
  );

  const getFieldWarnings = useCallback(
    (field: string) => {
      return validation.warnings.filter((warning) => warning.field === field);
    },
    [validation.warnings]
  );

  const getAuctionTypeInfo = useCallback((auctionType: AuctionType) => {
    return AUCTION_TYPE_RULES[auctionType] || null;
  }, []);

  return {
    formData,
    validation,
    updateField,
    resetForm,
    getFieldErrors,
    getFieldWarnings,
    getAuctionTypeInfo,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}

// ============================================================================
// PRE-TRANSACTION VALIDATION
// ============================================================================

export async function validateBeforeTransaction(
  formData: AuctionFormData,
  address: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // 1. Validate form data
    const validation = validateAuctionForm(formData);
    if (!validation.isValid) {
      return {
        isValid: false,
        error: `Form validation failed: ${validation.errors[0].message}`,
      };
    }

    // 2. Check wallet connection
    if (!address) {
      return {
        isValid: false,
        error: "Wallet not connected",
      };
    }

    // 3. Check if we're in a browser environment
    if (typeof window === "undefined" || !window.ethereum) {
      return {
        isValid: false,
        error: "Ethereum provider not available",
      };
    }

    // 4. Estimate gas (optional, can be added later)
    // const provider = new ethers.BrowserProvider(window.ethereum);
    // const gasEstimate = await estimateGasForAuctionCreation(formData);

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getAuctionTypeDisplayName(auctionType: AuctionType): string {
  return AUCTION_TYPE_RULES[auctionType]?.name || "Unknown";
}

export function getAuctionTypeDescription(auctionType: AuctionType): string {
  return AUCTION_TYPE_RULES[auctionType]?.description || "";
}

export function isFieldRequired(
  field: string,
  auctionType: AuctionType
): boolean {
  const rules = AUCTION_TYPE_RULES[auctionType];
  if (!rules) return false;

  return rules.requiredFields.includes(field);
}

export function isFieldOptional(
  field: string,
  auctionType: AuctionType
): boolean {
  const rules = AUCTION_TYPE_RULES[auctionType];
  if (!rules) return false;

  return rules.optionalFields.includes(field);
}

export function shouldShowField(
  field: string,
  auctionType: AuctionType
): boolean {
  return (
    isFieldRequired(field, auctionType) || isFieldOptional(field, auctionType)
  );
}
