"use client";

import React from "react";
import { motion } from "framer-motion";
import { AuctionType } from "@/types/auction";
import { useAuctionValidation } from "@/hooks/useAuctionValidation";

interface DynamicAuctionFormProps {
  onDataChange: (data: any) => void;
  initialData?: any;
}

export default function DynamicAuctionForm({
  onDataChange,
  initialData,
}: DynamicAuctionFormProps) {
  const {
    formData,
    validation,
    updateField,
    getFieldErrors,
    getFieldWarnings,
    getAuctionTypeInfo,
    isValid,
  } = useAuctionValidation();

  // Update parent component when data changes
  React.useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  // Initialize with provided data
  React.useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        if (key in formData) {
          updateField(
            key as keyof typeof formData,
            value as string | AuctionType
          );
        }
      });
    }
  }, [initialData, updateField]);

  const auctionTypeInfo = getAuctionTypeInfo(formData.auctionType);

  const renderField = (
    field: string,
    label: string,
    type: "text" | "number" | "select",
    options?: { value: string; label: string }[]
  ) => {
    const errors = getFieldErrors(field);
    const warnings = getFieldWarnings(field);
    const isRequired = auctionTypeInfo?.requiredFields.includes(field) || false;
    const shouldShow =
      field === "auctionType" || // Always show auction type selection
      auctionTypeInfo?.requiredFields.includes(field) ||
      auctionTypeInfo?.optionalFields.includes(field) ||
      false;

    if (!shouldShow) return null;

    return (
      <div key={field} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>

        {type === "select" ? (
          <select
            value={formData[field as keyof typeof formData] as string}
            onChange={(e) =>
              updateField(field as keyof typeof formData, e.target.value)
            }
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.length > 0
                ? "border-red-500 focus:border-red-500"
                : warnings.length > 0
                ? "border-yellow-500 focus:border-yellow-500"
                : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
            }`}
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            step={type === "number" ? "0.000001" : undefined}
            min={type === "number" ? "0.000001" : undefined}
            max={type === "number" ? "1000" : undefined}
            value={formData[field as keyof typeof formData] as string}
            onChange={(e) =>
              updateField(field as keyof typeof formData, e.target.value)
            }
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.length > 0
                ? "border-red-500 focus:border-red-500"
                : warnings.length > 0
                ? "border-yellow-500 focus:border-yellow-500"
                : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
            }`}
            placeholder={type === "number" ? "0.000001" : ""}
          />
        )}

        {/* Error Messages */}
        {errors.map((error, index) => (
          <p key={index} className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        ))}

        {/* Warning Messages */}
        {warnings.map((warning, index) => (
          <p
            key={index}
            className="text-sm text-yellow-600 dark:text-yellow-400"
          >
            ⚠️ {warning.message}
          </p>
        ))}

        {/* Help Text */}
        {field === "startPrice" && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Price suggestions: Common (0.000001-0.001), Rare (0.01-0.1), Epic
            (0.1-1), Legendary (1-10)
          </p>
        )}
        {field === "reservePrice" && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Optional minimum price. If no bids reach this price, the auction
            won't sell.
          </p>
        )}
        {field === "buyNowPrice" &&
          formData.auctionType === AuctionType.DUTCH && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Required for Dutch auctions. This is the final price when the
              auction ends.
            </p>
          )}
        {field === "duration" && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Testing: Use 5-10 minutes | Production: Use 1+ hours
          </p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Auction Type Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🎯 Auction Configuration
        </h3>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Auction Type *
          </label>
          <select
            value={formData.auctionType.toString()}
            onChange={(e) =>
              updateField(
                "auctionType",
                parseInt(e.target.value) as AuctionType
              )
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500"
          >
            <option value={AuctionType.ENGLISH.toString()}>
              ⬆️ English Auction
            </option>
            <option value={AuctionType.DUTCH.toString()}>
              ⬇️ Dutch Auction
            </option>
            <option value={AuctionType.TRADITIONAL.toString()}>
              🏛️ Traditional
            </option>
            <option value={AuctionType.SEALED_BID.toString()}>
              🔒 Sealed Bid
            </option>
          </select>
        </div>

        {/* Auction Type Description */}
        {auctionTypeInfo && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              {auctionTypeInfo.name}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {auctionTypeInfo.description}
            </p>
          </div>
        )}
      </div>

      {/* Price Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          💰 Price Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField("startPrice", "Start Price (ETH)", "number")}
          {renderField("reservePrice", "Reserve Price (ETH)", "number")}
          {formData.auctionType !== AuctionType.DUTCH &&
            renderField("buyNowPrice", "Buy Now Price (ETH)", "number")}
        </div>
      </div>

      {/* Duration Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          ⏰ Duration Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Duration *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => updateField("duration", e.target.value)}
                className={`flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  getFieldErrors("duration").length > 0
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:border-purple-500"
                }`}
                placeholder="5"
                min="1"
                max="720"
              />
              <select
                value={formData.durationUnit}
                onChange={(e) =>
                  updateField(
                    "durationUnit",
                    e.target.value as "minutes" | "hours"
                  )
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
            {getFieldErrors("duration").map((error, index) => (
              <p key={index} className="text-sm text-red-600 dark:text-red-400">
                {error.message}
              </p>
            ))}
          </div>

          {renderField(
            "bidIncrement",
            formData.auctionType === AuctionType.DUTCH
              ? "Price Decrease Rate (ETH)"
              : "Bid Increment (ETH)",
            "number"
          )}
        </div>
      </div>

      {/* Validation Summary */}
      {!isValid && validation.errors.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
            ❌ Validation Errors
          </h4>
          <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-2">
            ⚠️ Warnings
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index}>• {warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success State */}
      {isValid && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium text-green-900 dark:text-green-300">
              ✅ All validation checks passed! Ready to create auction.
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
