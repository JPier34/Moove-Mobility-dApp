"use client";

import React, { useState, useEffect } from "react";
import {
  getIPFSTrackingInfo,
  clearIPFSTracking,
} from "@/hooks/enhanced-auction-utils";

interface IPFSTrackingDebugProps {
  className?: string;
}

export default function IPFSTrackingDebug({
  className = "",
}: IPFSTrackingDebugProps) {
  const [trackingInfo, setTrackingInfo] = useState<{
    totalFiles: number;
    files: any[];
  }>({
    totalFiles: 0,
    files: [],
  });
  const [isVisible, setIsVisible] = useState(false);

  const refreshTrackingInfo = () => {
    const info = getIPFSTrackingInfo();
    setTrackingInfo(info);
  };

  const handleClearTracking = () => {
    clearIPFSTracking();
    refreshTrackingInfo();
  };

  useEffect(() => {
    refreshTrackingInfo();
    const interval = setInterval(refreshTrackingInfo, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          📍 IPFS Tracker ({trackingInfo.totalFiles})
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-md max-h-96 overflow-hidden ${className}`}
    >
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">📍 IPFS File Tracker</h3>
        <div className="flex space-x-2">
          <button
            onClick={refreshTrackingInfo}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            🔄
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Total Files:{" "}
            <span className="font-semibold text-blue-600">
              {trackingInfo.totalFiles}
            </span>
          </span>
          <button
            onClick={handleClearTracking}
            className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded border border-red-300 hover:bg-red-50"
          >
            Clear All
          </button>
        </div>

        {trackingInfo.files.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <p>No IPFS files tracked yet</p>
            <p className="text-xs mt-1">Files will appear here when fetched</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trackingInfo.files.map((file, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded p-3 bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-gray-600 break-all">
                    {file.hash.substring(0, 20)}...
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      file.source === "pinata"
                        ? "bg-green-100 text-green-800"
                        : file.source === "ipfs"
                        ? "bg-blue-100 text-blue-800"
                        : file.source === "local"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {file.source}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <div>Gateway: {file.gateway}</div>
                  <div>
                    Time: {new Date(file.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}







