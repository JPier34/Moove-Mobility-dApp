"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseSmartRefreshOptions {
  refreshFunction: () => void;
  intervalMs?: number;
  pauseOnModal?: boolean;
  pauseOnHidden?: boolean;
  disabled?: boolean;
}

/**
 * Smart refresh hook that intelligently pauses refresh when:
 * - User is viewing a modal
 * - Tab is not active (Page Visibility API)
 * - Custom conditions are met
 */
export function useSmartRefresh({
  refreshFunction,
  intervalMs = 120000, // 2 minutes default
  pauseOnModal = true,
  pauseOnHidden = true,
  disabled = false,
}: UseSmartRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  const startRefresh = useCallback(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start new interval
    intervalRef.current = setInterval(refreshFunction, intervalMs);
    isPausedRef.current = false;

    console.log(`🔄 Smart refresh started (${intervalMs / 1000}s interval)`);
  }, [refreshFunction, intervalMs]);

  const pauseRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      isPausedRef.current = true;

      console.log(`⏸️ Smart refresh paused`);
    }
  }, []);

  const resumeRefresh = useCallback(() => {
    if (isPausedRef.current) {
      startRefresh();
      console.log(`▶️ Smart refresh resumed`);
    }
  }, [startRefresh]);

  // Check if user is viewing a modal
  const checkModalOpen = useCallback(() => {
    if (!pauseOnModal) return false;

    const modal = document.querySelector(
      '[role="dialog"], .modal, [data-modal="true"]'
    );
    return modal && modal.getAttribute("aria-hidden") !== "true";
  }, [pauseOnModal]);

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (!pauseOnHidden) return;

    if (document.hidden) {
      pauseRefresh();
    } else {
      resumeRefresh();
    }
  }, [pauseOnHidden, pauseRefresh, resumeRefresh]);

  // Handle modal state changes
  const handleModalChange = useCallback(() => {
    if (!pauseOnModal) return;

    if (checkModalOpen()) {
      pauseRefresh();
    } else {
      resumeRefresh();
    }
  }, [pauseOnModal, checkModalOpen, pauseRefresh, resumeRefresh]);

  useEffect(() => {
    // Call refresh function immediately on mount
    console.log("🔄 Calling refresh function immediately");
    refreshFunction();

    // Start initial refresh only if not disabled
    if (!disabled) {
      startRefresh();
    }

    // Listen for page visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for modal state changes (check every 5 seconds)
    const modalCheckInterval = setInterval(handleModalChange, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(modalCheckInterval);
    };
  }, [
    refreshFunction,
    startRefresh,
    handleVisibilityChange,
    handleModalChange,
    disabled,
  ]);

  return {
    startRefresh,
    pauseRefresh,
    resumeRefresh,
    isPaused: isPausedRef.current,
  };
}
