"use client";

import React from "react";
import { toast } from "react-hot-toast";

interface NFTCacheSyncProps {
  onSync: () => void;
  isSyncing: boolean;
  cacheStats: {
    totalNFTs: number;
    creatorStats: Record<string, number>;
    sourceStats: Record<string, number>;
    oldestNFT: number | null;
    newestNFT: number | null;
  };
  onClearCache: () => void;
}

export function NFTCacheSync({
  onSync,
  isSyncing,
  cacheStats,
  onClearCache,
}: NFTCacheSyncProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Cache NFT & Sincronizzazione
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              isSyncing
                ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSyncing ? "Sincronizzando..." : "🔄 Sincronizza"}
          </button>
          <button
            onClick={() => {
              console.log(
                "🔍 DEBUG Cache Locale:",
                localStorage.getItem("moove-nft-cache")
              );
              toast.success("Cache loggata in console");
            }}
            className="px-3 py-1 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-all"
          >
            🔍 Debug Cache
          </button>
          <button
            onClick={() => {
              // Test aggiunta NFT alla cache
              const testNFT = {
                name: "TestNFT",
                imageHash: "test123",
                creator: "0x123456789",
                timestamp: Date.now(),
                source: "local" as const,
              };
              const cached = JSON.parse(
                localStorage.getItem("moove-nft-cache") || "[]"
              );
              cached.push(testNFT);
              localStorage.setItem("moove-nft-cache", JSON.stringify(cached));
              console.log("🧪 DEBUG: NFT di test aggiunto alla cache");
              toast.success("NFT di test aggiunto alla cache");
            }}
            className="px-3 py-1 rounded text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all"
          >
            🧪 Test Cache
          </button>
          <button
            onClick={() => {
              const elephantNFT = {
                name: "Elephant",
                imageHash:
                  "1fbbf946b30c6d0e40a3d0504f4faa270433d37c0f145fc72cd9da7ed7f706d2",
                creator: "0x777382955f33Bb8540602E914D9b650C962EF6Cc",
                timestamp: Date.now(),
                source: "local" as const,
              };
              const cached = JSON.parse(
                localStorage.getItem("moove-nft-cache") || "[]"
              );
              cached.push(elephantNFT);
              localStorage.setItem("moove-nft-cache", JSON.stringify(cached));
              console.log("🐘 DEBUG: Elephant aggiunto alla cache");
              toast.success("Elephant aggiunto alla cache");
            }}
            className="px-3 py-1 rounded text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition-all"
          >
            🐘 Add Elephant
          </button>
          <button
            onClick={onClearCache}
            className="px-3 py-1 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Statistiche Cache */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {cacheStats.totalNFTs}
          </div>
          <div className="text-xs text-gray-400">Total NFT</div>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {cacheStats.sourceStats.local || 0}
          </div>
          <div className="text-xs text-gray-400">Locali</div>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {cacheStats.sourceStats.api || 0}
          </div>
          <div className="text-xs text-gray-400">Da API</div>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {Object.keys(cacheStats.creatorStats).length}
          </div>
          <div className="text-xs text-gray-400">Creatori</div>
        </div>
      </div>

      {/* Dettagli Cache */}
      <div className="space-y-3">
        {/* Creatori */}
        {Object.keys(cacheStats.creatorStats).length > 0 && (
          <div className="bg-gray-700 rounded p-3">
            <h4 className="text-white font-medium mb-2">Creatori</h4>
            <div className="space-y-1">
              {Object.entries(cacheStats.creatorStats).map(
                ([creator, count]) => (
                  <div key={creator} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {creator.slice(0, 6)}...{creator.slice(-4)}
                    </span>
                    <span className="text-blue-400">{count} NFT</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="bg-gray-700 rounded p-3">
          <h4 className="text-white font-medium mb-2">Periodo</h4>
          <div className="space-y-1 text-sm">
            {cacheStats.oldestNFT && (
              <div className="flex justify-between">
                <span className="text-gray-300">Primo NFT:</span>
                <span className="text-green-400">
                  {formatDate(cacheStats.oldestNFT)}
                </span>
              </div>
            )}
            {cacheStats.newestNFT && (
              <div className="flex justify-between">
                <span className="text-gray-300">Ultimo NFT:</span>
                <span className="text-blue-400">
                  {formatDate(cacheStats.newestNFT)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded p-3">
          <h4 className="text-blue-200 font-medium mb-2">ℹ️ Come Funziona</h4>
          <div className="text-blue-300 text-xs space-y-1">
            <div>
              • <strong>Cache Locale</strong>: Verifiche istantanee
            </div>
            <div>
              • <strong>API</strong>: Sincronizzazione con server
            </div>
            <div>
              • <strong>Ibrido</strong>: Velocità + Accuratezza
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
