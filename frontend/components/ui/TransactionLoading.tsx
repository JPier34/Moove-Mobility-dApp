import React from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";

interface TransactionLoadingProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export default function TransactionLoading({
  message = "Processing transaction...",
  showProgress = false,
  progress = 0,
  className = "",
}: TransactionLoadingProps) {
  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <motion.div
        className="mb-6"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <LoadingSpinner size="lg" className="mx-auto" />
      </motion.div>

      <motion.h3
        className="text-xl font-semibold text-gray-900 dark:text-white mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.h3>

      <motion.p
        className="text-gray-600 dark:text-gray-300 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Please wait while we process your transaction on the blockchain...
      </motion.p>

      {showProgress && (
        <motion.div
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>
      )}

      <motion.div
        className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ⏳
        </motion.div>
        <span>This may take a few moments</span>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        >
          ⏳
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

