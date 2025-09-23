"use client";

import React from "react";
import { motion } from "framer-motion";

interface CacheStatsProps {
  stats: {
    hits: number;
    misses: number;
    totalCalls: number;
    hitRate: string;
    totalEntries: number;
  };
}

export default function CacheStats({ stats }: CacheStatsProps) {
  const hitRate = parseFloat(stats.hitRate);
  const isGoodPerformance = hitRate >= 70;
  const isExcellentPerformance = hitRate >= 90;

  return (
    <motion.div
      className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isExcellentPerformance
              ? "bg-green-500"
              : isGoodPerformance
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        ></div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Cache Performance
        </h3>
      </div>

      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Hit Rate:</span>
          <span
            className={`font-medium ${
              isExcellentPerformance
                ? "text-green-600 dark:text-green-400"
                : isGoodPerformance
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {stats.hitRate}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Cache Hits:</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {stats.hits}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Cache Misses:</span>
          <span className="font-medium text-red-600 dark:text-red-400">
            {stats.misses}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Total Calls:</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {stats.totalCalls}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Cached Items:</span>
          <span className="font-medium text-purple-600 dark:text-purple-400">
            {stats.totalEntries}
          </span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-500">
          {isExcellentPerformance && "🚀 Excellent performance!"}
          {!isExcellentPerformance &&
            isGoodPerformance &&
            "⚡ Good performance"}
          {!isGoodPerformance && "🐌 Consider optimizing"}
        </div>
      </div>
    </motion.div>
  );
}



