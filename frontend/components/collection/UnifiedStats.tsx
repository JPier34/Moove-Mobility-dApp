/**
 * Componente per Mostrare Statistiche Sistema Unificato
 * Sostituisce CacheStats con informazioni più complete
 */

import React from "react";
import { motion } from "framer-motion";

interface UnifiedStatsProps {
  stats: {
    totalAuctions: number;
    lastFetch: Date | null;
    cacheHitRate: number;
    totalNFTs: number;
    totalValue: number;
  };
  onRefresh: () => void;
}

export default function UnifiedStats({ stats, onRefresh }: UnifiedStatsProps) {
  const formatDate = (date: Date | null): string => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const formatValue = (value: number): string => {
    return `${value.toFixed(4)} ETH`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">
          Sistema Unificato
        </h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Aggiorna
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cache Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cache Hit Rate
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.cacheHitRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-xl">
                ⚡
              </span>
            </div>
          </div>
        </div>

        {/* Total Auctions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Aste Totali
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalAuctions}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-xl">
                🏆
              </span>
            </div>
          </div>
        </div>

        {/* Total NFTs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                NFT in Collezione
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalNFTs}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-xl">
                🎨
              </span>
            </div>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Valore Totale
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatValue(stats.totalValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-400 text-xl">
                💰
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Ultimo aggiornamento:</span>
          <span className="font-medium">{formatDate(stats.lastFetch)}</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-3 flex items-center">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
          Sistema operativo e sincronizzato
        </span>
      </div>
    </motion.div>
  );
}



