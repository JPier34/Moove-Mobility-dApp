"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
        min: 0.000001, // Positive values for Dutch auctions (price decrease rate)
        max: 0.1, // Maximum decrease rate (10% of start price)
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
  [AuctionType.TRADITIONAL]: {
    name: "Traditional Auction",
    description: "Classic auction format",
    requiredFields: ["startPrice", "duration", "bidIncrement"],
    optionalFields: ["reservePrice", "buyNowPrice"],
    priceRules: {
      startPrice: { min: 0.000001, max: 1000, required: true },
      reservePrice: {
        min: 0.000001,
        max: 1000,
        required: false,
        mustBeGreaterThan: "startPrice",
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
    errors.push({
      field,
      message: `${field} must be at least ${rules.min} ETH`,
      severity: "error",
    });
  }

  // Check maximum value
  if (numValue > rules.max) {
    errors.push({
      field,
      message: `${field} cannot exceed ${rules.max} ETH`,
      severity: "error",
    });
  }

  // Special validation for Dutch auction bidIncrement (must be positive)
  if (field === "bidIncrement" && formData.auctionType === AuctionType.DUTCH) {
    if (numValue <= 0) {
      errors.push({
        field,
        message:
          "Price decrease rate must be positive for Dutch auctions (how much price decreases per time unit)",
        severity: "error",
      });
    } else {
      // Validate that the decrease rate is reasonable for 20-minute intervals
      const startPrice = parseFloat(formData.startPrice);
      const reservePrice = parseFloat(formData.reservePrice || "0");
      const duration = parseInt(formData.duration);
      const durationUnit = formData.durationUnit;

      if (startPrice > 0 && reservePrice > 0 && duration > 0) {
        const durationInSeconds =
          durationUnit === "minutes" ? duration * 60 : duration * 3600;
        const intervals20min = Math.floor(durationInSeconds / 1200); // 1200 seconds = 20 minutes
        const totalDecrease = startPrice - reservePrice;
        const optimalRate =
          intervals20min > 0 ? totalDecrease / intervals20min : totalDecrease;

        // Check if the rate is too high (more than 50% of optimal) or too low (less than 10% of optimal)
        if (numValue > optimalRate * 0.5) {
          errors.push({
            field,
            message: `Price decrease rate seems too high. Suggested rate for 20-minute intervals: ${optimalRate.toFixed(
              6
            )} ETH`,
            severity: "warning",
          });
        } else if (numValue < optimalRate * 0.1) {
          errors.push({
            field,
            message: `Price decrease rate seems too low. Suggested rate for 20-minute intervals: ${optimalRate.toFixed(
              6
            )} ETH`,
            severity: "warning",
          });
        }
      }
    }
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

  return {
    isValid: errors.length === 0,
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

  // Set default values for Dutch auctions on mount
  useEffect(() => {
    if (formData.auctionType === AuctionType.DUTCH) {
      // Check if we need to set default values
      const needsDefaults =
        !formData.buyNowPrice ||
        !formData.reservePrice ||
        formData.buyNowPrice.trim() === "" ||
        formData.reservePrice.trim() === "" ||
        isNaN(parseFloat(formData.buyNowPrice)) ||
        isNaN(parseFloat(formData.reservePrice)) ||
        parseFloat(formData.buyNowPrice) === 0 ||
        parseFloat(formData.reservePrice) === 0;

      if (needsDefaults) {
        setFormData((prev) => ({
          ...prev,
          startPrice: prev.startPrice || "0.01",
          buyNowPrice: "", // No fixed buy now price for Dutch auctions
          reservePrice: prev.reservePrice || "0.001",
          bidIncrement: prev.bidIncrement || "0.003", // Price decreases by 0.003 ETH every 20 minutes
        }));
      }
    }
  }, [formData.auctionType]);

  const updateField = useCallback(
    (field: keyof AuctionFormData, value: string | AuctionType) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        // Set appropriate default values when switching to Dutch auction
        if (field === "auctionType" && value === AuctionType.DUTCH) {
          newData.startPrice = "0.01";
          newData.buyNowPrice = ""; // No fixed buy now price for Dutch auctions
          newData.reservePrice = "0.001";
          newData.bidIncrement = "0.003"; // Price decreases by 0.003 ETH every 20 minutes
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
