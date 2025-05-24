import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { AppState, Group, FocusSession, Note, HabitReminder, AppSettings } from '../types';
import { storageService } from '../services/storage';
import { generateId, getRandomColor } from '../utils';

interface AppStateContextType {
  state: AppState;
  isLoading: boolean;
  error: string | null;
  
  // Group operations
  createGroup: (name: string, parentId?: string) => Promise<Group>;
  updateGroup: (groupId: string, updates: Partial<Group>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  getGroup: (groupId: string) => Group | undefined;
  getGroupChildren: (groupId: string) => Group[];
  getGroupSessions: (groupId: string) => FocusSession[];
  
  // Session operations
  createSession: (title: string, duration: number, groupId?: string) => Promise<FocusSession>;
  updateSession: (sessionId: string, updates: Partial<FocusSession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  getSession: (sessionId: string) => FocusSession | undefined;
  setCurrentSession: (sessionId: string | undefined) => void;
  
  // Note operations
  createNote: (title: string, content: string, sessionId?: string, tags?: string[]) => Promise<Note>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  getNote: (noteId: string) => Note | undefined;
  getNotesForSession: (sessionId: string) => Note[];
  
  // Reminder operations
  createReminder: (reminder: Omit<HabitReminder, 'id' | 'createdAt' | 'updatedAt' | 'isEnabled'>) => Promise<HabitReminder>;
  updateReminder: (reminderId: string, updates: Partial<HabitReminder>) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  getReminder: (reminderId: string) => HabitReminder | undefined;
  getRemindersForGroup: (groupId: string) => HabitReminder[];
  
  // Settings operations
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  
  // Utility operations
  saveState: () => Promise<void>;
  loadState: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  colorTheme: 'default',
  borderRadiusStyle: 'rounded',
  defaultFocusDuration: 1500, // 25 minutes
  hapticFeedback: true,
  keepScreenAwake: true,
  autoStartBreaks: false,
  breakDuration: 300, // 5 minutes
  soundEnabled: true,
};

const defaultState: AppState = {
  groups: {},
  sessions: {},
  notes: {},
  reminders: {},
  currentSession: undefined,
  settings: defaultSettings,
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateState = useCallback((updater: (prevState: AppState) => AppState) => {
    setState(updater);
  }, []);

  const saveState = useCallback(async () => {
    try {
      await storageService.saveAppState(state);
    } catch (err) {
      setError('Failed to save app state');
      console.error('Save state error:', err);
    }
  }, [state]);

  const loadState = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedState = await storageService.loadAppState();
      
      if (savedState) {
        // Remove groupId from all notes as we no longer use this feature
        if (savedState.notes) {
          Object.values(savedState.notes).forEach(note => {
            // @ts-ignore - removing groupId from notes
            delete note.groupId;
          });
        }
        
        // Merge saved settings with default settings to ensure all properties exist
        const mergedState = {
          ...savedState,
          settings: {
            ...defaultSettings,
            ...savedState.settings,
          },
        };
        
        setState(mergedState);
      }
    } catch (err) {
      setError('Failed to load app state');
      console.error('Load state error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Group operations
  const createGroup = useCallback(async (name: string, parentId?: string): Promise<Group> => {
    const group: Group = {
      id: generateId(),
      name,
      parentId,
      children: [],
      sessions: [],
      color: getRandomColor(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    updateState(prevState => {
      const newState = { ...prevState };
      newState.groups[group.id] = group;
      
      if (parentId && newState.groups[parentId]) {
        newState.groups[parentId].children.push(group.id);
      }
      
      return newState;
    });

    await storageService.saveGroup(group);
    return group;
  }, [updateState]);

  const updateGroup = useCallback(async (groupId: string, updates: Partial<Group>) => {
    updateState(prevState => {
      const group = prevState.groups[groupId];
      if (!group) return prevState;

      const updatedGroup = {
        ...group,
        ...updates,
        updatedAt: new Date(),
      };

      return {
        ...prevState,
        groups: {
          ...prevState.groups,
          [groupId]: updatedGroup,
        },
      };
    });

    const updatedGroup = state.groups[groupId];
    if (updatedGroup) {
      await storageService.saveGroup(updatedGroup);
    }
  }, [updateState, state.groups]);

  const deleteGroup = useCallback(async (groupId: string) => {
    updateState(prevState => {
      const newState = { ...prevState };
      const group = newState.groups[groupId];
      
      if (!group) return prevState;

      // Remove from parent's children
      if (group.parentId && newState.groups[group.parentId]) {
        newState.groups[group.parentId].children = newState.groups[group.parentId].children.filter(
          id => id !== groupId
        );
      }

      // Delete all child groups recursively
      const deleteRecursive = (id: string) => {
        const groupToDelete = newState.groups[id];
        if (!groupToDelete) return;

        groupToDelete.children.forEach(deleteRecursive);
        delete newState.groups[id];
      };

      deleteRecursive(groupId);
      return newState;
    });

    await storageService.deleteGroup(groupId);
  }, [updateState]);

  const getGroup = useCallback((groupId: string) => {
    return state.groups[groupId];
  }, [state.groups]);

  const getGroupChildren = useCallback((groupId: string) => {
    return Object.values(state.groups).filter(group => group.parentId === groupId);
  }, [state.groups]);

  const getGroupSessions = useCallback((groupId: string) => {
    return Object.values(state.sessions).filter(session => session.groupId === groupId);
  }, [state.sessions]);

  // Session operations
  const createSession = useCallback(async (title: string, duration: number, groupId?: string): Promise<FocusSession> => {
    const session: FocusSession = {
      id: generateId(),
      title,
      duration,
      notes: '',
      isActive: false,
      groupId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    updateState(prevState => {
      const newState = { ...prevState };
      newState.sessions[session.id] = session;
      
      if (groupId && newState.groups[groupId]) {
        newState.groups[groupId].sessions.push(session.id);
      }
      
      return newState;
    });

    await storageService.saveSession(session);
    return session;
  }, [updateState]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<FocusSession>) => {
    updateState(prevState => {
      const session = prevState.sessions[sessionId];
      if (!session) return prevState;

      const updatedSession = {
        ...session,
        ...updates,
        updatedAt: new Date(),
      };

      return {
        ...prevState,
        sessions: {
          ...prevState.sessions,
          [sessionId]: updatedSession,
        },
      };
    });

    const updatedSession = state.sessions[sessionId];
    if (updatedSession) {
      await storageService.saveSession(updatedSession);
    }
  }, [updateState, state.sessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    updateState(prevState => {
      const newState = { ...prevState };
      const session = newState.sessions[sessionId];
      
      if (!session) return prevState;

      // Remove from group's sessions
      if (session.groupId && newState.groups[session.groupId]) {
        newState.groups[session.groupId].sessions = newState.groups[session.groupId].sessions.filter(
          id => id !== sessionId
        );
      }

      delete newState.sessions[sessionId];
      
      if (newState.currentSession === sessionId) {
        newState.currentSession = undefined;
      }
      
      return newState;
    });

    await storageService.deleteSession(sessionId);
  }, [updateState]);

  const getSession = useCallback((sessionId: string) => {
    return state.sessions[sessionId];
  }, [state.sessions]);

  const setCurrentSession = useCallback((sessionId: string | undefined) => {
    updateState(prevState => ({
      ...prevState,
      currentSession: sessionId,
    }));
  }, [updateState]);

  // Note operations
  const createNote = useCallback(async (title: string, content: string, sessionId?: string, tags?: string[]): Promise<Note> => {
    const note: Note = {
      id: generateId(),
      title,
      content,
      sessionId,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    updateState(prevState => ({
      ...prevState,
      notes: {
        ...prevState.notes,
        [note.id]: note,
      },
    }));

    await storageService.saveNote(note);
    return note;
  }, [updateState]);

  const updateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    updateState(prevState => {
      const note = prevState.notes[noteId];
      if (!note) return prevState;

      const updatedNote = {
        ...note,
        ...updates,
        updatedAt: new Date(),
      };

      return {
        ...prevState,
        notes: {
          ...prevState.notes,
          [noteId]: updatedNote,
        },
      };
    });

    const updatedNote = state.notes[noteId];
    if (updatedNote) {
      await storageService.saveNote(updatedNote);
    }
  }, [updateState, state.notes]);

  const deleteNote = useCallback(async (noteId: string) => {
    updateState(prevState => {
      const newState = { ...prevState };
      delete newState.notes[noteId];
      return newState;
    });

    await storageService.deleteNote(noteId);
  }, [updateState]);

  const getNote = useCallback((noteId: string) => {
    return state.notes[noteId];
  }, [state.notes]);

  const getNotesForSession = useCallback((sessionId: string) => {
    return Object.values(state.notes).filter(note => note.sessionId === sessionId);
  }, [state.notes]);

  // Reminder operations
  const createReminder = useCallback(async (reminderData: Omit<HabitReminder, 'id' | 'createdAt' | 'updatedAt' | 'isEnabled'>): Promise<HabitReminder> => {
    const reminder: HabitReminder = {
      id: generateId(),
      ...reminderData,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    updateState(prevState => ({
      ...prevState,
      reminders: {
        ...prevState.reminders,
        [reminder.id]: reminder,
      },
    }));

    await storageService.saveReminder(reminder);
    return reminder;
  }, [updateState]);

  const updateReminder = useCallback(async (reminderId: string, updates: Partial<HabitReminder>) => {
    updateState(prevState => {
      const reminder = prevState.reminders[reminderId];
      if (!reminder) return prevState;

      const updatedReminder = {
        ...reminder,
        ...updates,
        updatedAt: new Date(),
      };

      return {
        ...prevState,
        reminders: {
          ...prevState.reminders,
          [reminderId]: updatedReminder,
        },
      };
    });

    const updatedReminder = state.reminders[reminderId];
    if (updatedReminder) {
      await storageService.saveReminder(updatedReminder);
    }
  }, [updateState, state.reminders]);

  const deleteReminder = useCallback(async (reminderId: string) => {
    updateState(prevState => {
      const newState = { ...prevState };
      delete newState.reminders[reminderId];
      return newState;
    });

    await storageService.deleteReminder(reminderId);
  }, [updateState]);

  const getReminder = useCallback((reminderId: string) => {
    return state.reminders[reminderId];
  }, [state.reminders]);

  const getRemindersForGroup = useCallback((groupId: string) => {
    return Object.values(state.reminders).filter(reminder => reminder.groupId === groupId);
  }, [state.reminders]);

  // Settings operations
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    updateState(prevState => ({
      ...prevState,
      settings: {
        ...prevState.settings,
        ...updates,
      },
    }));

    await storageService.saveSettings({ ...state.settings, ...updates });
  }, [updateState, state.settings]);

  // Utility operations
  const clearAllData = useCallback(async () => {
    await storageService.clearAllData();
    setState(defaultState);
  }, []);

  const exportData = useCallback(async () => {
    return await storageService.exportData();
  }, []);

  const importData = useCallback(async (jsonData: string) => {
    await storageService.importData(jsonData);
    await loadState();
  }, [loadState]);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Auto-save state when it changes
  useEffect(() => {
    if (!isLoading) {
      saveState();
    }
  }, [state, isLoading, saveState]);

  const contextValue: AppStateContextType = {
    state,
    isLoading,
    error,
    
    createGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    getGroupChildren,
    getGroupSessions,
    
    createSession,
    updateSession,
    deleteSession,
    getSession,
    setCurrentSession,
    
    createNote,
    updateNote,
    deleteNote,
    getNote,
    getNotesForSession,
    
    createReminder,
    updateReminder,
    deleteReminder,
    getReminder,
    getRemindersForGroup,
    
    updateSettings,
    
    saveState,
    loadState,
    clearAllData,
    exportData,
    importData,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}; 