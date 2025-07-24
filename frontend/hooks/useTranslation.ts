import { useState, useEffect, useCallback } from "react";
import EN_TRANSLATIONS from "@/locales/en.json";
import IT_TRANSLATIONS from "@/locales/it.json";

type Language = "en" | "it";
type TranslationKey = string;

const TRANSLATIONS = {
  en: EN_TRANSLATIONS,
  it: IT_TRANSLATIONS,
};

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>("en");

  // Get browser language
  const getBrowserLanguage = useCallback((): Language => {
    if (typeof window === "undefined") return "en";

    const browserLang = navigator.language.split("-")[0] as Language;
    return ["en", "it"].includes(browserLang) ? browserLang : "en";
  }, []);

  // Get nested translation value
  const getTranslation = useCallback(
    (key: TranslationKey, params?: Record<string, string>): string => {
      const keys = key.split(".");
      let value: any = TRANSLATIONS[language];

      for (const k of keys) {
        value = value?.[k];
      }

      if (typeof value !== "string") {
        console.warn(
          `Translation missing for key: ${key} in language: ${language}`
        );
        return key; // Return key as fallback
      }

      // Replace parameters in translation
      if (params) {
        return Object.entries(params).reduce((text, [param, replacement]) => {
          return text.replace(new RegExp(`{{${param}}}`, "g"), replacement);
        }, value);
      }

      return value;
    },
    [language]
  );

  // Short alias for getTranslation
  const t = getTranslation;

  // Change language
  const changeLanguage = useCallback((newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem("moove-language", newLang);

    // Update HTML lang attribute
    if (typeof window !== "undefined") {
      document.documentElement.lang = newLang;
    }
  }, []);

  // Initialize language
  useEffect(() => {
    const savedLang = localStorage.getItem("moove-language") as Language;
    const initialLang = savedLang || getBrowserLanguage();
    setLanguage(initialLang);

    if (typeof window !== "undefined") {
      document.documentElement.lang = initialLang;
    }
  }, [getBrowserLanguage]);

  return {
    language,
    changeLanguage,
    t,
    availableLanguages: ["en", "it"] as Language[],
  };
};
