"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const router = useRouter();

  const navigateWithLoading = useCallback(
    (path: string) => {
      setIsNavigating(true);
      setCurrentPath(path);

      // Navigate to the new path
      router.push(path);

      // Reset loading state after navigation
      // We'll use a timeout as fallback, but the actual navigation will reset it
      setTimeout(() => {
        setIsNavigating(false);
        setCurrentPath(null);
      }, 2000); // 2 second timeout as fallback
    },
    [router]
  );

  const resetLoading = useCallback(() => {
    setIsNavigating(false);
    setCurrentPath(null);
  }, []);

  return {
    isNavigating,
    currentPath,
    navigateWithLoading,
    resetLoading,
  };
}

