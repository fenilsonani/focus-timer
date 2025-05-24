import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { createTheme, ThemeMetadata } from '../constants/theme';
import { useAppState } from './useAppState';

type ThemeMode = 'light' | 'dark' | 'auto';
type ColorTheme = keyof typeof ThemeMetadata;
type Theme = ReturnType<typeof createTheme>;

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  colorTheme: ColorTheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const { state, updateSettings } = useAppState();
  
  const mode = state.settings.theme;
  const colorTheme = state.settings.colorTheme || 'default';
  const isDark = mode === 'dark' || (mode === 'auto' && systemColorScheme === 'dark');
  const theme = createTheme(isDark ? 'dark' : 'light', colorTheme);

  const handleSetMode = async (newMode: ThemeMode) => {
    await updateSettings({ theme: newMode });
  };

  const handleSetColorTheme = async (newColorTheme: ColorTheme) => {
    await updateSettings({ colorTheme: newColorTheme });
  };

  const toggleMode = () => {
    const newMode = isDark ? 'light' : 'dark';
    handleSetMode(newMode);
  };

  const contextValue: ThemeContextType = {
    theme,
    mode,
    colorTheme,
    isDark,
    setMode: handleSetMode,
    setColorTheme: handleSetColorTheme,
    toggleMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 