import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAppState } from '../../hooks/useAppState';
import { useTimerWithNotifications } from '../../hooks/useTimerWithNotifications';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TimePickerModal } from '../common/TimePickerModal';
import { NotesModal } from '../common/NotesModal';
import { ReminderModal } from '../common/ReminderModal';
import { FocusSession } from '../../types';
import { formatDuration, formatRelativeTime } from '../../utils';

interface SessionDetailModalProps {
  session: FocusSession;
  isVisible: boolean;
  onClose: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  isVisible,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const { state, updateSession, getNotesForSession } = useAppState();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    totalTime: 0,
    averageTime: 0,
    longestStreak: 0,
    currentStreak: 0,
  });

  // Calculate session statistics for this habit
  useEffect(() => {
    const allSessions = Object.values(state.sessions).filter(s => s.title === session.title);
    const completedSessions = allSessions.filter(s => s.endTime);
    
    const totalTime = completedSessions.reduce((sum, s) => {
      if (s.endTime && s.startTime) {
        return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000;
      }
      return sum;
    }, 0);

    // Calculate streak (simplified)
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    
    const sessionDates = completedSessions
      .map(s => new Date(s.createdAt).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort();

    let tempStreak = 0;
    for (let i = sessionDates.length - 1; i >= 0; i--) {
      const sessionDate = new Date(sessionDates[i]);
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= tempStreak + 1) {
        tempStreak++;
        if (i === sessionDates.length - 1) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    setSessionStats({
      totalSessions: completedSessions.length,
      totalTime,
      averageTime: completedSessions.length > 0 ? totalTime / completedSessions.length : 0,
      longestStreak,
      currentStreak,
    });
  }, [state.sessions, session.title]);

  const handleTimerComplete = useCallback(async () => {
    await updateSession(session.id, {
      isActive: false,
      endTime: new Date(),
    });
    
    Alert.alert(
      '🎉 Session Complete!',
      `Great job! You've completed your ${session.title} session.`,
      [{ text: 'OK' }]
    );
  }, [session.id, session.title, updateSession]);

  const handleTimerTick = useCallback(async (timeRemaining: number) => {
    await updateSession(session.id, {
      notes: `Session in progress: ${formatDuration(session.duration - timeRemaining)} completed`,
    });
  }, [session.id, session.duration, updateSession]);

  const timer = useTimerWithNotifications({
    initialDuration: session.duration,
    sessionId: session.id,
    sessionTitle: session.title,
    enableHaptics: state.settings.hapticFeedback,
    enableBackground: true,
    enableNotifications: state.settings.soundEnabled,
    onComplete: handleTimerComplete,
    onTick: handleTimerTick,
  });

  useEffect(() => {
    const handleKeepAwake = async () => {
      if (timer.isRunning && state.settings.keepScreenAwake) {
        await activateKeepAwakeAsync();
      } else {
        deactivateKeepAwake();
      }
    };

    handleKeepAwake();
    
    return () => {
      deactivateKeepAwake();
    };
  }, [timer.isRunning, state.settings.keepScreenAwake]);

  const handleStartSession = useCallback(async () => {
    await updateSession(session.id, {
      isActive: true,
      startTime: new Date(),
    });
    timer.start();
  }, [session.id, updateSession, timer]);

  const handleStopSession = useCallback(async () => {
    timer.stop();
    await updateSession(session.id, {
      isActive: false,
      endTime: new Date(),
    });
  }, [session.id, updateSession, timer]);

  const notes = getNotesForSession(session.id);

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              {session.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Habit Tracker
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Habit Statistics */}
          <Card variant="filled" style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: theme.colors.onSurface }]}>
              Your Progress
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {sessionStats.totalSessions}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Sessions
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
                  {formatDuration(sessionStats.totalTime)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Time
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {sessionStats.currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Current Streak
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                  {formatDuration(sessionStats.averageTime)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Average
                </Text>
              </View>
            </View>
          </Card>

          {/* Timer Section */}
          <View style={styles.timerSection}>
            <TimerDisplay
              timeRemaining={timer.timeRemaining}
              progress={timer.getProgress()}
              mode="focus"
              size={280}
            />
            
            <TimerControls
              isRunning={timer.isRunning}
              isPaused={timer.isPaused}
              onStart={handleStartSession}
              onPause={timer.pause}
              onStop={handleStopSession}
              onReset={timer.reset}
              style={styles.timerControls}
            />
          </View>

          {/* Simple Timer Setup - Only when not running */}
          {!timer.isRunning && (
            <Card variant="outlined" style={styles.timerSetupCard}>
              <View style={styles.setupHeader}>
                <MaterialIcons name="timer" size={24} color={theme.colors.primary} />
                <Text style={[styles.setupTitle, { color: theme.colors.onSurface }]}>
                  Timer Setup
                </Text>
              </View>

                             {/* Current Time Display - Pretty version */}
               <View style={[styles.currentTimeDisplay, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
                 <View style={styles.timeDisplayHeader}>
                   <MaterialIcons name="timer" size={16} color={theme.colors.primary} />
                   <Text style={[styles.currentTimeLabel, { color: theme.colors.onSurfaceVariant }]}>
                     Session Time
                   </Text>
                 </View>
                 <Text style={[styles.currentTimeValue, { color: theme.colors.primary }]}>
                   {formatDuration(timer.timeRemaining)}
                 </Text>
                 <View style={[styles.timeBadge, { backgroundColor: theme.colors.primary }]}>
                   <Text style={[styles.timeBadgeText, { color: '#FFFFFF' }]}>
                     {timer.timeRemaining >= 1800 ? 'Deep Work' : timer.timeRemaining >= 900 ? 'Focus' : 'Break'}
                   </Text>
                 </View>
               </View>

              {/* Quick Presets */}
              <View style={styles.presetsSection}>
                <Text style={[styles.presetLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Quick Presets
                </Text>
                <View style={styles.presetGrid}>
                  {/* Focus Presets */}
                  <TouchableOpacity
                    style={[styles.presetButton, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}
                    onPress={() => {
                      timer.setDuration(25 * 60);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.presetIcon, { backgroundColor: theme.colors.primary }]}>
                      <MaterialIcons name="psychology" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.presetButtonTitle, { color: theme.colors.primary }]}>25m</Text>
                    <Text style={[styles.presetButtonSubtitle, { color: theme.colors.onSurfaceVariant }]}>Focus</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.presetButton, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}
                    onPress={() => {
                      timer.setDuration(50 * 60);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.presetIcon, { backgroundColor: theme.colors.primary }]}>
                      <MaterialIcons name="psychology" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.presetButtonTitle, { color: theme.colors.primary }]}>50m</Text>
                    <Text style={[styles.presetButtonSubtitle, { color: theme.colors.onSurfaceVariant }]}>Deep Work</Text>
                  </TouchableOpacity>

                  {/* Break Presets */}
                  <TouchableOpacity
                    style={[styles.presetButton, { backgroundColor: theme.colors.secondary + '15', borderColor: theme.colors.secondary }]}
                    onPress={() => {
                      timer.setDuration(5 * 60);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.presetIcon, { backgroundColor: theme.colors.secondary }]}>
                      <MaterialIcons name="coffee" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.presetButtonTitle, { color: theme.colors.secondary }]}>5m</Text>
                    <Text style={[styles.presetButtonSubtitle, { color: theme.colors.onSurfaceVariant }]}>Break</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.presetButton, { backgroundColor: theme.colors.secondary + '15', borderColor: theme.colors.secondary }]}
                    onPress={() => {
                      timer.setDuration(15 * 60);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.presetIcon, { backgroundColor: theme.colors.secondary }]}>
                      <MaterialIcons name="coffee" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.presetButtonTitle, { color: theme.colors.secondary }]}>15m</Text>
                    <Text style={[styles.presetButtonSubtitle, { color: theme.colors.onSurfaceVariant }]}>Break</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Time Adjustments */}
              <View style={styles.adjustmentSection}>
                <Text style={[styles.adjustmentLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Fine Tune Time
                </Text>
                
                {/* Quick Adjustment Buttons - 4 buttons in a row */}
                <View style={styles.quickAdjustRow}>
                  <TouchableOpacity
                    style={[styles.adjustButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => {
                      timer.addTime(-5 * 60);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="remove" size={18} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.adjustButtonText, { color: theme.colors.onSurfaceVariant }]}>5m</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.adjustButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => {
                      timer.addTime(-1 * 60);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="remove" size={18} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.adjustButtonText, { color: theme.colors.onSurfaceVariant }]}>1m</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.adjustButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => {
                      timer.addTime(1 * 60);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add" size={18} color={theme.colors.primary} />
                    <Text style={[styles.adjustButtonText, { color: theme.colors.primary }]}>1m</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.adjustButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    onPress={() => {
                      timer.addTime(5 * 60);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add" size={18} color={theme.colors.primary} />
                    <Text style={[styles.adjustButtonText, { color: theme.colors.primary }]}>5m</Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Time Button - Separate row for breathing room */}
                <TouchableOpacity
                  style={[styles.customTimeButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    setShowTimePicker(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                  <Text style={[styles.customTimeButtonText, { color: '#FFFFFF' }]}>Set Custom Time</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Session Status - When running */}
          {timer.isRunning && (
            <Card variant="filled" style={styles.statusCard}>
              <View style={styles.statusContent}>
                <View style={styles.statusIcon}>
                  <MaterialIcons 
                    name={timer.isPaused ? "pause-circle" : "play-circle"} 
                    size={32} 
                    color={timer.isPaused ? theme.colors.warning : theme.colors.success} 
                  />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusTitle, { color: theme.colors.onSurface }]}>
                    {timer.isPaused ? 'Session Paused' : 'Focus Session Active'}
                  </Text>
                  <Text style={[styles.statusSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    {timer.isPaused 
                      ? 'Take your time, resume when ready' 
                      : `Keep going! ${formatDuration(timer.timeRemaining)} remaining`
                    }
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Quick Actions */}
          <Card variant="outlined" style={styles.quickActionsCard}>
            <View style={styles.quickActionsHeader}>
              <MaterialIcons name="flash-on" size={20} color={theme.colors.secondary} />
              <Text style={[styles.quickActionsTitle, { color: theme.colors.onSurface }]}>
                Quick Actions
              </Text>
            </View>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowNotesModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
                  <MaterialIcons name="edit-note" size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.colors.onSurface }]}>Notes</Text>
                <Text style={[styles.quickActionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  Add session notes
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowReminderModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.secondary }]}>
                  <MaterialIcons name="notifications" size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.colors.onSurface }]}>Reminders</Text>
                <Text style={[styles.quickActionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  Set habit reminders
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>

        {/* Custom Time Picker Modal */}
        <TimePickerModal
          isVisible={showTimePicker}
          title="Adjust Session Time"
          subtitle="Set a custom time for your current session"
          initialDuration={timer.timeRemaining}
          onConfirm={(duration) => {
            const currentRemaining = timer.timeRemaining;
            const difference = duration - currentRemaining;
            timer.addTime(difference);
            setShowTimePicker(false);
          }}
          onCancel={() => setShowTimePicker(false)}
        />

        {/* Notes Modal */}
        <NotesModal
          isVisible={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          sessionId={session.id}
          title={`${session.title} Notes`}
        />

        {/* Reminder Modal */}
        <ReminderModal
          isVisible={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          habitTitle={session.title}
          groupId={session.groupId}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    marginBottom: 24,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerControls: {
    marginTop: 24,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  adjustmentButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },

  // Quick Actions Card Styles
  quickActionsCard: {
    marginBottom: 24,
    padding: 20,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  timerSetupCard: {
    marginBottom: 24,
    padding: 20,
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  currentTimeDisplay: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  timeDisplayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  currentTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  currentTimeValue: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -1,
    marginBottom: 8,
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsSection: {
    marginBottom: 20,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  presetIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  presetButtonSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  adjustmentSection: {
    marginBottom: 20,
  },
  adjustmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  quickAdjustRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  adjustButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 48,
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    minHeight: 48,
  },
  customTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    marginBottom: 24,
    padding: 20,
  },
  statusIcon: {
    marginBottom: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 