"use client";

import React, { useState, useEffect } from "react";
import { useNotificationStorage } from "@/hooks/useLocalStorage";

interface TestNotification {
  id: string;
  message: string;
  timestamp: number;
}

/**
 * 🧪 TEST COMPONENT: Verifies race condition fixes
 *
 * This component helps you test:
 * 1. ✅ Rapid simultaneous deletions
 * 2. ✅ Concurrent additions and deletions
 * 3. ✅ Cross-tab synchronization
 * 4. ✅ localStorage persistence on reload
 *
 * HOW TO USE:
 * 1. Add this component to your app
 * 2. Click "Stress Test" to simulate rapid operations
 * 3. Open in multiple tabs to test sync
 * 4. Reload page to test persistence
 */
export default function RaceConditionTest() {
  const { notifications, addNotification, removeNotification, clearAll } =
    useNotificationStorage<TestNotification>("test-notifications", {
      syncTabs: true,
    });

  const [testLog, setTestLog] = useState<string[]>([]);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ PREVENT HYDRATION ERROR: Only show content after client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const log = (message: string) => {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
    setTestLog((prev) => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    console.log(`[TEST] ${message}`);
  };

  /**
   * ✅ TEST #1: Add single notification
   */
  const handleAddOne = () => {
    const id = `test-${Date.now()}`;
    addNotification({
      id,
      message: `Test notification ${id}`,
      timestamp: Date.now(),
    });
    log(`✅ Added notification ${id}`);
  };

  /**
   * ✅ TEST #2: Add multiple notifications rapidly
   */
  const handleAddMultiple = () => {
    const count = 5;
    log(`🚀 Adding ${count} notifications rapidly...`);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const id = `rapid-${Date.now()}-${i}`;
        addNotification({
          id,
          message: `Rapid notification #${i + 1}`,
          timestamp: Date.now(),
        });
        log(`✅ Added rapid notification ${i + 1}/${count}`);
      }, i * 10); // 10ms intervals (very fast!)
    }
  };

  /**
   * ✅ TEST #3: Delete multiple notifications simultaneously
   * This is the CRITICAL test for race conditions
   */
  const handleDeleteMultiple = () => {
    const toDelete = notifications.slice(0, 3);

    if (toDelete.length === 0) {
      log(`⚠️ No notifications to delete. Add some first!`);
      return;
    }

    log(`🗑️ Deleting ${toDelete.length} notifications simultaneously...`);

    // ✅ Simulate user clicking multiple delete buttons rapidly
    toDelete.forEach((notification, index) => {
      setTimeout(() => {
        removeNotification(notification.id);
        log(`✅ Deleted notification ${index + 1}/${toDelete.length}`);
      }, index * 5); // 5ms intervals (extremely fast!)
    });
  };

  /**
   * ✅ TEST #4: Stress test with concurrent add/delete operations
   * This simulates real-world chaos!
   */
  const handleStressTest = async () => {
    setIsStressTesting(true);
    log(`🔥 Starting stress test...`);

    try {
      // Phase 1: Add many notifications
      log(`📝 Phase 1: Adding 10 notifications...`);
      for (let i = 0; i < 10; i++) {
        addNotification({
          id: `stress-${Date.now()}-${i}`,
          message: `Stress test notification ${i + 1}`,
          timestamp: Date.now(),
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Phase 2: Delete half of them rapidly
      log(`🗑️ Phase 2: Deleting 5 notifications rapidly...`);
      const toDelete = notifications.slice(0, 5);
      toDelete.forEach((n, i) => {
        setTimeout(() => removeNotification(n.id), i * 10);
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Phase 3: Add more while deleting
      log(`🔄 Phase 3: Concurrent add/delete operations...`);
      for (let i = 0; i < 5; i++) {
        // Add
        addNotification({
          id: `concurrent-${Date.now()}-${i}`,
          message: `Concurrent notification ${i + 1}`,
          timestamp: Date.now(),
        });

        // Delete (if any exist)
        if (notifications.length > 0) {
          const randomIndex = Math.floor(Math.random() * notifications.length);
          removeNotification(notifications[randomIndex].id);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      log(`✅ Stress test completed!`);
      log(`📊 Final count: ${notifications.length} notifications`);
    } catch (error) {
      log(`❌ Stress test failed: ${error}`);
    } finally {
      setIsStressTesting(false);
    }
  };

  /**
   * ✅ TEST #5: Clear all notifications
   */
  const handleClearAll = () => {
    log(`🧹 Clearing all ${notifications.length} notifications...`);
    clearAll();
    log(`✅ All notifications cleared`);
  };

  /**
   * ✅ TEST #6: Check localStorage directly
   */
  const handleCheckStorage = () => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("test-notifications");
    const parsed = stored ? JSON.parse(stored) : [];

    log(`💾 localStorage contains ${parsed.length} notifications`);
    log(`📊 React state contains ${notifications.length} notifications`);

    if (parsed.length === notifications.length) {
      log(`✅ localStorage and state are in sync!`);
    } else {
      log(
        `❌ SYNC ERROR: localStorage (${parsed.length}) ≠ state (${notifications.length})`
      );
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[99999] bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-6 w-96 max-h-[600px] overflow-y-auto">
      {/* ✅ PREVENT HYDRATION ERROR: Show loading state until hydrated */}
      {!isHydrated ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🧪 Race Condition Test
            </h2>
            <p className="text-sm text-gray-600">
              Test notification persistence and race condition fixes
            </p>
          </div>

          {/* Stats */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Active Notifications:
              </span>
              <span className="text-lg font-bold text-blue-600">
                {notifications.length}
              </span>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2 mb-4">
            <button
              onClick={handleAddOne}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              ➕ Add One Notification
            </button>

            <button
              onClick={handleAddMultiple}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              🚀 Add 5 Rapidly
            </button>

            <button
              onClick={handleDeleteMultiple}
              disabled={notifications.length === 0}
              className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Delete 3 Simultaneously
            </button>

            <button
              onClick={handleStressTest}
              disabled={isStressTesting}
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isStressTesting ? "⏳ Testing..." : "🔥 Stress Test"}
            </button>

            <button
              onClick={handleCheckStorage}
              className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
            >
              💾 Check Sync
            </button>

            <button
              onClick={handleClearAll}
              disabled={notifications.length === 0}
              className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              🧹 Clear All
            </button>
          </div>

          {/* Test Log */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Test Log:
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 h-32 overflow-y-auto font-mono text-xs">
              {testLog.length === 0 ? (
                <p className="text-gray-400 italic">No tests run yet...</p>
              ) : (
                testLog.map((entry, index) => (
                  <div
                    key={index}
                    className={`mb-1 ${
                      entry.includes("❌")
                        ? "text-red-600"
                        : entry.includes("✅")
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Notifications ({notifications.length}):
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No notifications</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-xs text-gray-600 truncate flex-1">
                      {notification.message}
                    </span>
                    <button
                      onClick={() => {
                        removeNotification(notification.id);
                        log(`🗑️ Deleted: ${notification.id}`);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="text-xs font-semibold text-yellow-800 mb-1">
              💡 Testing Tips:
            </h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Open in 2+ tabs to test cross-tab sync</li>
              <li>• Reload page to test persistence</li>
              <li>• Click "Delete 3 Simultaneously" multiple times rapidly</li>
              <li>• Watch the log for errors or sync issues</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
