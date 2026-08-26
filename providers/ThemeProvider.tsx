import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { theme, colors, darkColors, type Theme, type ColorPalette } from '@/lib/theme';
import { isSSR } from '@/lib/ssrStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark';
type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = '@loop_theme_mode';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: ColorPalette;
  theme: Theme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  forcedColorScheme?: ColorScheme;
}

export function ThemeProvider({ children, forcedColorScheme }: ThemeProviderProps) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    // Skip AsyncStorage during SSR
    if (isSSR) {
      setIsLoaded(true);
      return;
    }

    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        // Ignore storage errors, use default
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference when changed
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    // Skip AsyncStorage during SSR
    if (isSSR) return;
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      // Ignore storage errors
    }
  }, []);

  // Toggle between light → dark → system → light
  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    setThemeMode(nextMode);
  }, [themeMode, setThemeMode]);

  const value = useMemo<ThemeContextValue>(() => {
    // Use forced scheme, user preference, or device default
    let colorScheme: ColorScheme;
    if (forcedColorScheme) {
      colorScheme = forcedColorScheme;
    } else if (themeMode === 'system') {
      colorScheme = deviceColorScheme === 'dark' ? 'dark' : 'light';
    } else {
      colorScheme = themeMode;
    }
    const isDark = colorScheme === 'dark';

    return {
      colorScheme,
      colors: isDark ? darkColors : colors,
      theme,
      isDark,
      themeMode,
      setThemeMode,
      toggleTheme,
    };
  }, [forcedColorScheme, deviceColorScheme, themeMode, setThemeMode, toggleTheme]);

  // Don't render until we've loaded the theme preference
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Convenience hooks
export function useColors(): ColorPalette {
  return useTheme().colors;
}

export function useIsDark(): boolean {
  return useTheme().isDark;
}
