import { Platform, ViewStyle } from 'react-native';

/**
 * Platform-specific utilities for consistent styling across iOS and Android
 */

/**
 * Applies platform-specific fixes for border radius on Android
 * Android sometimes requires explicit properties for proper border radius rendering
 */
export const getBorderRadiusStyle = (radius: number): ViewStyle => {
  const baseStyle: ViewStyle = {
    borderRadius: radius,
  };

  // Android-specific fixes for border radius rendering
  if (Platform.OS === 'android') {
    return {
      ...baseStyle,
      // Explicitly set all corner radii to ensure consistent rendering
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
      // Ensure proper clipping of child elements
      overflow: 'hidden',
    };
  }

  return baseStyle;
};

/**
 * Enhanced border radius style with proper Android handling
 * Use this for components that need reliable cross-platform border radius
 */
export const getEnhancedBorderRadius = (
  radius: number, 
  options: {
    clipChildren?: boolean;
    forceOverflow?: boolean;
  } = {}
): ViewStyle => {
  const { clipChildren = true, forceOverflow = false } = options;
  
  const baseStyle: ViewStyle = {
    borderRadius: radius,
  };

  if (Platform.OS === 'android') {
    const androidStyle: ViewStyle = {
      ...baseStyle,
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
    };

    // Add overflow hidden for better clipping on Android
    if (clipChildren || forceOverflow) {
      androidStyle.overflow = 'hidden';
    }

    return androidStyle;
  }

  return baseStyle;
};

/**
 * Platform-specific shadow styles that work well with border radius
 */
export const getEnhancedShadow = (shadowConfig: {
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}): ViewStyle => {
  if (Platform.OS === 'android') {
    return {
      elevation: shadowConfig.elevation,
      // Android elevation can interfere with border radius, so we ensure proper rendering
      shadowColor: 'transparent', // Remove iOS shadow on Android
    };
  }

  return {
    shadowOffset: shadowConfig.shadowOffset,
    shadowOpacity: shadowConfig.shadowOpacity,
    shadowRadius: shadowConfig.shadowRadius,
    shadowColor: '#000000',
  };
};

/**
 * Complete styling solution for cards and containers with proper platform handling
 */
export const getContainerStyle = (
  borderRadius: number,
  shadow?: {
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  }
): ViewStyle => {
  const borderRadiusStyle = getEnhancedBorderRadius(borderRadius, { clipChildren: true });
  const shadowStyle = shadow ? getEnhancedShadow(shadow) : {};

  return {
    ...borderRadiusStyle,
    ...shadowStyle,
  };
};

/**
 * Fixes for gradient backgrounds with border radius on Android
 */
export const getGradientContainerStyle = (borderRadius: number): ViewStyle => {
  if (Platform.OS === 'android') {
    return {
      borderRadius,
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
      overflow: 'hidden',
      // Android-specific fixes for gradient rendering
      backgroundColor: 'transparent',
    };
  }

  return {
    borderRadius,
  };
};

/**
 * Utility to check if we need Android-specific fixes
 */
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios'; 