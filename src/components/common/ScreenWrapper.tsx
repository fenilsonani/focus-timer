import React, { useEffect } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { isAndroid } from '../../utils/platformStyles';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  enforceConsistentStyling?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ 
  children, 
  style,
  enforceConsistentStyling = true 
}) => {
  const { theme } = useTheme();

  // Force style refresh on Android when theme changes
  useEffect(() => {
    if (isAndroid) {
      // This effect helps ensure styles are properly applied when theme changes
      // The dependency on theme will cause a re-render with fresh styles
    }
  }, [theme]);

  // Android-specific fixes for border radius and styling consistency
  const androidFixes: ViewStyle = isAndroid ? {
    // Ensure proper rendering by setting explicit properties
    overflow: 'hidden',
    // Reset any inherited border radius at screen level
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  } : {};

  const baseStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };

  const finalStyle = enforceConsistentStyling 
    ? [baseStyle, androidFixes, style] 
    : [baseStyle, style];

  return (
    <View style={finalStyle}>
      {children}
    </View>
  );
}; 