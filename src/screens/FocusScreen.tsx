import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useTheme } from '../hooks/useTheme';
import { useAppState } from '../hooks/useAppState';
import { useTimer } from '../hooks/useTimer';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { TimerControls } from '../components/timer/TimerControls';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatDuration, formatRelativeTime } from '../utils';

interface FocusScreenProps {
  selectedSessionId?: string;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({ selectedSessionId }) => {
  const { theme, isDark } = useTheme();
  const { state, createSession, updateSession, setCurrentSession } = useAppState();
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(selectedSessionId);

  const currentSession = currentSessionId ? state.sessions[currentSessionId] : undefined;
  const defaultDuration = state.settings.defaultFocusDuration;

  // Memoize timer callbacks to prevent unnecessary re-renders
  const handleTimerComplete = useCallback(async () => {
    if (currentSession) {
      await updateSession(currentSession.id, {
        isActive: false,
        endTime: new Date(),
      });
    }
    
    // Auto-start break if enabled
    if (state.settings.autoStartBreaks) {
      console.log('Starting break timer...');
    }
  }, [currentSession, updateSession, state.settings.autoStartBreaks]);

  const handleTimerTick = useCallback(async (timeRemaining: number) => {
    if (currentSession) {
      await updateSession(currentSession.id, {
        notes: `Session in progress: ${formatDuration(currentSession.duration - timeRemaining)} completed`,
      });
    }
  }, [currentSession, updateSession]);

  const timer = useTimer({
    initialDuration: currentSession?.duration || defaultDuration,
    enableHaptics: state.settings.hapticFeedback,
    enableBackground: true,
    onComplete: handleTimerComplete,
    onTick: handleTimerTick,
  });

  // Keep screen awake during timer
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

  // Update current session in global state (only when needed)
  useEffect(() => {
    if (currentSessionId !== state.currentSession) {
      setCurrentSession(currentSessionId);
    }
  }, [currentSessionId, setCurrentSession, state.currentSession]);

  const handleStartNewSession = useCallback(async () => {
    try {
      const session = await createSession(
        `Focus Session - ${new Date().toLocaleTimeString()}`,
        timer.timeRemaining
      );
      
      setCurrentSessionId(session.id);
      
      await updateSession(session.id, {
        isActive: true,
        startTime: new Date(),
      });
      
      timer.start();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [createSession, updateSession, timer]);

  const handleStartTimer = useCallback(() => {
    if (currentSession) {
      timer.start();
    } else {
      handleStartNewSession();
    }
  }, [currentSession, timer, handleStartNewSession]);

  const handleStopTimer = useCallback(async () => {
    timer.stop();
    
    if (currentSession) {
      await updateSession(currentSession.id, {
        isActive: false,
        endTime: new Date(),
      });
      setCurrentSessionId(undefined);
    }
  }, [timer, currentSession, updateSession]);

  const handleAddTime = useCallback((minutes: number) => {
    timer.addTime(minutes * 60);
    
    if (currentSession) {
      updateSession(currentSession.id, {
        duration: currentSession.duration + (minutes * 60),
      });
    }
  }, [timer, currentSession, updateSession]);

  const recentSessions = Object.values(state.sessions)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Focus Timer
          </Text>
          
          {currentSession && (
            <Text style={[styles.sessionTitle, { color: theme.colors.onSurfaceVariant }]}>
              {currentSession.title}
            </Text>
          )}
        </View>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <TimerDisplay
            timeRemaining={timer.timeRemaining}
            progress={timer.getProgress()}
            mode={timer.mode}
          />
        </View>

        {/* Timer Controls */}
        <TimerControls
          isRunning={timer.isRunning}
          isPaused={timer.isPaused}
          onStart={handleStartTimer}
          onPause={timer.pause}
          onStop={handleStopTimer}
          onReset={timer.reset}
          style={styles.controls}
        />

        {/* Quick Time Adjustments */}
        {!timer.isRunning && (
          <View style={styles.quickAdjustments}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Quick Adjustments
            </Text>
            <View style={styles.adjustmentButtons}>
              <Button
                title="+1m"
                onPress={() => handleAddTime(1)}
                variant="outline"
                size="small"
              />
              <Button
                title="+5m"
                onPress={() => handleAddTime(5)}
                variant="outline"
                size="small"
              />
              <Button
                title="+10m"
                onPress={() => handleAddTime(10)}
                variant="outline"
                size="small"
              />
            </View>
          </View>
        )}

        {/* Session Status */}
        {timer.isRunning && (
          <Card variant="filled" style={styles.statusCard}>
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: theme.colors.onSurface }]}>
                Session in Progress
              </Text>
              <Text style={[styles.statusSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Stay focused! {formatDuration(timer.timeRemaining)} remaining
              </Text>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: theme.colors.primary,
                      width: `${timer.getProgress() * 100}%`
                    }
                  ]} 
                />
              </View>
            </View>
          </Card>
        )}

        {/* Recent Sessions */}
        {recentSessions.length > 0 && !timer.isRunning && (
          <View style={styles.recentSessions}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Recent Sessions
            </Text>
            
            {recentSessions.map((session) => (
              <Card
                key={session.id}
                variant="outlined"
                style={styles.sessionCard}
                onPress={() => {
                  setCurrentSessionId(session.id);
                  timer.setDuration(session.duration);
                }}
              >
                <View style={styles.sessionCardContent}>
                  <View style={styles.sessionCardHeader}>
                    <Text style={[styles.sessionCardTitle, { color: theme.colors.onSurface }]}>
                      {session.title}
                    </Text>
                    <View 
                      style={[
                        styles.sessionStatusBadge,
                        { 
                          backgroundColor: session.isActive 
                            ? theme.colors.success 
                            : theme.colors.surfaceVariant 
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.sessionCardDuration, { color: theme.colors.primary }]}>
                    {formatDuration(session.duration)}
                  </Text>
                  <Text style={[styles.sessionCardTime, { color: theme.colors.onSurfaceVariant }]}>
                    {formatRelativeTime(new Date(session.createdAt))}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        {!timer.isRunning && (
          <View style={styles.quickActions}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Quick Start
            </Text>
            <View style={styles.quickActionButtons}>
              <Button
                title="25 min Pomodoro"
                onPress={() => {
                  timer.setDuration(25 * 60);
                  setCurrentSessionId(undefined);
                }}
                variant="outline"
                style={styles.quickActionButton}
              />
              <Button
                title="50 min Deep Work"
                onPress={() => {
                  timer.setDuration(50 * 60);
                  setCurrentSessionId(undefined);
                }}
                variant="outline"
                style={styles.quickActionButton}
              />
              <Button
                title="15 min Break"
                onPress={() => {
                  timer.setDuration(15 * 60);
                  setCurrentSessionId(undefined);
                }}
                variant="ghost"
                style={styles.quickActionButton}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  controls: {
    marginBottom: 32,
  },
  quickAdjustments: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  adjustmentButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  statusCard: {
    marginBottom: 32,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  recentSessions: {
    marginBottom: 32,
  },
  sessionCard: {
    marginBottom: 12,
  },
  sessionCardContent: {
    gap: 4,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sessionStatusBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionCardDuration: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionCardTime: {
    fontSize: 12,
  },
  quickActions: {
    marginBottom: 16,
  },
  quickActionButtons: {
    gap: 12,
  },
  quickActionButton: {
    marginBottom: 8,
  },
}); 