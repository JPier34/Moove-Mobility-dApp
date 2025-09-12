"use client";

import React, { useState } from "react";
import { AuctionType } from "@/types/auction";
import {
  useAuctionValidationModular,
  AuctionFormData,
} from "@/hooks/useAuctionValidationModular";

interface EnglishAuctionTesterProps {
  className?: string;
}

export default function EnglishAuctionTester({
  className = "",
}: EnglishAuctionTesterProps) {
  const { formData, updateField, isValid } = useAuctionValidationModular();
  const [testResults, setTestResults] = useState<string[]>([]);

  // Test cases for English auction validation
  const testCases = [
    {
      name: "✅ Valid English Auction (no buyNowPrice)",
      data: {
        auctionType: AuctionType.ENGLISH,
        startPrice: "0.001",
        duration: "1",
        durationUnit: "hours" as const,
        bidIncrement: "0.0001",
        reservePrice: "",
        buyNowPrice: "", // Empty - should be valid
      },
      expectedValid: true,
    },
    {
      name: "✅ Valid English Auction (with buyNowPrice)",
      data: {
        auctionType: AuctionType.ENGLISH,
        startPrice: "0.001",
        duration: "1",
        durationUnit: "hours" as const,
        bidIncrement: "0.0001",
        reservePrice: "",
        buyNowPrice: "0.01", // Provided - should be valid
      },
      expectedValid: true,
    },
    {
      name: "❌ Invalid English Auction (missing startPrice)",
      data: {
        auctionType: AuctionType.ENGLISH,
        startPrice: "",
        duration: "1",
        durationUnit: "hours" as const,
        bidIncrement: "0.0001",
        reservePrice: "",
        buyNowPrice: "",
      },
      expectedValid: false,
    },
    {
      name: "❌ Invalid English Auction (missing duration)",
      data: {
        auctionType: AuctionType.ENGLISH,
        startPrice: "0.001",
        duration: "",
        durationUnit: "hours" as const,
        bidIncrement: "0.0001",
        reservePrice: "",
        buyNowPrice: "",
      },
      expectedValid: false,
    },
    {
      name: "❌ Invalid English Auction (missing bidIncrement)",
      data: {
        auctionType: AuctionType.ENGLISH,
        startPrice: "0.001",
        duration: "1",
        durationUnit: "hours" as const,
        bidIncrement: "",
        reservePrice: "",
        buyNowPrice: "",
      },
      expectedValid: false,
    },
  ];

  const runTests = () => {
    const results: string[] = [];

    testCases.forEach((testCase, index) => {
      // Update form data
      Object.entries(testCase.data).forEach(([key, value]) => {
        updateField(key as keyof AuctionFormData, value as any);
      });

      // Wait a bit for validation to update
      setTimeout(() => {
        const isActuallyValid = isValid;
        const testPassed = isActuallyValid === testCase.expectedValid;

        const result = `${testCase.name}: ${
          testPassed ? "✅ PASS" : "❌ FAIL"
        } (Expected: ${testCase.expectedValid}, Got: ${isActuallyValid})`;

        results.push(result);

        if (index === testCases.length - 1) {
          setTestResults(results);
        }
      }, 100 * (index + 1));
    });
  };

  const clearTests = () => {
    setTestResults([]);
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 English Auction Validation Tester
      </h3>

      {/* Current Form State */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">
          📋 Current Form State
        </h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Auction Type:</span>{" "}
              {formData.auctionType}
            </div>
            <div>
              <span className="font-medium">Start Price:</span>{" "}
              {formData.startPrice || "Empty"}
            </div>
            <div>
              <span className="font-medium">Duration:</span>{" "}
              {formData.duration || "Empty"} {formData.durationUnit}
            </div>
            <div>
              <span className="font-medium">Bid Increment:</span>{" "}
              {formData.bidIncrement || "Empty"}
            </div>
            <div>
              <span className="font-medium">Reserve Price:</span>{" "}
              {formData.reservePrice || "Empty"}
            </div>
            <div>
              <span className="font-medium">Buy Now Price:</span>{" "}
              {formData.buyNowPrice || "Empty"}
            </div>
          </div>
          <div className="mt-3">
            <span className="font-medium">Validation Status:</span>{" "}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isValid
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isValid ? "✅ Valid" : "❌ Invalid"}
            </span>
          </div>
        </div>
      </div>

      {/* Manual Form Controls */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">
          🎛️ Manual Form Controls
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Price (ETH)
            </label>
            <input
              type="text"
              value={formData.startPrice}
              onChange={(e) => updateField("startPrice", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bid Increment (ETH)
            </label>
            <input
              type="text"
              value={formData.bidIncrement}
              onChange={(e) => updateField("bidIncrement", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.0001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buy Now Price (ETH) - Optional
            </label>
            <input
              type="text"
              value={formData.buyNowPrice}
              onChange={(e) => updateField("buyNowPrice", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.01 (optional)"
            />
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">
          🧪 Automated Tests
        </h4>
        <div className="flex space-x-4">
          <button
            onClick={runTests}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Run Tests
          </button>
          <button
            onClick={clearTests}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-800 mb-3">
            📊 Test Results
          </h4>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  result.includes("✅ PASS")
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Status */}
      {!isValid && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-800 mb-3">
            ❌ Form Invalid
          </h4>
          <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm">
            The current form state is invalid. Check required fields
            (startPrice, duration).
          </div>
        </div>
      )}

      {/* Expected Behavior */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-semibold text-blue-800 mb-2">
          📋 Expected Behavior
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>
            • <strong>English auctions</strong> should work WITHOUT buyNowPrice
          </div>
          <div>
            • <strong>Required fields:</strong> startPrice, duration,
            bidIncrement
          </div>
          <div>
            • <strong>Optional fields:</strong> reservePrice, buyNowPrice
          </div>
          <div>
            • <strong>RESERVE auctions</strong> require buyNowPrice (different
            rule)
          </div>
          <div>
            • <strong>Validation should pass</strong> when all required fields
            are filled
          </div>
        </div>
      </div>
    </div>
  );
}
