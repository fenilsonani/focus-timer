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
    } else {
      onPause();
    }
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
      <View style={styles.mainButtonContainer}>
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
            size={36}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        
        {/* Main button label */}
        <Text style={[styles.mainButtonLabel, { color: theme.colors.onSurfaceVariant }]}>
          {getMainButtonTitle()}
        </Text>
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        {/* Stop Button */}
        {isRunning && (
          <View style={styles.secondaryButtonContainer}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.error,
                  ...theme.shadows.sm,
                }
              ]}
              onPress={onStop}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="stop"
                size={24}
                color={theme.colors.error}
              />
            </TouchableOpacity>
            <Text style={[styles.secondaryButtonLabel, { color: theme.colors.onSurfaceVariant }]}>
              Stop
            </Text>
          </View>
        )}

        {/* Reset Button */}
        {!isRunning && (
          <View style={styles.secondaryButtonContainer}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.onSurfaceVariant,
                  ...theme.shadows.sm,
                }
              ]}
              onPress={onReset}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="refresh"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            <Text style={[styles.secondaryButtonLabel, { color: theme.colors.onSurfaceVariant }]}>
              Reset
            </Text>
          </View>
        )}
      </View>

      {/* Quick Time Adjustments - Only when not running */}
      {!isRunning && (
        <View style={styles.quickControls}>
          <Text style={[styles.quickControlsTitle, { color: theme.colors.onSurfaceVariant }]}>
            Adjust Time
          </Text>
          <View style={styles.quickControlsButtons}>
            <Button
              title="+1m"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              variant="ghost"
              size="small"
              style={styles.quickButton}
            />
            <Button
              title="+5m"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              variant="ghost"
              size="small"
              style={styles.quickButton}
            />
            <Button
              title="+10m"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              variant="ghost"
              size="small"
              style={styles.quickButton}
            />
          </View>
        </View>
      )}

      {/* Session Status Indicator */}
      {isRunning && (
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isPaused ? theme.colors.warning : theme.colors.success }]} />
          <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
            {isPaused ? 'Paused' : 'Focus Session Active'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 24,
  },
  mainButtonContainer: {
    alignItems: 'center',
    gap: 12,
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
  secondaryControls: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  secondaryButtonContainer: {
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  secondaryButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickControls: {
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  quickControlsTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickControlsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    minWidth: 50,
    paddingHorizontal: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 