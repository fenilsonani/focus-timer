import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState as ReactNativeAppState } from 'react-native';
import { TimerState } from '../types';
import * as Haptics from 'expo-haptics';

interface UseTimerOptions {
  initialDuration: number;
  onComplete?: () => void;
  onTick?: (timeRemaining: number) => void;
  enableHaptics?: boolean;
  enableBackground?: boolean;
}

interface UseTimerReturn extends TimerState {
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  getProgress: () => number;
}

export const useTimer = ({
  initialDuration,
  onComplete,
  onTick,
  enableHaptics = true,
  enableBackground = true,
}: UseTimerOptions): UseTimerReturn => {
  const [state, setState] = useState<TimerState>({
    timeRemaining: initialDuration,
    isRunning: false,
    isPaused: false,
    mode: 'focus',
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const durationRef = useRef(initialDuration);

  // Handle app state changes for background timer
  useEffect(() => {
    if (!enableBackground) return;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && state.isRunning) {
        backgroundTimeRef.current = Date.now();
      } else if (nextAppState === 'active' && backgroundTimeRef.current && state.isRunning) {
        const timeInBackground = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
        setState(prevState => ({
          ...prevState,
          timeRemaining: Math.max(0, prevState.timeRemaining - timeInBackground),
        }));
        backgroundTimeRef.current = null;
      }
    };

    const subscription = ReactNativeAppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [state.isRunning, enableBackground]);

  // Timer tick effect
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prevState => {
          const newTimeRemaining = Math.max(0, prevState.timeRemaining - 1);
          
          if (onTick) {
            onTick(newTimeRemaining);
          }

          if (newTimeRemaining === 0) {
            if (enableHaptics) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            
            if (onComplete) {
              onComplete();
            }

            return {
              ...prevState,
              timeRemaining: 0,
              isRunning: false,
              isPaused: false,
            };
          }

          return {
            ...prevState,
            timeRemaining: newTimeRemaining,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused, onComplete, onTick, enableHaptics]);

  const start = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isRunning: true,
      isPaused: false,
    }));

    startTimeRef.current = Date.now();

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [enableHaptics]);

  const pause = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isPaused: !prevState.isPaused,
    }));

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics]);

  const stop = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isRunning: false,
      isPaused: false,
      timeRemaining: durationRef.current,
    }));

    startTimeRef.current = null;

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [enableHaptics]);

  const reset = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      timeRemaining: durationRef.current,
    }));

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics]);

  const addTime = useCallback((seconds: number) => {
    setState(prevState => ({
      ...prevState,
      timeRemaining: Math.max(0, prevState.timeRemaining + seconds),
    }));

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics]);

  const setDuration = useCallback((seconds: number) => {
    durationRef.current = seconds;
    setState(prevState => ({
      ...prevState,
      timeRemaining: seconds,
    }));
  }, []);

  const getProgress = useCallback(() => {
    if (durationRef.current === 0) return 0;
    return (durationRef.current - state.timeRemaining) / durationRef.current;
  }, [state.timeRemaining]);

  // Update duration when initialDuration changes
  useEffect(() => {
    if (!state.isRunning) {
      durationRef.current = initialDuration;
      setState(prevState => ({
        ...prevState,
        timeRemaining: initialDuration,
      }));
    }
  }, [initialDuration, state.isRunning]);

  return {
    ...state,
    start,
    pause,
    stop,
    reset,
    addTime,
    setDuration,
    getProgress,
  };
}; 