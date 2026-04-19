import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AppContext = createContext({});

export const LIGHT = {
  blue:"#1A56DB", dark:"#0F172A", white:"#FFFFFF", green:"#10B981",
  gold:"#F59E0B", red:"#EF4444", light:"#F8FAFF", muted:"#64748B",
  border:"#E2E8F0", bg:"#F8FAFF", cardBg:"#FFFFFF", inputBg:"#FFFFFF",
  inputDisabledBg:"#F1F5F9", expandBg:"#FAFBFF", sheetBg:"#F8FAFF",
  headerBg:"#FFFFFF", textPrimary:"#0F172A", textMuted:"#64748B",
};

export const DARK = {
  blue:"#3B82F6", dark:"#F1F5F9", white:"#1E293B", green:"#34D399",
  gold:"#FBBF24", red:"#F87171", light:"#0F172A", muted:"#94A3B8",
  border:"#334155", bg:"#0F172A", cardBg:"#1E293B", inputBg:"#1E293B",
  inputDisabledBg:"#0F172A", expandBg:"#1A2540", sheetBg:"#0F172A",
  headerBg:"#1E293B", textPrimary:"#F1F5F9", textMuted:"#94A3B8",
};

export const LANGUAGES = ["English", "Français", "Español", "Hausa", "Yoruba", "Igbo"];

export function AppProvider({ children }) {
  const [darkMode, setDarkModeState]   = useState(false);
  const [language, setLanguageState]   = useState("English");
  const [ready, setReady]              = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedDark, savedLang] = await Promise.all([
          AsyncStorage.getItem("@app_darkMode"),
          AsyncStorage.getItem("@app_language"),
        ]);
        if (savedDark !== null) setDarkModeState(savedDark === "true");
        if (savedLang !== null) setLanguageState(savedLang);
      } catch (e) {
        console.warn("Failed to load preferences:", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setDarkMode = async (value) => {
    setDarkModeState(value);
    try { await AsyncStorage.setItem("@app_darkMode", String(value)); }
    catch (e) { console.warn("Failed to save dark mode:", e); }
  };

  const setLanguage = async (value) => {
    setLanguageState(value);
    try { await AsyncStorage.setItem("@app_language", value); }
    catch (e) { console.warn("Failed to save language:", e); }
  };

  const C = darkMode ? DARK : LIGHT;

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, language, setLanguage, C, LANGUAGES, ready }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);