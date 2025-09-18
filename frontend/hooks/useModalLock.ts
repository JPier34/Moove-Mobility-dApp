"use client";

import { useEffect, useRef } from "react";

export interface UseModalLockProps {
  isLocked: boolean;
  onClose: () => void;
}

export function useModalLock({ isLocked, onClose }: UseModalLockProps) {
  const originalOnClose = useRef(onClose);

  // Update the ref when onClose changes
  useEffect(() => {
    originalOnClose.current = onClose;
  }, [onClose]);

  // Create a locked version of onClose
  const lockedOnClose = () => {
    if (!isLocked) {
      console.log("🔓 Modal unlocked, closing allowed");
      originalOnClose.current();
    } else {
      console.log("🔒 Modal locked, closing prevented");
    }
  };

  // Prevent all closing mechanisms when locked
  useEffect(() => {
    if (!isLocked) return;

    console.log("🔒 Modal lock activated");

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        console.log("🔒 ESC blocked - transaction in progress");
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLocked) {
        e.preventDefault();
        e.returnValue =
          "Transaction in progress. Are you sure you want to leave?";
      }
    };

    // Add all event listeners
    document.addEventListener("keydown", handleEscape, true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      console.log("🔓 Modal lock deactivated");
      document.removeEventListener("keydown", handleEscape, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLocked]);

  return {
    lockedOnClose,
    isLocked,
  };
}



