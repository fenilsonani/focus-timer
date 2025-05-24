import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAppState } from '../hooks/useAppState';
import { Card } from '../components/common/Card';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { formatDuration, formatTime } from '../utils';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsData {
  totalSessions: number;
  totalFocusTime: number;
  averageSessionLength: number;
  completedSessions: number;
  activeGroups: number;
  todaysSessions: number;
  thisWeeksSessions: number;
  longestSession: number;
  streakDays: number;
  uniqueHabits: number;
  productivity: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  dailyStats: Array<{
    date: string;
    sessions: number;
    totalTime: number;
  }>;
}

export const AnalyticsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { state } = useAppState();

  const analyticsData: AnalyticsData = useMemo(() => {
    const sessions = Object.values(state.sessions);
    const groups = Object.values(state.groups);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Basic stats
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.endTime).length;
    const totalFocusTime = sessions.reduce((sum, s) => {
      if (s.endTime && s.startTime) {
        const duration = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        return sum + Math.floor(duration / 1000);
      }
      return sum;
    }, 0);

    const averageSessionLength = completedSessions > 0 ? totalFocusTime / completedSessions : 0;
    const activeGroups = groups.filter(g => g.sessions.length > 0).length;
    
    // Habit-specific analytics
    const uniqueHabits = [...new Set(sessions.map(s => s.title))].length;

    // Time-based stats
    const todaysSessions = sessions.filter(s => 
      s.createdAt && new Date(s.createdAt) >= today
    ).length;

    const thisWeeksSessions = sessions.filter(s => 
      s.createdAt && new Date(s.createdAt) >= thisWeek
    ).length;

    // Longest session
    const longestSession = sessions.reduce((max, s) => {
      if (s.endTime && s.startTime) {
        const duration = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        return Math.max(max, Math.floor(duration / 1000));
      }
      return max;
    }, 0);

    // Productivity by time of day
    const productivity = { morning: 0, afternoon: 0, evening: 0 };
    sessions.forEach(s => {
      if (s.startTime) {
        const hour = new Date(s.startTime).getHours();
        if (hour >= 6 && hour < 12) productivity.morning++;
        else if (hour >= 12 && hour < 18) productivity.afternoon++;
        else productivity.evening++;
      }
    });

    // Daily stats for last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const daySessions = sessions.filter(s => 
        s.createdAt && 
        new Date(s.createdAt) >= dayStart && 
        new Date(s.createdAt) < dayEnd
      );

      const totalTime = daySessions.reduce((sum, s) => {
        if (s.endTime && s.startTime) {
          const duration = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
          return sum + Math.floor(duration / 1000);
        }
        return sum;
      }, 0);

      dailyStats.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sessions: daySessions.length,
        totalTime,
      });
    }

    // Streak calculation (simplified)
    const streakDays = thisWeeksSessions > 0 ? Math.ceil(thisWeeksSessions / 2) : 0;

    return {
      totalSessions,
      totalFocusTime,
      averageSessionLength,
      completedSessions,
      activeGroups,
      todaysSessions,
      thisWeeksSessions,
      longestSession,
      streakDays,
      productivity,
      dailyStats,
      uniqueHabits,
    };
  }, [state.sessions, state.groups]);

  const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
         <Card variant="elevated" style={styles.statCard}>
       <View style={styles.statHeader}>
         <View style={[styles.statIcon, { backgroundColor: color }]}>
           <MaterialIcons name={icon as any} size={20} color="#FFFFFF" />
         </View>
        <Text style={[styles.statTitle, { color: theme.colors.onSurfaceVariant }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      )}
    </Card>
  );

  const ProductivityChart: React.FC = () => {
    const maxValue = Math.max(
      analyticsData.productivity.morning,
      analyticsData.productivity.afternoon,
      analyticsData.productivity.evening
    );

    const getBarHeight = (value: number) => {
      return maxValue > 0 ? (value / maxValue) * 100 : 0;
    };

    return (
      <Card variant="outlined" style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
          Productivity by Time
        </Text>
        <View style={styles.chartContainer}>
          <View style={styles.barChart}>
            <View style={styles.barItem}>
              <View style={[styles.bar, { backgroundColor: theme.colors.primary }]}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      backgroundColor: theme.colors.primary,
                      height: `${getBarHeight(analyticsData.productivity.morning)}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.barLabel, { color: theme.colors.onSurfaceVariant }]}>
                Morning
              </Text>
              <Text style={[styles.barValue, { color: theme.colors.onSurface }]}>
                {analyticsData.productivity.morning}
              </Text>
            </View>

            <View style={styles.barItem}>
              <View style={[styles.bar, { backgroundColor: theme.colors.secondary }]}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      backgroundColor: theme.colors.secondary,
                      height: `${getBarHeight(analyticsData.productivity.afternoon)}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.barLabel, { color: theme.colors.onSurfaceVariant }]}>
                Afternoon
              </Text>
              <Text style={[styles.barValue, { color: theme.colors.onSurface }]}>
                {analyticsData.productivity.afternoon}
              </Text>
            </View>

            <View style={styles.barItem}>
              <View style={[styles.bar, { backgroundColor: theme.colors.accent }]}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      backgroundColor: theme.colors.accent,
                      height: `${getBarHeight(analyticsData.productivity.evening)}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.barLabel, { color: theme.colors.onSurfaceVariant }]}>
                Evening
              </Text>
              <Text style={[styles.barValue, { color: theme.colors.onSurface }]}>
                {analyticsData.productivity.evening}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const WeeklyChart: React.FC = () => {
    const maxSessions = Math.max(...analyticsData.dailyStats.map(d => d.sessions));
    
    return (
      <Card variant="outlined" style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
          Weekly Overview
        </Text>
        <View style={styles.weeklyChart}>
          {analyticsData.dailyStats.map((day, index) => (
            <View key={index} style={styles.weeklyBarItem}>
              <View style={styles.weeklyBar}>
                <View 
                  style={[
                    styles.weeklyBarFill,
                    {
                      backgroundColor: theme.colors.primary,
                      height: maxSessions > 0 ? `${(day.sessions / maxSessions) * 100}%` : '0%'
                    }
                  ]}
                />
              </View>
              <Text style={[styles.weeklyBarLabel, { color: theme.colors.onSurfaceVariant }]}>
                {day.date}
              </Text>
              <Text style={[styles.weeklyBarValue, { color: theme.colors.onSurface }]}>
                {day.sessions}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background}
      />

      <ScreenHeader
        title="Analytics"
        subtitle="Your habit tracking insights"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Sessions"
            value={analyticsData.totalSessions.toString()}
            subtitle="All time"
            icon="timer"
            color={theme.colors.primary}
          />
          
          <StatCard
            title="Focus Time"
            value={formatDuration(Math.floor(analyticsData.totalFocusTime))}
            subtitle="Total time"
            icon="access-time"
            color={theme.colors.secondary}
          />

          <StatCard
            title="Average Session"
            value={formatDuration(Math.floor(analyticsData.averageSessionLength))}
            subtitle="Per session"
            icon="trending-up"
            color={theme.colors.success}
          />

          <StatCard
            title="Active Habits"
            value={analyticsData.uniqueHabits.toString()}
            subtitle="Different habits"
            icon="fitness-center"
            color={theme.colors.warning}
          />
        </View>

        {/* Recent Performance */}
        <Card variant="filled" style={styles.performanceCard}>
          <Text style={[styles.performanceTitle, { color: theme.colors.onSurface }]}>
            Recent Performance
          </Text>
          
          <View style={styles.performanceStats}>
            <View style={styles.performanceStat}>
              <Text style={[styles.performanceValue, { color: theme.colors.primary }]}>
                {analyticsData.todaysSessions}
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Today
              </Text>
            </View>
            
            <View style={styles.performanceStat}>
              <Text style={[styles.performanceValue, { color: theme.colors.secondary }]}>
                {analyticsData.thisWeeksSessions}
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                This Week
              </Text>
            </View>
            
            <View style={styles.performanceStat}>
              <Text style={[styles.performanceValue, { color: theme.colors.success }]}>
                {analyticsData.completedSessions}
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Completed
              </Text>
            </View>
          </View>
        </Card>

        {/* Charts */}
        <ProductivityChart />
        <WeeklyChart />

        {/* Additional Insights */}
        <Card variant="outlined" style={styles.insightsCard}>
          <Text style={[styles.insightsTitle, { color: theme.colors.onSurface }]}>
            Insights
          </Text>
          
          <View style={styles.insightItem}>
            <MaterialIcons name="star" size={20} color={theme.colors.warning} />
            <Text style={[styles.insightText, { color: theme.colors.onSurfaceVariant }]}>
              Your longest session was {formatDuration(analyticsData.longestSession)}
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <MaterialIcons name="folder" size={20} color={theme.colors.primary} />
            <Text style={[styles.insightText, { color: theme.colors.onSurfaceVariant }]}>
              You have {analyticsData.activeGroups} active project folders
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <MaterialIcons name="schedule" size={20} color={theme.colors.secondary} />
            <Text style={[styles.insightText, { color: theme.colors.onSurfaceVariant }]}>
              Average session: {formatDuration(analyticsData.averageSessionLength)}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (screenWidth - 48) / 2,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  performanceCard: {
    marginBottom: 24,
    padding: 20,
  },
  performanceTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartCard: {
    marginBottom: 24,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    height: 200,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingVertical: 20,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 40,
    height: 120,
    borderRadius: 4,
    justifyContent: 'flex-end',
    opacity: 0.2,
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  weeklyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingVertical: 16,
  },
  weeklyBarItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyBar: {
    width: 24,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  weeklyBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  weeklyBarLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  weeklyBarValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  insightsCard: {
    padding: 20,
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
}); 