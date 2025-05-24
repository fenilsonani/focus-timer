import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { formatDuration } from '../utils';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification behavior only if notifications are available
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  isSupported: boolean;
}

export interface TimerNotificationData {
  sessionId: string;
  sessionTitle: string;
  totalDuration: number;
  startTime: number;
}

class NotificationService {
  private backgroundUpdateInterval: NodeJS.Timeout | null = null;
  private currentSessionData: TimerNotificationData | null = null;
  private isNotificationSupported: boolean = false;

  constructor() {
    this.isNotificationSupported = !isExpoGo && Device.isDevice;
  }

  // Initialize notification service
  async initialize(): Promise<void> {
    if (this.isNotificationSupported) {
      try {
        await this.requestPermissions();
      } catch (error) {
        console.warn('Failed to initialize notifications:', error);
        this.isNotificationSupported = false;
      }
    } else if (isExpoGo) {
      console.log('Running in Expo Go - notifications have limited functionality');
    }
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return this.isNotificationSupported;
  }

  // Check notification permissions
  async getPermissions(): Promise<NotificationPermissions> {
    if (!this.isNotificationSupported) {
      return {
        granted: false,
        canAskAgain: false,
        isSupported: false,
      };
    }

    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain,
        isSupported: true,
      };
    } catch (error) {
      console.warn('Failed to get notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        isSupported: false,
      };
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<NotificationPermissions> {
    if (!this.isNotificationSupported) {
      return {
        granted: false,
        canAskAgain: false,
        isSupported: false,
      };
    }

    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain,
        isSupported: true,
      };
    } catch (error) {
      console.warn('Failed to request notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        isSupported: false,
      };
    }
  }

  // Safe notification method with fallback
  private async safeNotification(notificationContent: {
    title: string;
    body: string;
    data?: any;
    sound?: string;
  }): Promise<void> {
    if (!this.isNotificationSupported) {
      // Show in-app alert as fallback
      Alert.alert(notificationContent.title, notificationContent.body);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.warn('Failed to send notification:', error);
      // Fallback to alert
      Alert.alert(notificationContent.title, notificationContent.body);
    }
  }

  // Start timer notifications with live updates
  async startTimerNotifications(data: TimerNotificationData): Promise<void> {
    this.currentSessionData = data;

    // Cancel any existing timer notifications
    await this.stopTimerNotifications();

    // Show initial notification
    await this.safeNotification({
      title: `🎯 ${data.sessionTitle}`,
      body: `Session started - ${formatDuration(data.totalDuration)} remaining`,
      data: {
        type: 'timer_update',
        sessionId: data.sessionId,
      },
      sound: 'default',
    });

    // Start background updates every 60 seconds (only if notifications are supported)
    if (this.isNotificationSupported) {
      this.backgroundUpdateInterval = setInterval(async () => {
        await this.updateLiveTimerNotification();
      }, 60000);
    }
  }

  // Update live timer notification with current time
  private async updateLiveTimerNotification(): Promise<void> {
    if (!this.currentSessionData || !this.isNotificationSupported) return;

    const now = Date.now();
    const elapsed = Math.floor((now - this.currentSessionData.startTime) / 1000);
    const remaining = Math.max(0, this.currentSessionData.totalDuration - elapsed);

    if (remaining <= 0) {
      await this.sendSessionCompleteNotification();
      return;
    }

    // Update the notification with current time
    await this.safeNotification({
      title: `🎯 ${this.currentSessionData.sessionTitle}`,
      body: `${formatDuration(remaining)} remaining`,
      data: {
        type: 'timer_update',
        sessionId: this.currentSessionData.sessionId,
      },
    });
  }

  // Send session completion notification
  async sendSessionCompleteNotification(): Promise<void> {
    await this.stopTimerNotifications();

    if (!this.currentSessionData) return;

    await this.safeNotification({
      title: '🎉 Session Complete!',
      body: `Great job! You've completed your ${this.currentSessionData.sessionTitle} session.`,
      data: {
        type: 'session_complete',
        sessionId: this.currentSessionData.sessionId,
      },
      sound: 'default',
    });

    this.currentSessionData = null;
  }

  // Send session paused notification
  async sendSessionPausedNotification(sessionTitle: string, remainingTime: number): Promise<void> {
    await this.safeNotification({
      title: `⏸️ ${sessionTitle} Paused`,
      body: `Session paused with ${formatDuration(remainingTime)} remaining`,
      data: {
        type: 'session_paused',
      },
      sound: 'default',
    });
  }

  // Send session resumed notification
  async sendSessionResumedNotification(sessionTitle: string, remainingTime: number): Promise<void> {
    await this.safeNotification({
      title: `▶️ ${sessionTitle} Resumed`,
      body: `Session resumed with ${formatDuration(remainingTime)} remaining`,
      data: {
        type: 'session_resumed',
      },
      sound: 'default',
    });
  }

  // Stop timer notifications
  async stopTimerNotifications(): Promise<void> {
    if (this.backgroundUpdateInterval) {
      clearInterval(this.backgroundUpdateInterval);
      this.backgroundUpdateInterval = null;
    }

    this.currentSessionData = null;
  }

  // Send break time notification
  async sendBreakTimeNotification(duration: number): Promise<void> {
    await this.safeNotification({
      title: '☕ Break Time!',
      body: `Take a ${formatDuration(duration)} break. You've earned it!`,
      data: {
        type: 'break_time',
      },
      sound: 'default',
    });
  }

  // Send motivational notification
  async sendMotivationalNotification(streakCount: number, habitTitle: string): Promise<void> {
    const messages = [
      `Amazing! ${streakCount} days strong with ${habitTitle}!`,
      `You're crushing it! ${streakCount} consecutive days!`,
      `Incredible consistency! ${streakCount} days in a row!`,
      `Building habits like a champion! ${streakCount} days!`,
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await this.safeNotification({
      title: '🔥 Streak Milestone!',
      body: randomMessage,
      data: {
        type: 'streak_milestone',
        streakCount,
        habitTitle,
      },
      sound: 'default',
    });
  }

  // Send habit reminder notification (immediate)
  async sendHabitReminderNotification(habitTitle: string): Promise<void> {
    await this.safeNotification({
      title: '🔔 Habit Reminder',
      body: `Time for your ${habitTitle} session!`,
      data: {
        type: 'habit_reminder',
        habitTitle,
      },
      sound: 'default',
    });
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await this.stopTimerNotifications();
    
    if (this.isNotificationSupported) {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (error) {
        console.warn('Failed to cancel notifications:', error);
      }
    }
  }

  // Listen to notification responses
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription | null {
    if (!this.isNotificationSupported) {
      console.warn('Notification listeners not supported in current environment');
      return null;
    }

    try {
      return Notifications.addNotificationResponseReceivedListener(listener);
    } catch (error) {
      console.warn('Failed to add notification response listener:', error);
      return null;
    }
  }

  // Listen to received notifications
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription | null {
    if (!this.isNotificationSupported) {
      console.warn('Notification listeners not supported in current environment');
      return null;
    }

    try {
      return Notifications.addNotificationReceivedListener(listener);
    } catch (error) {
      console.warn('Failed to add notification received listener:', error);
      return null;
    }
  }
}

export const notificationService = new NotificationService(); 