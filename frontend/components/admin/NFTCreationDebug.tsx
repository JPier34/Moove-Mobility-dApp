"use client";

import React from "react";

interface NFTCreationDebugProps {
  nftData: {
    name: string;
    description: string;
    image: File | null;
    isLimitedEdition: boolean;
    editionSize: string;
    editionName: string;
  };
  canMint: boolean;
  isMasterAdmin: boolean;
  isDuplicateName: (name: string) => boolean;
  hasInvalidCharacters: (name: string) => boolean;
}

export function NFTCreationDebug({
  nftData,
  canMint,
  isMasterAdmin,
  isDuplicateName,
  hasInvalidCharacters,
}: NFTCreationDebugProps) {
  const checks = [
    {
      name: "Admin Permissions",
      condition: canMint || isMasterAdmin,
      details: `canMint: ${canMint}, isMasterAdmin: ${isMasterAdmin}`,
    },
    {
      name: "Name Length (≥3)",
      condition: nftData.name.trim().length >= 3,
      details: `Current: ${nftData.name.trim().length} characters`,
    },
    {
      name: "Description Length (≥10)",
      condition: nftData.description.trim().length >= 10,
      details: `Current: ${nftData.description.trim().length} characters`,
    },
    {
      name: "Image Uploaded",
      condition: nftData.image !== null,
      details: nftData.image
        ? `File: ${nftData.image.name}`
        : "No image selected",
    },
    {
      name: "Limited Edition Valid",
      condition:
        !nftData.isLimitedEdition ||
        (nftData.editionSize &&
          parseInt(nftData.editionSize) >= 1 &&
          parseInt(nftData.editionSize) <= 10000 &&
          nftData.editionName.trim().length > 0),
      details: nftData.isLimitedEdition
        ? `Size: ${nftData.editionSize}, Name: "${nftData.editionName}"`
        : "Not limited edition",
    },
    {
      name: "Name Not Duplicate",
      condition: !isDuplicateName(nftData.name.trim()),
      details: `Name: "${nftData.name.trim()}"`,
    },
    {
      name: "Name Valid Characters",
      condition: !hasInvalidCharacters(nftData.name.trim()),
      details: `Name: "${nftData.name.trim()}"`,
    },
  ];

  const allPassed = checks.every((check) => check.condition);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-3">
        NFT Creation Validation Debug
      </h3>

      <div className="space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                  check.condition
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {check.condition ? "✓" : "✗"}
              </span>
              <span className="text-gray-300 text-sm">{check.name}</span>
            </div>
            <span className="text-xs text-gray-400">{check.details}</span>
          </div>
        ))}
      </div>

      <div
        className={`mt-4 p-3 rounded-lg ${
          allPassed
            ? "bg-green-900/30 border border-green-500/30"
            : "bg-red-900/30 border border-red-500/30"
        }`}
      >
        <p
          className={`text-sm ${allPassed ? "text-green-200" : "text-red-200"}`}
        >
          <strong>Overall Status:</strong>{" "}
          {allPassed ? "✅ Ready to Create NFT" : "❌ Missing Requirements"}
        </p>
        {!allPassed && (
          <p className="text-xs text-red-300 mt-1">
            Fix the red items above to enable the "Create NFT & Continue"
            button.
          </p>
        )}
      </div>
    </div>
  );
}






