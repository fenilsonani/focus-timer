import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { formatDuration } from '../utils';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
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

  // Initialize notification service
  async initialize(): Promise<void> {
    if (Device.isDevice) {
      await this.requestPermissions();
    }
  }

  // Check notification permissions
  async getPermissions(): Promise<NotificationPermissions> {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
    };
  }

  // Request notification permissions
  async requestPermissions(): Promise<NotificationPermissions> {
    const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
    };
  }

  // Start timer notifications with live updates
  async startTimerNotifications(data: TimerNotificationData): Promise<void> {
    this.currentSessionData = data;

    // Cancel any existing timer notifications
    await this.stopTimerNotifications();

    // Show initial notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 ${data.sessionTitle}`,
        body: `Session started - ${formatDuration(data.totalDuration)} remaining`,
        data: {
          type: 'timer_update',
          sessionId: data.sessionId,
        },
        sound: 'default',
      },
      trigger: null, // Show immediately
    });

    // Start background updates every 60 seconds
    this.backgroundUpdateInterval = setInterval(async () => {
      await this.updateLiveTimerNotification();
    }, 60000);
  }

  // Update live timer notification with current time
  private async updateLiveTimerNotification(): Promise<void> {
    if (!this.currentSessionData) return;

    const now = Date.now();
    const elapsed = Math.floor((now - this.currentSessionData.startTime) / 1000);
    const remaining = Math.max(0, this.currentSessionData.totalDuration - elapsed);

    if (remaining <= 0) {
      await this.sendSessionCompleteNotification();
      return;
    }

    // Only send notifications when app is in background
    const appState = await Notifications.getBadgeCountAsync();
    
    // Update the notification with current time
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 ${this.currentSessionData.sessionTitle}`,
        body: `${formatDuration(remaining)} remaining`,
        data: {
          type: 'timer_update',
          sessionId: this.currentSessionData.sessionId,
        },
      },
      trigger: null,
    });
  }

  // Send session completion notification
  async sendSessionCompleteNotification(): Promise<void> {
    await this.stopTimerNotifications();

    if (!this.currentSessionData) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Session Complete!',
        body: `Great job! You've completed your ${this.currentSessionData.sessionTitle} session.`,
        data: {
          type: 'session_complete',
          sessionId: this.currentSessionData.sessionId,
        },
        sound: 'default',
      },
      trigger: null,
    });

    this.currentSessionData = null;
  }

  // Send session paused notification
  async sendSessionPausedNotification(sessionTitle: string, remainingTime: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏸️ ${sessionTitle} Paused`,
        body: `Session paused with ${formatDuration(remainingTime)} remaining`,
        data: {
          type: 'session_paused',
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Send session resumed notification
  async sendSessionResumedNotification(sessionTitle: string, remainingTime: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `▶️ ${sessionTitle} Resumed`,
        body: `Session resumed with ${formatDuration(remainingTime)} remaining`,
        data: {
          type: 'session_resumed',
        },
        sound: 'default',
      },
      trigger: null,
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
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '☕ Break Time!',
        body: `Take a ${formatDuration(duration)} break. You've earned it!`,
        data: {
          type: 'break_time',
        },
        sound: 'default',
      },
      trigger: null,
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

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Streak Milestone!',
        body: randomMessage,
        data: {
          type: 'streak_milestone',
          streakCount,
          habitTitle,
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Send habit reminder notification (immediate)
  async sendHabitReminderNotification(habitTitle: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Habit Reminder',
        body: `Time for your ${habitTitle} session!`,
        data: {
          type: 'habit_reminder',
          habitTitle,
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await this.stopTimerNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Listen to notification responses
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Listen to received notifications
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }
}

export const notificationService = new NotificationService(); 