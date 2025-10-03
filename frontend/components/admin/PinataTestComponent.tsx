"use client";

import React, { useState } from "react";

export default function PinataTestComponent() {
  const [result, setResult] = useState<{
    metadataHash: string;
    imageHash: string;
    isMock?: boolean;
  } | null>(null);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const testPinataUpload = async () => {
    setTestStatus("testing");
    setResult(null);

    try {
      // Create a test image file
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Draw a test image
        ctx.fillStyle = "#4F46E5";
        ctx.fillRect(0, 0, 300, 300);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Test NFT", 150, 150);
        ctx.fillText("Pinata Test", 150, 180);
      }

      const testImageFile = new Promise<File>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "test-nft.png", {
              type: "image/png",
            });
            resolve(file);
          }
        }, "image/png");
      });

      const imageFile = await testImageFile;
      console.log("🧪 Created test image file:", imageFile);

      // Upload image to IPFS using server-side API
      console.log("📤 Uploading test image to Pinata IPFS via API...");
      setUploadProgress(50);

      const imageFormData = new FormData();
      imageFormData.append("file", imageFile);
      imageFormData.append("type", "image");

      const imageResponse = await fetch("/api/upload-ipfs", {
        method: "POST",
        body: imageFormData,
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        throw new Error(
          `Image upload failed: ${imageResponse.status} - ${errorText}`
        );
      }

      const imageResult = await imageResponse.json();
      console.log("✅ Image upload result:", imageResult);

      const imageIpfsHash = imageResult.hash;
      setUploadProgress(75);

      const testMetadata = {
        name: "Test NFT",
        description: "Test NFT for Pinata IPFS upload",
        image: imageIpfsHash, // Use the IPFS hash directly
        attributes: [
          { trait_type: "Type", value: "Test" },
          { trait_type: "Created", value: new Date().toISOString() },
          { trait_type: "Image Hash", value: imageIpfsHash },
        ],
      };

      console.log("🧪 Testing Pinata upload with metadata:", testMetadata);

      // Upload metadata to IPFS using server-side API
      const metadataResponse = await fetch("/api/upload-ipfs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metadata: testMetadata }),
      });

      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text();
        throw new Error(
          `Metadata upload failed: ${metadataResponse.status} - ${errorText}`
        );
      }

      const metadataResult = await metadataResponse.json();
      console.log("✅ Metadata upload result:", metadataResult);

      const metadataIpfsHash = metadataResult.hash || metadataResult.IpfsHash;
      setUploadProgress(100);

      if (metadataIpfsHash) {
        setResult({
          metadataHash: metadataIpfsHash,
          imageHash: imageIpfsHash,
          isMock: imageResult.mock || metadataResult.mock || false,
        });
        setTestStatus("success");
        console.log("✅ Pinata test successful:", {
          metadataHash: metadataIpfsHash,
          imageHash: imageIpfsHash,
          isMock: imageResult.mock || metadataResult.mock || false,
        });
      } else {
        setTestStatus("error");
        console.error("❌ Pinata test failed: No metadata hash returned");
      }
    } catch (err) {
      setTestStatus("error");
      console.error("❌ Pinata test failed:", err);
    }
  };

  const checkEnvironmentVariables = () => {
    // Debug: Log all environment variables
    console.log("🔍 Environment Variables Debug:");
    console.log(
      "NEXT_PUBLIC_PINATA_API_KEY:",
      process.env.NEXT_PUBLIC_PINATA_API_KEY
    );
    console.log(
      "NEXT_PUBLIC_PINATA_SECRET_KEY:",
      process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
    );
    console.log("PINATA_API_KEY:", process.env.PINATA_API_KEY);
    console.log("PINATA_SECRET_KEY:", process.env.PINATA_SECRET_KEY);
    console.log("NODE_ENV:", process.env.NODE_ENV);

    // Note: PINATA_API_KEY and PINATA_SECRET_KEY are server-side only
    // They are accessible via API endpoints but not directly in client components
    const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    console.log("🔍 Client-side resolved values:");
    console.log(
      "apiKey:",
      apiKey ? `${apiKey.substring(0, 10)}...` : "undefined (server-side only)"
    );
    console.log(
      "secretKey:",
      secretKey
        ? `${secretKey.substring(0, 10)}...`
        : "undefined (server-side only)"
    );

    return {
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey,
      apiKeyLength: apiKey?.length || 0,
      secretKeyLength: secretKey?.length || 0,
      isServerSideOnly: !apiKey && !secretKey, // Indicates server-side only configuration
    };
  };

  const envCheck = checkEnvironmentVariables();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🧪 Pinata IPFS Test
      </h2>

      <div className="space-y-6">
        {/* Environment Variables Check */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            🔑 Environment Variables Check
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                PINATA_API_KEY:
              </span>
              <span
                className={`font-mono ${
                  envCheck.hasApiKey
                    ? "text-green-600"
                    : envCheck.isServerSideOnly
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {envCheck.hasApiKey
                  ? `✅ Found (${envCheck.apiKeyLength} chars)`
                  : envCheck.isServerSideOnly
                  ? "🔒 Server-side only"
                  : "❌ Not found"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                PINATA_SECRET_KEY:
              </span>
              <span
                className={`font-mono ${
                  envCheck.hasSecretKey
                    ? "text-green-600"
                    : envCheck.isServerSideOnly
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {envCheck.hasSecretKey
                  ? `✅ Found (${envCheck.secretKeyLength} chars)`
                  : envCheck.isServerSideOnly
                  ? "🔒 Server-side only"
                  : "❌ Not found"}
              </span>
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div className="flex items-center space-x-4">
          {envCheck.isServerSideOnly ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 dark:text-blue-400">🔒</span>
                <span className="text-blue-800 dark:text-blue-300 font-medium">
                  Server-side Configuration Detected
                </span>
              </div>
              <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                Pinata API keys are configured server-side only. This is the
                recommended approach for security.
              </p>
              <button
                onClick={testPinataUpload}
                disabled={isUploading}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    <span>Testing Server-side Upload...</span>
                  </>
                ) : (
                  <>
                    <span>🧪</span>
                    <span>Test Server-side Upload</span>
                  </>
                )}
              </button>
            </div>
          ) : !envCheck.hasApiKey || !envCheck.hasSecretKey ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
                <span className="text-red-800 dark:text-red-300 font-medium">
                  Pinata API keys not configured
                </span>
              </div>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                Please check the Environment Setup Guide below to configure your
                API keys.
              </p>
            </div>
          ) : (
            <button
              onClick={testPinataUpload}
              disabled={isUploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Uploading... {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <span>🧪</span>
                  <span>Test Pinata Upload</span>
                </>
              )}
            </button>
          )}

          {testStatus === "success" && (
            <span className="text-green-600 font-medium">✅ Success!</span>
          )}
          {testStatus === "error" && (
            <span className="text-red-600 font-medium">❌ Failed</span>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">❌</span>
              <span className="text-red-700 dark:text-red-400">
                Error: {error}
              </span>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
              ✅ Upload Successful!
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Image IPFS Hash:
                </span>
                <div className="font-mono text-green-800 dark:text-green-200 break-all">
                  {result.imageHash}
                </div>
                {result.isMock && (
                  <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                    ⚠️ Mock hash (Pinata not configured)
                  </div>
                )}
              </div>
              <div>
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Metadata IPFS Hash:
                </span>
                <div className="font-mono text-green-800 dark:text-green-200 break-all">
                  {result.metadataHash}
                </div>
                {result.isMock && (
                  <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                    ⚠️ Mock hash (Pinata not configured)
                  </div>
                )}
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() =>
                    window.open(
                      `https://ipfs.io/ipfs/${result.imageHash}`,
                      "_blank"
                    )
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  🖼️ View Image
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://ipfs.io/ipfs/${result.metadataHash}`,
                      "_blank"
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📄 View Metadata
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            📋 Instructions
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <p>1. Make sure your .env.local file contains:</p>
            <div className="font-mono bg-blue-100 dark:bg-blue-800 p-2 rounded text-xs">
              PINATA_API_KEY=your_api_key
              <br />
              PINATA_SECRET_KEY=your_secret_key
            </div>
            <p>2. Restart your development server after adding the keys</p>
            <p>3. Click "Test Pinata Upload" to verify the configuration</p>
            <p>
              4. If successful, new NFTs will use real IPFS instead of mock
              hashes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
