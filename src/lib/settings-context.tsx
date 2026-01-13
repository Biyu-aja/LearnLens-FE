"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark" | "system";
type Language = "id" | "en";

interface UserSettings {
  theme: Theme;
  language: Language;
  emailNotifications: boolean;
  soundEnabled: boolean;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  applyTheme: (theme: Theme) => void;
}

const defaultSettings: UserSettings = {
  theme: "system",
  language: "id",
  emailNotifications: true,
  soundEnabled: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Apply theme to document
  const applyTheme = useCallback((theme: Theme) => {
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else if (theme === "light") {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      }
    }
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("learnlens-settings");
      if (saved) {
        const parsed = JSON.parse(saved) as UserSettings;
        setSettings(parsed);
        applyTheme(parsed.theme);
      } else {
        // Apply default theme
        applyTheme(defaultSettings.theme);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
      applyTheme(defaultSettings.theme);
    }
    setIsLoaded(true);
  }, [applyTheme]);

  // Listen for system theme changes when using "system" theme
  useEffect(() => {
    if (settings.theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [settings.theme, applyTheme]);

  // Update settings and save to localStorage
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("learnlens-settings", JSON.stringify(updated));
      
      // Apply theme if changed
      if (newSettings.theme) {
        applyTheme(newSettings.theme);
      }
      
      return updated;
    });
  }, [applyTheme]);

  // Prevent flash of wrong theme
  if (!isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, applyTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Hook to get current language
export function useLanguage() {
  const { settings } = useSettings();
  return settings.language;
}

// Translations
const translations = {
  id: {
    // Common
    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    loading: "Memuat...",
    error: "Terjadi kesalahan",
    success: "Berhasil",
    
    // Settings
    settings: "Pengaturan",
    account: "Akun",
    appearance: "Tampilan",
    language: "Bahasa",
    notifications: "Notifikasi",
    logout: "Keluar",
    
    // Theme
    light: "Terang",
    dark: "Gelap",
    system: "Sistem",
    
    // Chat
    askQuestion: "Tanyakan sesuatu tentang materi Anda...",
    clearHistory: "Hapus Riwayat",
    
    // Glossary
    glossary: "Glosarium",
    addToGlossary: "Tambah ke Glosarium",
    explainThis: "Jelaskan Ini",
    
    // Quiz
    quiz: "Kuis",
    generateQuiz: "Buat Kuis",
    
    // Summary
    summary: "Ringkasan",
    generateSummary: "Buat Ringkasan",
  },
  en: {
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    loading: "Loading...",
    error: "An error occurred",
    success: "Success",
    
    // Settings
    settings: "Settings",
    account: "Account",
    appearance: "Appearance",
    language: "Language",
    notifications: "Notifications",
    logout: "Logout",
    
    // Theme
    light: "Light",
    dark: "Dark",
    system: "System",
    
    // Chat
    askQuestion: "Ask something about your material...",
    clearHistory: "Clear History",
    
    // Glossary
    glossary: "Glossary",
    addToGlossary: "Add to Glossary",
    explainThis: "Explain This",
    
    // Quiz
    quiz: "Quiz",
    generateQuiz: "Generate Quiz",
    
    // Summary
    summary: "Summary",
    generateSummary: "Generate Summary",
  },
};

export type TranslationKey = keyof typeof translations.en;

// Hook to get translations
export function useTranslation() {
  const { settings } = useSettings();
  
  const t = useCallback((key: TranslationKey): string => {
    return translations[settings.language]?.[key] || translations.en[key] || key;
  }, [settings.language]);
  
  return { t, language: settings.language };
}
