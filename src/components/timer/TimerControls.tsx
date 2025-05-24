import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../common/Button';
import * as Haptics from 'expo-haptics';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  style?: ViewStyle;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onStop,
  onReset,
  style,
}) => {
  const { theme } = useTheme();

  const handleMainAction = () => {
    if (!isRunning) {
      onStart();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      onPause();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStop = () => {
    onStop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleReset = () => {
    onReset();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getMainButtonTitle = () => {
    if (!isRunning) return 'Start Focus';
    if (isPaused) return 'Resume';
    return 'Pause';
  };

  const getMainButtonIcon = () => {
    if (!isRunning || isPaused) return 'play-arrow';
    return 'pause';
  };

  const getMainButtonColor = () => {
    if (!isRunning) return theme.colors.primary;
    if (isPaused) return theme.colors.success;
    return theme.colors.warning;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Main Action Button */}
      <TouchableOpacity
        style={[
          styles.mainButton,
          {
            backgroundColor: getMainButtonColor(),
            shadowColor: getMainButtonColor(),
            ...theme.shadows.lg,
          }
        ]}
        onPress={handleMainAction}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={getMainButtonIcon() as any}
          size={32}
          color="#FFFFFF"
        />
      </TouchableOpacity>
      
      {/* Main button label */}
      <Text style={[styles.mainButtonLabel, { color: theme.colors.onSurface }]}>
        {getMainButtonTitle()}
      </Text>

      {/* Action Row - All controls on same row */}
      <View style={styles.actionRow}>
        {/* Reset Button - When not running */}
        {!isRunning && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={18} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.actionButtonText, { color: theme.colors.onSurfaceVariant }]}>
              Reset
            </Text>
          </TouchableOpacity>
        )}

        {/* Stop Button - When running */}
        {isRunning && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.error,
              }
            ]}
            onPress={handleStop}
            activeOpacity={0.7}
          >
            <MaterialIcons name="stop" size={18} color={theme.colors.error} />
            <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
              Stop
            </Text>
          </TouchableOpacity>
        )}

        {/* Status indicator - inline when running */}
        {isRunning && (
          <View style={styles.inlineStatus}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isPaused ? theme.colors.warning : theme.colors.success }
            ]} />
            <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
              {isPaused ? 'Paused' : 'Active'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 24,
  },
  mainButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  mainButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderRadius: 24,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 