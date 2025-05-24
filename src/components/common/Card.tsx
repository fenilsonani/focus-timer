import React, { ReactNode } from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getContainerStyle } from '../../utils/platformStyles';
import * as Haptics from 'expo-haptics';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  disabled?: boolean;
  style?: ViewStyle;
  haptic?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  onLongPress,
  variant = 'default',
  disabled = false,
  style,
  haptic = true,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled) return;
    
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onLongPress?.();
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      padding: theme.spacing.lg,
      opacity: disabled ? 0.6 : 1,
    };

    const variantStyles: Record<typeof variant, ViewStyle> = {
      default: {
        backgroundColor: theme.colors.surface,
        ...getContainerStyle(theme.borderRadius.lg),
      },
      elevated: {
        backgroundColor: theme.colors.surface,
        ...getContainerStyle(theme.borderRadius.lg, theme.shadows.md),
      },
      outlined: {
        backgroundColor: theme.colors.surface,
        ...getContainerStyle(theme.borderRadius.lg),
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      filled: {
        backgroundColor: theme.colors.surfaceVariant,
        ...getContainerStyle(theme.borderRadius.lg),
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled}
        style={[getCardStyle(), style]}
        activeOpacity={0.95}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
}; 