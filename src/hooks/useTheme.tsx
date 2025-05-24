import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { createTheme, ThemeMetadata, BorderRadiusMetadata } from '../constants/theme';
import { useAppState } from './useAppState';

type ThemeMode = 'light' | 'dark' | 'auto';
type ColorTheme = keyof typeof ThemeMetadata;
type BorderRadiusStyle = keyof typeof BorderRadiusMetadata;
type Theme = ReturnType<typeof createTheme>;

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  colorTheme: ColorTheme;
  borderRadiusStyle: BorderRadiusStyle;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  setBorderRadiusStyle: (borderRadiusStyle: BorderRadiusStyle) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const { state, updateSettings } = useAppState();
  
  const mode = state.settings.theme;
  const colorTheme = state.settings.colorTheme || 'default';
  const borderRadiusStyle = state.settings.borderRadiusStyle || 'rounded';
  const isDark = mode === 'dark' || (mode === 'auto' && systemColorScheme === 'dark');
  const theme = createTheme(isDark ? 'dark' : 'light', colorTheme, borderRadiusStyle);

  const handleSetMode = async (newMode: ThemeMode) => {
    await updateSettings({ theme: newMode });
  };

  const handleSetColorTheme = async (newColorTheme: ColorTheme) => {
    await updateSettings({ colorTheme: newColorTheme });
  };

  const handleSetBorderRadiusStyle = async (newBorderRadiusStyle: BorderRadiusStyle) => {
    await updateSettings({ borderRadiusStyle: newBorderRadiusStyle });
  };

  const toggleMode = () => {
    const newMode = isDark ? 'light' : 'dark';
    handleSetMode(newMode);
  };

  const contextValue: ThemeContextType = {
    theme,
    mode,
    colorTheme,
    borderRadiusStyle,
    isDark,
    setMode: handleSetMode,
    setColorTheme: handleSetColorTheme,
    setBorderRadiusStyle: handleSetBorderRadiusStyle,
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