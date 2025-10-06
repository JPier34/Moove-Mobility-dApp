"use client";

import React, { useState } from "react";
import { useImageCreationDebug } from "@/hooks/useImageCreationDebug";

export default function ImageCreationDebugger() {
  const {
    debugLog,
    isDebugging,
    debugImageUpload,
    debugMetadataCreation,
    clearLog,
  } = useImageCreationDebug();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImageUploadDebug = async () => {
    if (!selectedFile) return;
    await debugImageUpload(selectedFile);
  };

  const handleMetadataDebug = async () => {
    const testMetadata = {
      name: "Test NFT",
      description: "Test NFT for debugging",
      image: "https://ipfs.io/ipfs/QmTest123",
      attributes: [
        { trait_type: "Type", value: "Test" },
        { trait_type: "Created", value: new Date().toISOString() },
      ],
    };

    await debugMetadataCreation(testMetadata);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🔧 Image Creation Debugger
      </h2>

      <div className="space-y-6">
        {/* File Upload Test */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Image Upload Test
          </h3>

          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {selectedFile && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Selected file:</strong> {selectedFile.name} (
                {selectedFile.size} bytes, {selectedFile.type})
              </div>
            )}

            <button
              onClick={handleImageUploadDebug}
              disabled={!selectedFile || isDebugging}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDebugging ? "Debugging..." : "Debug Image Upload"}
            </button>
          </div>
        </div>

        {/* Metadata Test */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Metadata Analysis Test
          </h3>

          <button
            onClick={handleMetadataDebug}
            disabled={isDebugging}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDebugging ? "Analyzing..." : "Debug Metadata Creation"}
          </button>
        </div>

        {/* Debug Log */}
        {debugLog.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Debug Log
              </h3>
              <button
                onClick={clearLog}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Clear Log
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {debugLog.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    log.success
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-medium ${
                        log.success
                          ? "text-green-800 dark:text-green-300"
                          : "text-red-800 dark:text-red-300"
                      }`}
                    >
                      {log.success ? "✅" : "❌"} {log.step}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  {log.data && (
                    <div className="mt-2">
                      <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.error && (
                    <div className="mt-2 text-red-600 dark:text-red-400">
                      <strong>Error:</strong> {log.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


