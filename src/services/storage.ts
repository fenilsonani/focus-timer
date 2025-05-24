import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Group, FocusSession, Note, AppSettings } from '../types';

const STORAGE_KEYS = {
  APP_STATE: '@focus_timer_app_state',
  GROUPS: '@focus_timer_groups',
  SESSIONS: '@focus_timer_sessions',
  NOTES: '@focus_timer_notes',
  SETTINGS: '@focus_timer_settings',
} as const;

class StorageService {
  private async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }

  private async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  private async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  // App State Management
  async saveAppState(state: AppState): Promise<void> {
    await this.setItem(STORAGE_KEYS.APP_STATE, state);
  }

  async loadAppState(): Promise<AppState | null> {
    return await this.getItem<AppState>(STORAGE_KEYS.APP_STATE);
  }

  // Groups Management
  async saveGroups(groups: Record<string, Group>): Promise<void> {
    await this.setItem(STORAGE_KEYS.GROUPS, groups);
  }

  async loadGroups(): Promise<Record<string, Group> | null> {
    return await this.getItem<Record<string, Group>>(STORAGE_KEYS.GROUPS);
  }

  async saveGroup(group: Group): Promise<void> {
    const groups = await this.loadGroups() || {};
    groups[group.id] = group;
    await this.saveGroups(groups);
  }

  async deleteGroup(groupId: string): Promise<void> {
    const groups = await this.loadGroups() || {};
    delete groups[groupId];
    await this.saveGroups(groups);
  }

  // Sessions Management
  async saveSessions(sessions: Record<string, FocusSession>): Promise<void> {
    await this.setItem(STORAGE_KEYS.SESSIONS, sessions);
  }

  async loadSessions(): Promise<Record<string, FocusSession> | null> {
    return await this.getItem<Record<string, FocusSession>>(STORAGE_KEYS.SESSIONS);
  }

  async saveSession(session: FocusSession): Promise<void> {
    const sessions = await this.loadSessions() || {};
    sessions[session.id] = session;
    await this.saveSessions(sessions);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.loadSessions() || {};
    delete sessions[sessionId];
    await this.saveSessions(sessions);
  }

  // Notes Management
  async saveNotes(notes: Record<string, Note>): Promise<void> {
    await this.setItem(STORAGE_KEYS.NOTES, notes);
  }

  async loadNotes(): Promise<Record<string, Note> | null> {
    return await this.getItem<Record<string, Note>>(STORAGE_KEYS.NOTES);
  }

  async saveNote(note: Note): Promise<void> {
    const notes = await this.loadNotes() || {};
    notes[note.id] = note;
    await this.saveNotes(notes);
  }

  async deleteNote(noteId: string): Promise<void> {
    const notes = await this.loadNotes() || {};
    delete notes[noteId];
    await this.saveNotes(notes);
  }

  // Settings Management
  async saveSettings(settings: AppSettings): Promise<void> {
    await this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  async loadSettings(): Promise<AppSettings | null> {
    return await this.getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.APP_STATE),
      this.removeItem(STORAGE_KEYS.GROUPS),
      this.removeItem(STORAGE_KEYS.SESSIONS),
      this.removeItem(STORAGE_KEYS.NOTES),
      this.removeItem(STORAGE_KEYS.SETTINGS),
    ]);
  }

  async exportData(): Promise<string> {
    const [appState, groups, sessions, notes, settings] = await Promise.all([
      this.loadAppState(),
      this.loadGroups(),
      this.loadSessions(),
      this.loadNotes(),
      this.loadSettings(),
    ]);

    const exportData = {
      appState,
      groups,
      sessions,
      notes,
      settings,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.appState) await this.saveAppState(data.appState);
      if (data.groups) await this.saveGroups(data.groups);
      if (data.sessions) await this.saveSessions(data.sessions);
      if (data.notes) await this.saveNotes(data.notes);
      if (data.settings) await this.saveSettings(data.settings);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid import data format');
    }
  }
}

export const storageService = new StorageService(); 