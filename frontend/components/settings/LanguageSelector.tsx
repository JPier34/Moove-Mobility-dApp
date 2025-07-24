"use client";

import React from "react";
import { useTranslation } from "@/hooks/useTranslation";

export default function LanguageSelector() {
  const { language, changeLanguage, availableLanguages } = useTranslation();

  const languageNames = {
    en: "English",
    it: "Italiano",
  };

  const languageFlags = {
    en: "🇺🇸",
    it: "🇮🇹",
  };

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value as "en" | "it")}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-moove-primary focus:border-transparent"
      >
        {availableLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {languageFlags[lang]} {languageNames[lang]}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
