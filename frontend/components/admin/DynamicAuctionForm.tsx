"use client";

import React from "react";
import { AuctionFormData } from "@/hooks/useAuctionValidationModular";

interface DynamicAuctionFormProps {
  onDataChange: (data: any) => void;
  initialData?: any;
}

export default function DynamicAuctionForm({
  onDataChange,
  initialData,
}: DynamicAuctionFormProps) {
  // TEMPORARY DISABLED: This component uses the old complex modular system
  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        ⚠️ DynamicAuctionForm - Temporarily Disabled
      </h3>
      <p className="text-yellow-700 mb-4">
        This component uses the old complex modular validation system that was
        causing React hooks errors. It will be rebuilt with the new simplified
        approach.
      </p>
      <div className="text-sm text-yellow-600 bg-yellow-100 rounded p-3">
        <p>
          <strong>Reason:</strong> Uses removed functions: getAuctionTypeInfo,
          getFieldErrors, getFieldWarnings, validation object
        </p>
        <p>
          <strong>Status:</strong> Will be rebuilt after the core system is
          stable
        </p>
        <p>
          <strong>Alternative:</strong> Use AdminNFTCreatorUltraSimple for now
        </p>
      </div>
    </div>
  );
}
