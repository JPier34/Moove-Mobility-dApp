"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useTheme as useCustomTheme } from "@/hooks/useTheme";

// Create theme context
interface ThemeContextType {
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  config: {
    autoSwitch: boolean;
    darkStart: number;
    darkEnd: number;
  };
  updateConfig: (config: any) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // ✅ Use our custom theme hook at TOP LEVEL
  const themeData = useCustomTheme();

  return (
    <ThemeContext.Provider value={themeData}>{children}</ThemeContext.Provider>
  );
}

// ✅ Hook to use theme anywhere in the app
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
