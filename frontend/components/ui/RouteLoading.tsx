import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RouteLoadingProps {
  isLoading: boolean;
  message?: string;
}

export default function RouteLoading({
  isLoading,
  message = "Navigating...",
}: RouteLoadingProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <motion.div
              className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
