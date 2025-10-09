"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Type for the setter function that accepts either a value or an updater function
 */
type SetValue<T> = T | ((prevValue: T) => T);

/**
 * Options for the useLocalStorage hook
 */
interface UseLocalStorageOptions<T> {
  /**
   * Custom serializer function (default: JSON.stringify)
   */
  serializer?: (value: T) => string;

  /**
   * Custom deserializer function (default: JSON.parse)
   */
  deserializer?: (value: string) => T;

  /**
   * If true, synchronizes state across browser tabs/windows
   */
  syncTabs?: boolean;

  /**
   * Callback when storage sync happens from another tab
   */
  onSync?: (newValue: T) => void;
}

/**
 * 🔥 PRODUCTION-READY: useLocalStorage Hook
 *
 * Solves critical issues:
 * 1. ✅ Race conditions with functional updates
 * 2. ✅ Atomic localStorage sync
 * 3. ✅ Error handling and fallbacks
 * 4. ✅ Cross-tab synchronization
 * 5. ✅ TypeScript support
 * 6. ✅ SSR compatibility
 *
 * @example
 * const [notifications, setNotifications] = useLocalStorage<Notification[]>(
 *   'moove-notifications',
 *   [],
 *   { syncTabs: true }
 * );
 *
 * // ✅ SAFE: Functional update prevents race conditions
 * setNotifications(prev => prev.filter(n => n.id !== notificationId));
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    syncTabs = false,
    onSync,
  } = options;

  // ✅ OPTIMIZATION: Prevent re-creating options on every render
  const optionsRef = useRef({ serializer, deserializer, onSync });
  useEffect(() => {
    optionsRef.current = { serializer, deserializer, onSync };
  }, [serializer, deserializer, onSync]);

  // ✅ SSR SAFETY: Check if window is available
  const isClient = typeof window !== "undefined";

  /**
   * Read value from localStorage with error handling
   */
  const readValue = useCallback((): T => {
    if (!isClient) {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);

      if (item === null) {
        return initialValue;
      }

      return optionsRef.current.deserializer(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, isClient]);

  // ✅ SSR SAFE: Initialize with initialValue, then sync with localStorage on client
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ CLIENT-SIDE SYNC: Update state with localStorage value after hydration
  useEffect(() => {
    if (isClient) {
      const actualValue = readValue();
      setStoredValue(actualValue);
      setIsHydrated(true);
    }
  }, [isClient, key]); // Only run once after mount

  /**
   * ✅ ATOMIC: Write to localStorage AND update state together
   * This prevents the "reload before sync" bug
   */
  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (!isClient) {
        console.warn(`Tried to set localStorage key "${key}" on server`);
        return;
      }

      try {
        // ✅ CRITICAL: Use functional update to prevent race conditions
        setStoredValue((prevValue) => {
          // Resolve the new value (handle both direct values and updater functions)
          const valueToStore =
            value instanceof Function ? value(prevValue) : value;

          try {
            // ✅ ATOMIC: Update localStorage immediately after state calculation
            window.localStorage.setItem(
              key,
              optionsRef.current.serializer(valueToStore)
            );
          } catch (error) {
            console.error(`Error writing localStorage key "${key}":`, error);
          }

          return valueToStore;
        });
      } catch (error) {
        console.error(`Error in setValue for key "${key}":`, error);
      }
    },
    [key, isClient]
  );

  /**
   * Clear the value from localStorage and reset to initial value
   */
  const removeValue = useCallback(() => {
    if (!isClient) {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, isClient]);

  /**
   * ✅ CROSS-TAB SYNC: Listen to storage events from other tabs
   */
  useEffect(() => {
    if (!isClient || !syncTabs) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      // Only process events for this specific key
      if (e.key !== key) {
        return;
      }

      try {
        if (e.newValue === null) {
          // Key was removed in another tab
          setStoredValue(initialValue);
        } else {
          // Key was updated in another tab
          const newValue = optionsRef.current.deserializer(e.newValue);
          setStoredValue(newValue);

          // Notify callback if provided
          if (optionsRef.current.onSync) {
            optionsRef.current.onSync(newValue);
          }
        }
      } catch (error) {
        console.error(
          `Error syncing localStorage key "${key}" from another tab:`,
          error
        );
      }
    };

    // ✅ CROSS-TAB: Listen to storage events
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue, isClient, syncTabs]);

  return [storedValue, setValue, removeValue];
}

/**
 * 🎯 SPECIALIZED HOOK: For array-based notifications
 *
 * Provides common operations with built-in race condition prevention
 */
export function useNotificationStorage<T extends { id: string }>(
  key: string,
  options: UseLocalStorageOptions<T[]> = {}
) {
  const [notifications, setNotifications, clearNotifications] = useLocalStorage<
    T[]
  >(key, [], options);

  /**
   * ✅ SAFE: Add notification with duplicate check
   */
  const addNotification = useCallback(
    (notification: T) => {
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.id === notification.id)) {
          console.warn(`Notification ${notification.id} already exists`);
          return prev;
        }
        return [...prev, notification];
      });
    },
    [setNotifications]
  );

  /**
   * ✅ SAFE: Remove notification by ID
   */
  const removeNotification = useCallback(
    (notificationId: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    },
    [setNotifications]
  );

  /**
   * ✅ SAFE: Update notification by ID
   */
  const updateNotification = useCallback(
    (notificationId: string, updates: Partial<T>) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, ...updates } : n))
      );
    },
    [setNotifications]
  );

  /**
   * ✅ SAFE: Bulk operations
   */
  const addMultiple = useCallback(
    (newNotifications: T[]) => {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const uniqueNew = newNotifications.filter(
          (n) => !existingIds.has(n.id)
        );
        return [...prev, ...uniqueNew];
      });
    },
    [setNotifications]
  );

  return {
    notifications,
    setNotifications,
    addNotification,
    removeNotification,
    updateNotification,
    addMultiple,
    clearAll: clearNotifications,
  };
}
