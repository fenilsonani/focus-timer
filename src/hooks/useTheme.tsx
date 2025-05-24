import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { createTheme } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'auto';
type Theme = ReturnType<typeof createTheme>;

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('auto');

  const isDark = mode === 'dark' || (mode === 'auto' && systemColorScheme === 'dark');
  const theme = createTheme(isDark ? 'dark' : 'light');

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const toggleMode = () => {
    const newMode = isDark ? 'light' : 'dark';
    handleSetMode(newMode);
  };

  const contextValue: ThemeContextType = {
    theme,
    mode,
    isDark,
    setMode: handleSetMode,
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