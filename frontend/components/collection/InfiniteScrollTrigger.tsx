"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
}

export default function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 0.8,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        console.log("🔄 Infinite scroll triggered - loading more NFTs");
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    if (!triggerRef.current) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: "100px", // Start loading 100px before the trigger comes into view
    });

    observerRef.current.observe(triggerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold]);

  if (!hasMore) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          🎉 You've viewed all your NFTs!
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={triggerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center py-8"
    >
      {isLoading ? (
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-moove-primary border-t-transparent"></div>
          <span className="text-gray-600 dark:text-gray-400 text-sm">
            Loading NFTs...
          </span>
        </div>
      ) : (
        <div className="text-gray-400 dark:text-gray-500 text-sm">
          Scroll to load more NFTs
        </div>
      )}
    </motion.div>
  );
}
