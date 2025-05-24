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
import { useTheme } from '../../hooks/useTheme';
import { useAppState } from '../../hooks/useAppState';
import { useTimer } from '../../hooks/useTimer';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TimePickerModal } from '../common/TimePickerModal';
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

  const timer = useTimer({
    initialDuration: session.duration,
    enableHaptics: state.settings.hapticFeedback,
    enableBackground: true,
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

          {/* Time Adjustments */}
          {!timer.isRunning && (
            <View style={styles.quickActions}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                Adjust Session Time
              </Text>
              <View style={styles.adjustmentButtons}>
                <Button
                  title="-5 min"
                  onPress={() => timer.addTime(-5 * 60)}
                  variant="outline"
                  size="small"
                />
                <Button
                  title="+5 min"
                  onPress={() => timer.addTime(5 * 60)}
                  variant="outline"
                  size="small"
                />
                <Button
                  title="+10 min"
                  onPress={() => timer.addTime(10 * 60)}
                  variant="outline"
                  size="small"
                />
                <Button
                  title="Custom"
                  onPress={() => setShowTimePicker(true)}
                  variant="primary"
                  size="small"
                />
              </View>
            </View>
          )}

          {/* Current Session Status */}
          {timer.isRunning && (
            <Card variant="filled" style={styles.statusCard}>
              <View style={styles.statusContent}>
                <MaterialIcons name="trending-up" size={24} color={theme.colors.success} />
                <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
                  Keep going! You're building a great habit.
                </Text>
              </View>
            </Card>
          )}
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
  statusCard: {
    marginBottom: 24,
    padding: 20,
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
}); 