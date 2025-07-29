"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";

interface AccessCode {
  code: string;
  expiresAt: number;
  generatedAt: number;
  duration: number; // in minutes
  vehicleType: string;
  cityId: string;
  tokenId: number;
  isActive: boolean;
}

interface AccessCodeManagerProps {
  tokenId: number;
  vehicleType: string;
  cityId: string;
  onCodeGenerated?: (code: AccessCode) => void;
  onCodeExpired?: (code: AccessCode) => void;
}

export default function AccessCodeManager({
  tokenId,
  vehicleType,
  cityId,
  onCodeGenerated,
  onCodeExpired,
}: AccessCodeManagerProps) {
  const { address } = useAccount();
  const [activeCode, setActiveCode] = useState<AccessCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showCode, setShowCode] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30); // Default 30 minutes

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  // Duration options for individual rental sessions
  const durationOptions = [
    { value: 15, label: "15 minutes", price: "Included" },
    { value: 30, label: "30 minutes", price: "Included" },
    { value: 60, label: "1 hour", price: "Included" },
  ];

  // Generate secure access code
  const generateAccessCode = async (duration: number): Promise<string> => {
    // Use Web Crypto API for secure random generation
    const entropy = crypto.getRandomValues(new Uint8Array(16));
    const timestamp = Date.now();

    // Create unique seed combining user address, timestamp, and entropy
    const seedData = `${address}-${timestamp}-${tokenId}-${entropy.join("")}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(seedData);

    // Hash the seed for additional security
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);

    // Generate 8-character code from hash
    const allowedChars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude confusing chars
    let code = "";

    for (let i = 0; i < 8; i++) {
      const index = hashArray[i] % allowedChars.length;
      code += allowedChars[index];
    }

    return code;
  };

  // Handle code generation
  const handleGenerateCode = async () => {
    if (!address) return;

    setIsGenerating(true);

    try {
      const code = await generateAccessCode(selectedDuration);
      const now = Date.now();
      const expiresAt = now + selectedDuration * 60 * 1000;

      const newAccessCode: AccessCode = {
        code,
        expiresAt,
        generatedAt: now,
        duration: selectedDuration,
        vehicleType,
        cityId,
        tokenId,
        isActive: true,
      };

      setActiveCode(newAccessCode);
      setShowCode(true);
      setTimeRemaining(selectedDuration * 60); // Convert to seconds
      warningShownRef.current = false;

      // Start countdown timer
      startTimer();

      // Callback
      onCodeGenerated?.(newAccessCode);

      console.log("🔑 Access code generated:", {
        code: newAccessCode.code,
        duration: selectedDuration,
        expiresAt: new Date(expiresAt),
      });
    } catch (error) {
      console.error("Failed to generate access code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Start countdown timer
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;

        // Show warning at 5 minutes
        if (newTime === 300 && !warningShownRef.current) {
          // 5 minutes = 300 seconds
          warningShownRef.current = true;
          showExpiryWarning(5);
        }

        // Show final warning at 1 minute
        if (newTime === 60) {
          showExpiryWarning(1);
        }

        // Code expired
        if (newTime <= 0) {
          handleCodeExpiry();
          return 0;
        }

        return newTime;
      });
    }, 1000);
  };

  // Handle code expiry
  const handleCodeExpiry = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (activeCode) {
      const expiredCode = { ...activeCode, isActive: false };
      setActiveCode(expiredCode);
      onCodeExpired?.(expiredCode);
    }

    setShowCode(false);
    setTimeRemaining(0);

    // Show expiry notification
    showExpiryNotification();
  };

  // Show expiry warning
  const showExpiryWarning = (minutes: number) => {
    // This could trigger a toast notification or modal
    console.log(
      `⚠️ Access code expires in ${minutes} minute${minutes !== 1 ? "s" : ""}!`
    );

    // Browser notification (if permission granted)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Moove - Code Expiring Soon", {
        body: `Your access code expires in ${minutes} minute${
          minutes !== 1 ? "s" : ""
        }`,
        icon: "/icon-192.png",
      });
    }
  };

  // Show expiry notification
  const showExpiryNotification = () => {
    console.log("🔴 Access code has expired");

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Moove - Code Expired", {
        body: "Your access code has expired. Generate a new one to continue.",
        icon: "/icon-192.png",
      });
    }
  };

  // Copy code to clipboard
  const copyToClipboard = async () => {
    if (!activeCode) return;

    try {
      await navigator.clipboard.writeText(activeCode.code);
      console.log("📋 Code copied to clipboard");
      // Show success feedback
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            🔑 Access Code
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} •{" "}
            {cityId}
          </p>
        </div>

        {activeCode && activeCode.isActive && (
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              timeRemaining > 300
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : timeRemaining > 60
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            }`}
          >
            {formatTimeRemaining(timeRemaining)}
          </div>
        )}
      </div>

      {/* No active code - Show generation options */}
      {!activeCode || !activeCode.isActive ? (
        <div className="space-y-6">
          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select rental duration
            </label>
            <div className="grid grid-cols-1 gap-3">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedDuration(option.value)}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedDuration === option.value
                      ? "border-moove-primary bg-moove-primary/10 dark:bg-moove-primary/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-moove-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Perfect for short trips
                      </div>
                    </div>
                    <div className="text-lg font-bold text-moove-primary">
                      {option.price}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="w-full bg-moove-primary hover:bg-moove-primary/90 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Generating Code...
              </span>
            ) : (
              `Generate ${selectedDuration}-min Access Code`
            )}
          </button>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              💡 How it works
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Your 30-day pass allows unlimited code generation</li>
              <li>• Each code is valid for your selected duration</li>
              <li>
                • Find any compatible {vehicleType} in {cityId}
              </li>
              <li>• Enter your code to unlock and start riding</li>
              <li>• Generate new codes anytime during your 30-day pass</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Active code display */
        <div className="space-y-6">
          {/* Code Display */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Your Access Code
              </label>
              <div
                className="text-4xl font-mono font-bold text-moove-primary tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded transition-colors"
                onClick={copyToClipboard}
                title="Click to copy"
              >
                {showCode ? activeCode.code : "••••••••"}
              </div>
              <button
                onClick={() => setShowCode(!showCode)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mt-2"
              >
                {showCode ? "👁️ Hide Code" : "👁️ Show Code"}
              </button>
            </div>

            <button
              onClick={copyToClipboard}
              className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
            >
              📋 Copy to Clipboard
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Time remaining
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  timeRemaining > 300
                    ? "bg-green-500"
                    : timeRemaining > 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${(timeRemaining / (selectedDuration * 60)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
              🚀 Ready to ride!
            </h4>
            <ol className="text-sm text-green-800 dark:text-green-300 space-y-1">
              <li>
                1. Find any compatible {vehicleType} in {cityId}
              </li>
              <li>2. Look for QR code or unlock interface on the vehicle</li>
              <li>
                3. Enter your access code:{" "}
                <strong>{showCode ? activeCode.code : "••••••••"}</strong>
              </li>
              <li>4. Vehicle will unlock and you can start riding</li>
            </ol>
          </div>

          {/* Warning if expiring soon */}
          {timeRemaining <= 300 && timeRemaining > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Code expires soon!
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Your access code will expire in{" "}
                    {formatTimeRemaining(timeRemaining)}. Make sure to find and
                    unlock a vehicle before it expires.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New Code Button */}
          <button
            onClick={() => {
              setActiveCode(null);
              setShowCode(false);
              setTimeRemaining(0);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Generate New Code
          </button>
        </div>
      )}
    </div>
  );
}

// Hook to manage multiple access codes
export function useAccessCodeManager() {
  const [activeCodes, setActiveCodes] = useState<AccessCode[]>([]);
  const [codeHistory, setCodeHistory] = useState<AccessCode[]>([]);

  const addCode = (code: AccessCode) => {
    setActiveCodes((prev) => [...prev, code]);
  };

  const expireCode = (expiredCode: AccessCode) => {
    setActiveCodes((prev) =>
      prev.filter((code) => code.code !== expiredCode.code)
    );
    setCodeHistory((prev) => [...prev, expiredCode]);
  };

  const getActiveCodeFor = (tokenId: number): AccessCode | null => {
    return (
      activeCodes.find(
        (code) =>
          code.tokenId === tokenId &&
          code.isActive &&
          code.expiresAt > Date.now()
      ) || null
    );
  };

  const getTotalCodesGenerated = (): number => {
    return activeCodes.length + codeHistory.length;
  };

  const clearExpiredCodes = () => {
    const now = Date.now();
    const stillActive = activeCodes.filter((code) => code.expiresAt > now);
    const newlyExpired = activeCodes.filter((code) => code.expiresAt <= now);

    setActiveCodes(stillActive);
    setCodeHistory((prev) => [...prev, ...newlyExpired]);
  };

  return {
    activeCodes,
    codeHistory,
    addCode,
    expireCode,
    getActiveCodeFor,
    getTotalCodesGenerated,
    clearExpiredCodes,
  };
}
