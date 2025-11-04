"use client";

import React, { useState } from "react";

export default function EnvironmentSetupGuide() {
  const [showGuide, setShowGuide] = useState(false);

  const envContent = `# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key_here

# Alternative naming (for backward compatibility)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# RPC Configuration
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/your_infura_key_here

# Contract Addresses (REQUIRED - set these from your deployment)
NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS=your_access_control_address_here
NEXT_PUBLIC_MOOVE_NFT_ADDRESS=your_nft_contract_address_here
NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS=your_auction_contract_address_here
NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS=your_rental_pass_contract_address_here
NEXT_PUBLIC_MASTER_WALLET_ADDRESS=your_master_admin_address_here`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envContent);
    alert("Content copied to clipboard! Paste it into your .env.local file.");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        ⚙️ Environment Setup Guide
      </h2>

      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            ⚠️ Environment Variables Not Found
          </h3>
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">
            The Pinata API keys are not configured. You need to create a{" "}
            <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">
              .env.local
            </code>{" "}
            file in your project root.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            📋 Steps to Fix:
          </h3>

          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              Create a file named{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                .env.local
              </code>{" "}
              in your project root directory
            </li>
            <li>Copy the content below into the file</li>
            <li>Replace the placeholder values with your actual API keys</li>
            <li>Restart your development server</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              📄 .env.local Content:
            </h3>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Copy to Clipboard
            </button>
          </div>

          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-64">
            {envContent}
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            🔑 Where to Get API Keys:
          </h3>

          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <strong>Pinata API Keys:</strong>
              <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                <li>
                  Go to{" "}
                  <a
                    href="https://pinata.cloud"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    pinata.cloud
                  </a>
                </li>
                <li>Sign up or log in to your account</li>
                <li>Go to API Keys section</li>
                <li>Create a new API key with pinning permissions</li>
                <li>Copy the API Key and Secret</li>
              </ol>
            </div>

            <div>
              <strong>Infura RPC URL:</strong>
              <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                <li>
                  Go to{" "}
                  <a
                    href="https://infura.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    infura.io
                  </a>
                </li>
                <li>Create a new project</li>
                <li>Copy the Sepolia endpoint URL</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            💡 Important Notes:
          </h3>
          <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
            <li>
              • The{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                .env.local
              </code>{" "}
              file is ignored by git for security
            </li>
            <li>• Restart your development server after creating the file</li>
            <li>
              • Use{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                NEXT_PUBLIC_
              </code>{" "}
              prefix for client-side access
            </li>
            <li>• Without Pinata, the system will use mock IPFS hashes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
