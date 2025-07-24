"use client";

import { useEffect } from "react";

export const PerformanceMonitor = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === "navigation") {
          console.log("Page Load Time:", entry.duration);
        }
        if (entry.entryType === "largest-contentful-paint") {
          console.log("LCP:", entry.startTime);
        }
        if (entry.entryType === "first-input") {
          const fiEntry = entry as PerformanceEventTiming;
          const fid = fiEntry.processingStart - fiEntry.startTime;
          console.log("FID:", fid);
        }
      });
    });

    observer.observe({
      entryTypes: ["navigation", "largest-contentful-paint", "first-input"],
    });

    return () => observer.disconnect();
  }, []);

  return null; // This component doesn't render anything
};
