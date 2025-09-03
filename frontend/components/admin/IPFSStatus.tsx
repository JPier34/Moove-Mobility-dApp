"use client";

import React from "react";
import { useIPFSUnified } from "@/hooks/useIPFSUnified";

export function IPFSStatus() {
  const { isPinataConfigured } = useIPFSUnified();
  const isConfigured = isPinataConfigured;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-3">
        IPFS Configuration
      </h3>

      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-3 h-3 rounded-full ${
            isConfigured ? "bg-green-500" : "bg-yellow-500"
          }`}
        ></div>
        <span className="text-white">
          {isConfigured ? "Pinata IPFS Configured" : "Using Demo IPFS Mode"}
        </span>
      </div>

      {!isConfigured && (
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-yellow-200 text-sm mb-2">
            <strong>Demo Mode:</strong> IPFS uploads are simulated for testing.
          </p>
          <p className="text-yellow-200 text-sm">
            To enable real IPFS uploads, configure your Pinata API keys in{" "}
            <code className="bg-gray-700 px-1 rounded">.env.local</code>
          </p>
        </div>
      )}

      {isConfigured && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-200 text-sm">
            <strong>Production Mode:</strong> Files will be uploaded to IPFS via
            Pinata.
          </p>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        <p>What gets uploaded to IPFS:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>NFT image file (JPEG, PNG, GIF, WebP)</li>
          <li>Metadata JSON with attributes and properties</li>
          <li>Customization options and rarity information</li>
          <li>Creator and creation date</li>
        </ul>
      </div>
    </div>
  );
}
