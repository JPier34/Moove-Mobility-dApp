"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);

    // Read saved theme from localStorage
    const savedTheme = localStorage.getItem("moove-theme") as Theme;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateResolvedTheme = () => {
      let resolved: "light" | "dark";

      if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } else {
        resolved = theme;
      }

      console.log(`🎨 Theme update: ${theme} -> ${resolved}`);

      setResolvedTheme(resolved);

      // Apply classes to HTML element
      const html = document.documentElement;
      html.classList.remove("light", "dark");
      html.classList.add(resolved);

      html.setAttribute("data-theme", resolved);

      // Salva nel localStorage
      localStorage.setItem("moove-theme", theme);

      // Dispatch event
      window.dispatchEvent(
        new CustomEvent("theme-changed", {
          detail: { theme, resolvedTheme: resolved },
        })
      );
    };

    updateResolvedTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateResolvedTheme);

      return () =>
        mediaQuery.removeEventListener("change", updateResolvedTheme);
    }
  }, [theme, mounted]);

  const handleSetTheme = (newTheme: Theme) => {
    console.log(`🎨 Setting theme: ${newTheme}`);
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = resolvedTheme === "light" ? "dark" : "light";
    console.log(`🎨 Toggling theme: ${resolvedTheme} -> ${newTheme}`);
    handleSetTheme(newTheme);
  };

  // Do not render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: "system",
          resolvedTheme: "light", // temporary fallback
          setTheme: () => {},
          toggleTheme: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme: handleSetTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Debug hook
export function useThemeDebug() {
  const theme = useTheme();

  useEffect(() => {
    console.log("🔍 Theme Debug:", {
      theme: theme.theme,
      resolved: theme.resolvedTheme,
      htmlClasses: document.documentElement.classList.toString(),
      localStorage: localStorage.getItem("moove-theme"),
    });
  }, [theme.theme, theme.resolvedTheme]);

  return theme;
}
