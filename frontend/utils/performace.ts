import React from "react";

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure function execution time
  measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.metrics.set(name, duration);

      if (duration > 1000) {
        // Log slow operations
        console.warn(
          `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`
        );
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(
        `Operation failed: ${name} after ${duration.toFixed(2)}ms`,
        error
      );
      throw error;
    }
  };

  // Get Core Web Vitals with correct types
  getCoreWebVitals = (): Promise<any> => {
    return new Promise((resolve) => {
      const vitals: any = {};

      // Largest Contentful Paint
      if ("PerformanceObserver" in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              vitals.lcp = entries[entries.length - 1].startTime;
            }
          });
          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        } catch (e) {
          console.warn("LCP observation not supported");
        }

        // First Input Delay with correct type casting
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              // ✅ FIXED: Type assertion for PerformanceEventTiming
              const eventEntry = entry as PerformanceEventTiming;
              if (eventEntry.processingStart) {
                vitals.fid = eventEntry.processingStart - eventEntry.startTime;
              }
            });
          });
          fidObserver.observe({ entryTypes: ["first-input"] });
        } catch (e) {
          console.warn("FID observation not supported");
        }

        // Cumulative Layout Shift with correct type casting
        try {
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            vitals.cls = entries.reduce((cls, entry) => {
              // Type assertion for LayoutShift
              const layoutEntry = entry as PerformanceEntry & {
                value?: number;
              };
              return cls + (layoutEntry.value || 0);
            }, 0);
          });
          clsObserver.observe({ entryTypes: ["layout-shift"] });
        } catch (e) {
          console.warn("CLS observation not supported");
        }
      }

      setTimeout(() => resolve(vitals), 5000); // Wait 5 seconds to collect data
    });
  };

  // Report metrics
  getMetrics = () => {
    return Object.fromEntries(this.metrics);
  };

  // Clear metrics
  clearMetrics = () => {
    this.metrics.clear();
  };

  // Navigation timing metrics
  getNavigationMetrics = () => {
    if ("performance" in window && "navigation" in performance) {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;

      return {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        domProcessing:
          navigation.domContentLoadedEventStart - navigation.responseEnd,
        domComplete:
          navigation.domComplete - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        ttfb: navigation.responseStart - navigation.requestStart, // Time to First Byte
      };
    }
    return null;
  };

  // Resource timing metrics
  getResourceMetrics = () => {
    if ("performance" in window) {
      const resources = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];

      return resources.map((resource) => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize || 0,
        type: resource.initiatorType,
        startTime: resource.startTime,
      }));
    }
    return [];
  };
}

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();

  const measureOperation = async <T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return monitor.measureAsync(name, operation);
  };

  return {
    measureOperation,
    getMetrics: monitor.getMetrics,
    clearMetrics: monitor.clearMetrics,
    getCoreWebVitals: monitor.getCoreWebVitals,
    getNavigationMetrics: monitor.getNavigationMetrics,
    getResourceMetrics: monitor.getResourceMetrics,
  };
};

// Performance monitoring component
export const PerformanceReporter = () => {
  React.useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();

    // Report metrics after page load
    const reportMetrics = async () => {
      const vitals = await monitor.getCoreWebVitals();
      const navigation = monitor.getNavigationMetrics();
      const resources = monitor.getResourceMetrics();

      console.log("Performance Metrics:", {
        vitals,
        navigation,
        resourceCount: resources.length,
        customMetrics: monitor.getMetrics(),
      });

      // In production, send to analytics;
    };

    // Wait for page load
    if (document.readyState === "complete") {
      setTimeout(reportMetrics, 1000);
    } else {
      window.addEventListener("load", () => {
        setTimeout(reportMetrics, 1000);
      });
    }
  }, []);

  return null; // This component doesn't render anything
};
