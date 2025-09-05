"use client";

import React, { useState } from "react";

interface NFTMetadataPreviewProps {
  metadata: {
    name: string;
    description: string;
    image: string;
    external_url?: string;
    title?: string;
    symbol?: string;
    collection?: {
      name: string;
      family: string;
    };
    attributes: Array<{
      trait_type: string;
      value: string | number;
      display_type?: string;
    }>;
    properties?: {
      category?: string;
      rarity?: string;
      isLimitedEdition?: boolean;
      creator?: string;
      creationDate?: string;
      customization?: {
        allowColorChange: boolean;
        allowTextChange: boolean;
        allowSizeChange: boolean;
        allowEffectsChange: boolean;
        availableColors: string[];
        maxTextLength: number;
      };
    };
  };
}

export function NFTMetadataPreview({ metadata }: NFTMetadataPreviewProps) {
  const [activeTab, setActiveTab] = useState<
    "preview" | "raw" | "compatibility"
  >("preview");

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
    }
    return imageUrl;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-3">
        NFT Metadata Preview
      </h3>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-3 py-1 rounded text-sm ${
            activeTab === "preview"
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab("raw")}
          className={`px-3 py-1 rounded text-sm ${
            activeTab === "raw"
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Raw JSON
        </button>
        <button
          onClick={() => setActiveTab("compatibility")}
          className={`px-3 py-1 rounded text-sm ${
            activeTab === "compatibility"
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Compatibility
        </button>
      </div>

      {/* Content */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          {/* NFT Card Preview */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex space-x-4">
              <div className="w-24 h-24 bg-gray-600 rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(metadata.image)}
                  alt={metadata.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzY2NjY2NiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                  }}
                />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold text-lg">
                  {metadata.title || metadata.name}
                </h4>
                <p className="text-gray-300 text-sm mb-2">
                  {metadata.description}
                </p>
                {metadata.collection && (
                  <div className="text-xs text-gray-400">
                    <span className="font-medium">
                      {metadata.collection.name}
                    </span>
                    {metadata.symbol && (
                      <span className="ml-2 px-2 py-1 bg-gray-600 rounded text-xs">
                        {metadata.symbol}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h5 className="text-white font-medium mb-2">Attributes</h5>
            <div className="grid grid-cols-2 gap-2">
              {metadata.attributes.map((attr, index) => (
                <div key={index} className="bg-gray-600 rounded p-2">
                  <div className="text-xs text-gray-400">{attr.trait_type}</div>
                  <div className="text-sm text-white font-medium">
                    {attr.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "raw" && (
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-xs text-gray-300 overflow-auto max-h-96">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      )}

      {activeTab === "compatibility" && (
        <div className="space-y-3">
          <div className="bg-gray-700 rounded-lg p-3">
            <h5 className="text-white font-medium mb-2">
              OpenSea Compatibility
            </h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Name:</span>
                <span className="text-green-400">✅ {metadata.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Description:</span>
                <span className="text-green-400">✅ Present</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Image:</span>
                <span className="text-green-400">
                  ✅ {metadata.image ? "Present" : "Missing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">External URL:</span>
                <span
                  className={
                    metadata.external_url ? "text-green-400" : "text-yellow-400"
                  }
                >
                  {metadata.external_url ? "✅ Present" : "⚠️ Optional"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Attributes:</span>
                <span className="text-green-400">
                  ✅ {metadata.attributes.length} items
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <h5 className="text-white font-medium mb-2">App Compatibility</h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Title Field:</span>
                <span
                  className={
                    metadata.title ? "text-green-400" : "text-yellow-400"
                  }
                >
                  {metadata.title ? "✅ Present" : "⚠️ Using name"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Collection Info:</span>
                <span
                  className={
                    metadata.collection ? "text-green-400" : "text-yellow-400"
                  }
                >
                  {metadata.collection ? "✅ Present" : "⚠️ Missing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Properties:</span>
                <span
                  className={
                    metadata.properties ? "text-green-400" : "text-yellow-400"
                  }
                >
                  {metadata.properties ? "✅ Present" : "⚠️ Missing"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



