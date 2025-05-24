import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { formatTime } from '../../utils';

interface TimerDisplayProps {
  timeRemaining: number;
  progress: number;
  mode: 'focus' | 'break';
  size?: number;
  style?: ViewStyle;
}

const { width } = Dimensions.get('window');
const DEFAULT_SIZE = Math.min(width * 0.7, 300);

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeRemaining,
  progress,
  mode,
  size = DEFAULT_SIZE,
  style,
}) => {
  const { theme } = useTheme();

  const strokeWidth = size * 0.06;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  const getModeColor = () => {
    return mode === 'focus' ? theme.colors.primary : theme.colors.secondary;
  };

  const getModeGradient = () => {
    return mode === 'focus' 
      ? [theme.colors.primary, theme.colors.primaryDark]
      : [theme.colors.secondary, theme.colors.secondaryDark];
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* SVG Circles Container */}
      <View style={[styles.svgContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.colors.surfaceVariant}
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={0.3}
          />
          
          {/* Progress circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={getModeColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            opacity={0.9}
          />
        </Svg>
      </View>

      {/* Timer Content - Absolutely positioned in center */}
      <View style={[styles.content, { width: size * 0.8, height: size * 0.8 }]}>
        <Text style={[styles.timeText, { color: theme.colors.onSurface }]}>
          {formatTime(timeRemaining)}
        </Text>
        
        <Text style={[styles.modeText, { color: getModeColor() }]}>
          {mode === 'focus' ? 'Focus Time' : 'Break Time'}
        </Text>
        
        {/* Progress percentage */}
        <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      {/* Subtle glow effect for active timer */}
      {progress > 0 && (
        <View style={[styles.glowContainer, { width: size * 1.1, height: size * 1.1 }]}>
          <LinearGradient
            colors={[getModeGradient()[0], getModeGradient()[1], 'transparent']}
            style={[
              styles.glow,
              {
                width: size * 1.1,
                height: size * 1.1,
                borderRadius: size * 0.55,
              }
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timeText: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -2,
    marginBottom: 8,
    textAlign: 'center',
  },
  modeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  glow: {
    opacity: 0.2,
  },
}); 