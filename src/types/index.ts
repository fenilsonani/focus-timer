export interface FocusSession {
  id: string;
  title: string;
  duration: number; // in seconds
  notes: string;
  startTime?: Date;
  endTime?: Date;
  isActive: boolean;
  groupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  parentId?: string;
  children: string[]; // Group IDs
  sessions: string[]; // Session IDs
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  groupId?: string;
  sessionId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitReminder {
  id: string;
  habitTitle: string;
  groupId?: string;
  time: string; // HH:mm format
  days: number[]; // 0-6 (Sunday-Saturday)
  isEnabled: boolean;
  notificationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppState {
  groups: Record<string, Group>;
  sessions: Record<string, FocusSession>;
  notes: Record<string, Note>;
  reminders: Record<string, HabitReminder>;
  currentSession?: string;
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  defaultFocusDuration: number;
  hapticFeedback: boolean;
  keepScreenAwake: boolean;
  autoStartBreaks: boolean;
  breakDuration: number;
  soundEnabled: boolean;
}

export interface TimerState {
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  mode: 'focus' | 'break';
}

export interface NavigationItem {
  id: string;
  name: string;
  type: 'group' | 'session';
  path: string[];
}

export type BottomSheetType = 'timer' | 'notes' | 'settings' | 'group-creation' | null;

export interface GestureHandlers {
  onLongPress: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: () => void;
} 