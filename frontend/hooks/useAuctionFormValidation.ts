"use client";

import { useMemo } from "react";
import { AuctionType } from "@/types/auction";
import { AuctionFormData } from "./useAuctionValidationModular";

// ============================================================================
// SIMPLE FORM VALIDATION (NO COMPLEX LOGIC)
// ============================================================================

export function useAuctionFormValidation(auctionFormData: AuctionFormData) {
  // Simple check for required fields
  const areRequiredFieldsFilled = useMemo(() => {
    return auctionFormData.startPrice !== "" && auctionFormData.duration !== "";
  }, [auctionFormData.startPrice, auctionFormData.duration]);

  const getValidationSummary = useMemo(() => {
    return {
      requiredFields: ["startPrice", "duration"],
      optionalFields: ["reservePrice", "buyNowPrice"],
      filledFields: Object.keys(auctionFormData).filter(
        (key) => auctionFormData[key as keyof AuctionFormData] !== ""
      ),
      missingFields: ["startPrice", "duration"].filter(
        (field) => auctionFormData[field as keyof AuctionFormData] === ""
      ),
    };
  }, [auctionFormData]);

  return {
    areRequiredFieldsFilled,
    getValidationSummary,
  };
}






































