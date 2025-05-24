export const Colors = {
  light: {
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    secondary: '#EC4899',
    secondaryDark: '#DB2777',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    onSurface: '#1E293B',
    onSurfaceVariant: '#64748B',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    border: '#E2E8F0',
    shadow: '#0000001A',
    accent: '#8B5CF6',
  },
  dark: {
    primary: '#818CF8',
    primaryDark: '#6366F1',
    secondary: '#F472B6',
    secondaryDark: '#EC4899',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    onSurface: '#F8FAFC',
    onSurfaceVariant: '#CBD5E1',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    border: '#475569',
    shadow: '#0000003A',
    accent: '#A78BFA',
  },
};

export const Typography = {
  hero: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  subheading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  timer: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '300' as const,
    letterSpacing: -2,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const Animation = {
  fast: 200,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 100,
  },
};

export const Layout = {
  headerHeight: 120,
  tabBarHeight: 80,
  bottomSheetHandleHeight: 24,
  minTouchTarget: 44,
};

export const GroupColors = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B',
  '#8B5CF6', '#06B6D4', '#EF4444', '#84CC16',
  '#F97316', '#3B82F6', '#6D28D9', '#059669',
];

export const createTheme = (mode: 'light' | 'dark') => ({
  colors: Colors[mode],
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  animation: Animation,
  layout: Layout,
}); 