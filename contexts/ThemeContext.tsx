import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkTheme, lightTheme, accentColors, statusColors, userColors, categoryColors } from "@/constants/colors";

type ThemeMode = "light" | "dark" | "system";

interface Theme {
  // Theme mode
  mode: ThemeMode;
  isDark: boolean;

  // Background colors
  background: string;
  surface: string;
  surfaceLight: string;

  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;

  // Border colors
  border: string;
  borderLight: string;

  // Input colors
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  inputBorderFocused: string;

  // Navigation
  navBackground: string;
  navIconActive: string;
  navIconInactive: string;
  tabIconActiveBackground: string;

  // Accent colors (same for both themes)
  accent: typeof accentColors;

  // Status colors
  status: typeof statusColors;

  // User colors
  userColors: typeof userColors;

  // Category colors
  categoryColors: typeof categoryColors;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@home_app_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(newMode);
  };

  // Determine if dark mode should be active
  const isDark =
    themeMode === "dark" || (themeMode === "system" && systemColorScheme === "dark");

  // Get the appropriate theme colors
  const themeColors = isDark ? darkTheme : lightTheme;

  const theme: Theme = {
    mode: themeMode,
    isDark,
    ...themeColors,
    accent: accentColors,
    status: statusColors,
    userColors,
    categoryColors,
  };

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
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

// Helper hook to get just the theme object
export function useThemeColors() {
  const { theme } = useTheme();
  return theme;
}
