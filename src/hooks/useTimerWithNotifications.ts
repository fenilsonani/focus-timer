import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState as ReactNativeAppState } from 'react-native';
import { TimerState } from '../types';
import { notificationService, TimerNotificationData } from '../services/notificationService';
import * as Haptics from 'expo-haptics';

interface UseTimerWithNotificationsOptions {
  initialDuration: number;
  sessionId: string;
  sessionTitle: string;
  onComplete?: () => void;
  onTick?: (timeRemaining: number) => void;
  enableHaptics?: boolean;
  enableBackground?: boolean;
  enableNotifications?: boolean;
}

interface UseTimerWithNotificationsReturn extends TimerState {
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  getProgress: () => number;
}

export const useTimerWithNotifications = ({
  initialDuration,
  sessionId,
  sessionTitle,
  onComplete,
  onTick,
  enableHaptics = true,
  enableBackground = true,
  enableNotifications = true,
}: UseTimerWithNotificationsOptions): UseTimerWithNotificationsReturn => {
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
  const notificationDataRef = useRef<TimerNotificationData | null>(null);

  // Initialize notification service
  useEffect(() => {
    if (enableNotifications) {
      notificationService.initialize();
    }
  }, [enableNotifications]);

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
            
            // Send completion notification
            if (enableNotifications) {
              notificationService.sendSessionCompleteNotification();
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
  }, [state.isRunning, state.isPaused, onComplete, onTick, enableHaptics, enableNotifications, sessionTitle]);

  const start = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isRunning: true,
      isPaused: false,
    }));

    startTimeRef.current = Date.now();

    // Start timer notifications
    if (enableNotifications && startTimeRef.current) {
      const notificationData: TimerNotificationData = {
        sessionId,
        sessionTitle,
        totalDuration: durationRef.current,
        startTime: startTimeRef.current,
      };
      
      notificationDataRef.current = notificationData;
      notificationService.startTimerNotifications(notificationData);
    }

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [enableHaptics, enableNotifications, sessionId, sessionTitle]);

  const pause = useCallback(() => {
    setState(prevState => {
      const willBePaused = !prevState.isPaused;
      
      // Send pause/resume notifications
      if (enableNotifications) {
        if (willBePaused) {
          notificationService.sendSessionPausedNotification(sessionTitle, prevState.timeRemaining);
        } else {
          notificationService.sendSessionResumedNotification(sessionTitle, prevState.timeRemaining);
        }
      }

      return {
        ...prevState,
        isPaused: willBePaused,
      };
    });

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics, enableNotifications, sessionTitle]);

  const stop = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isRunning: false,
      isPaused: false,
      timeRemaining: durationRef.current,
    }));

    startTimeRef.current = null;

    // Stop timer notifications
    if (enableNotifications) {
      notificationService.stopTimerNotifications();
    }

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [enableHaptics, enableNotifications]);

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

    // Update notification data
    if (enableNotifications && notificationDataRef.current) {
      notificationDataRef.current.totalDuration += seconds;
    }

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics, enableNotifications]);

  const setDuration = useCallback((seconds: number) => {
    durationRef.current = seconds;
    setState(prevState => ({
      ...prevState,
      timeRemaining: seconds,
    }));

    // Update notification data
    if (enableNotifications && notificationDataRef.current) {
      notificationDataRef.current.totalDuration = seconds;
    }
  }, [enableNotifications]);

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

  // Cleanup notifications on unmount
  useEffect(() => {
    return () => {
      if (enableNotifications) {
        notificationService.stopTimerNotifications();
      }
    };
  }, [enableNotifications]);

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