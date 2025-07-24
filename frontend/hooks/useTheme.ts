"use client";

import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeConfig {
  autoSwitch: boolean;
  darkStart: number; // Hour (24h format)
  darkEnd: number; // Hour (24h format)
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [config, setConfig] = useState<ThemeConfig>({
    autoSwitch: true,
    darkStart: 20, // 8 PM
    darkEnd: 7, // 7 AM
  });

  // Get system preference
  const getSystemTheme = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Get auto theme based on time
  const getAutoTheme = useCallback((): "light" | "dark" => {
    const hour = new Date().getHours();
    const { darkStart, darkEnd } = config;

    // Handle overnight period (e.g., 20:00 to 7:00)
    if (darkStart > darkEnd) {
      return hour >= darkStart || hour < darkEnd ? "dark" : "light";
    }
    // Handle same-day period
    return hour >= darkStart && hour < darkEnd ? "dark" : "light";
  }, [config]);

  // Resolve actual theme to apply
  const resolveTheme = useCallback(
    (currentTheme: Theme): "light" | "dark" => {
      switch (currentTheme) {
        case "light":
          return "light";
        case "dark":
          return "dark";
        case "system":
          return config.autoSwitch ? getAutoTheme() : getSystemTheme();
        default:
          return "light";
      }
    },
    [config.autoSwitch, getAutoTheme, getSystemTheme]
  );

  // Apply theme to DOM
  const applyTheme = useCallback((themeToApply: "light" | "dark") => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(themeToApply);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        themeToApply === "dark" ? "#1f2937" : "#ffffff"
      );
    }

    setResolvedTheme(themeToApply);
  }, []);

  // Toggle between light/dark (skips system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("moove-theme", newTheme);
  }, [resolvedTheme, applyTheme]);

  // Set specific theme
  const setThemeMode = useCallback(
    (newTheme: Theme) => {
      setTheme(newTheme);
      const resolved = resolveTheme(newTheme);
      applyTheme(resolved);
      localStorage.setItem("moove-theme", newTheme);
    },
    [resolveTheme, applyTheme]
  );

  // Update theme config
  const updateConfig = useCallback(
    (newConfig: Partial<ThemeConfig>) => {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      localStorage.setItem("moove-theme-config", JSON.stringify(updatedConfig));

      // Re-resolve theme if using system/auto
      if (theme === "system") {
        const resolved = resolveTheme(theme);
        applyTheme(resolved);
      }
    },
    [config, theme, resolveTheme, applyTheme]
  );

  // Initialize theme on mount
  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem("moove-theme") as Theme;
    const savedConfig = localStorage.getItem("moove-theme-config");

    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.warn("Invalid theme config in localStorage");
      }
    }

    const initialTheme = savedTheme || "system";
    setTheme(initialTheme);

    const resolved = resolveTheme(initialTheme);
    applyTheme(resolved);
  }, [resolveTheme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const resolved = resolveTheme(theme);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, resolveTheme, applyTheme]);

  // Auto-switch based on time (check every minute)
  useEffect(() => {
    if (!config.autoSwitch || theme !== "system") return;

    const interval = setInterval(() => {
      const resolved = resolveTheme(theme);
      if (resolved !== resolvedTheme) {
        applyTheme(resolved);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [config.autoSwitch, theme, resolvedTheme, resolveTheme, applyTheme]);

  return {
    theme,
    resolvedTheme,
    config,
    toggleTheme,
    setTheme: setThemeMode,
    updateConfig,
  };
};
