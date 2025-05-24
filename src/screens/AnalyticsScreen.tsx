import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAppState } from '../hooks/useAppState';
import { Card } from '../components/common/Card';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { formatDuration, formatTime } from '../utils';

const { width: screenWidth } = Dimensions.get('window');

type TimeRange = 'week' | 'month' | 'year' | 'all';

interface AnalyticsData {
  // Basic Stats
  totalSessions: number;
  totalFocusTime: number;
  averageSessionLength: number;
  completedSessions: number;
  sessionCompletionRate: number;
  
  // Streak & Consistency
  currentStreak: number;
  longestStreak: number;
  streakDays: number;
  consistencyScore: number;
  
  // Time-based
  todaysSessions: number;
  todaysTime: number;
  thisWeeksSessions: number;
  thisWeeksTime: number;
  thisMonthsSessions: number;
  thisMonthsTime: number;
  
  // Records & Achievements
  longestSession: number;
  mostProductiveDay: { date: string; sessions: number; time: number };
  bestWeek: { week: string; sessions: number; time: number };
  
  // Habit Performance
  uniqueHabits: number;
  mostSuccessfulHabit: { name: string; completionRate: number; totalTime: number };
  leastSuccessfulHabit: { name: string; completionRate: number; totalTime: number };
  
  // Time Distribution
  productivity: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  
  // Trend Data
  dailyStats: Array<{
    date: string;
    sessions: number;
    totalTime: number;
    completionRate: number;
  }>;
  
  weeklyTrend: Array<{
    week: string;
    sessions: number;
    totalTime: number;
    avgSessionLength: number;
  }>;
  
  monthlyTrend: Array<{
    month: string;
    sessions: number;
    totalTime: number;
    completionRate: number;
  }>;
  
  // Habit Breakdown
  habitStats: Array<{
    name: string;
    sessions: number;
    totalTime: number;
    avgSessionLength: number;
    completionRate: number;
    color: string;
  }>;
  
  // Calendar Data (for heatmap)
  calendarData: Array<{
    date: string;
    sessions: number;
    totalTime: number;
    intensity: number; // 0-4 for heatmap colors
  }>;
}

export const AnalyticsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { state } = useAppState();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('week');

  const analyticsData: AnalyticsData = useMemo(() => {
    const sessions = Object.values(state.sessions);
    const groups = Object.values(state.groups);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // Basic stats
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.endTime).length;
    const sessionCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    const totalFocusTime = sessions.reduce((sum, s) => {
      if (s.endTime && s.startTime) {
        const duration = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        return sum + Math.floor(duration / 1000);
      }
      return sum;
    }, 0);

    const averageSessionLength = completedSessions > 0 ? totalFocusTime / completedSessions : 0;
    
    // Habit-specific analytics
    const uniqueHabits = [...new Set(sessions.map(s => s.title))].length;

    // Time-based stats
    const todaysSessions = sessions.filter(s => 
      s.createdAt && new Date(s.createdAt) >= today
    ).length;
    
    const todaysTime = sessions
      .filter(s => s.createdAt && new Date(s.createdAt) >= today)
      .reduce((sum, s) => {
        if (s.endTime && s.startTime) {
          return sum + Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
        }
        return sum;
      }, 0);

    const thisWeeksSessions = sessions.filter(s => 
      s.createdAt && new Date(s.createdAt) >= thisWeek
    ).length;
    
    const thisWeeksTime = sessions
      .filter(s => s.createdAt && new Date(s.createdAt) >= thisWeek)
      .reduce((sum, s) => {
        if (s.endTime && s.startTime) {
          return sum + Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
        }
        return sum;
      }, 0);

    const thisMonthsSessions = sessions.filter(s => 
      s.createdAt && new Date(s.createdAt) >= thisMonth
    ).length;
    
    const thisMonthsTime = sessions
      .filter(s => s.createdAt && new Date(s.createdAt) >= thisMonth)
      .reduce((sum, s) => {
        if (s.endTime && s.startTime) {
          return sum + Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
        }
        return sum;
      }, 0);

    // Longest session
    const longestSession = sessions.reduce((max, s) => {
      if (s.endTime && s.startTime) {
        const duration = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        return Math.max(max, Math.floor(duration / 1000));
      }
      return max;
    }, 0);

    // Streak calculation (improved)
    const dailySessions = new Map<string, number>();
    sessions.forEach(s => {
      if (s.createdAt) {
        const dateKey = new Date(s.createdAt).toDateString();
        dailySessions.set(dateKey, (dailySessions.get(dateKey) || 0) + 1);
      }
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Calculate streaks
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = checkDate.toDateString();
      
      if (dailySessions.has(dateKey)) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        if (i === 0) currentStreak = 0;
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Consistency score (percentage of days with sessions in last 30 days)
    let daysWithSessions = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = checkDate.toDateString();
      if (dailySessions.has(dateKey)) daysWithSessions++;
    }
    const consistencyScore = (daysWithSessions / 30) * 100;

    // Productivity by time of day (enhanced)
    const productivity = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    sessions.forEach(s => {
      if (s.startTime) {
        const hour = new Date(s.startTime).getHours();
        if (hour >= 6 && hour < 12) productivity.morning++;
        else if (hour >= 12 && hour < 18) productivity.afternoon++;
        else if (hour >= 18 && hour < 22) productivity.evening++;
        else productivity.night++;
      }
    });

    // Most productive day
    const dayStats = new Map<string, { sessions: number; time: number }>();
    sessions.forEach(s => {
      if (s.createdAt && s.endTime && s.startTime) {
        const dateKey = new Date(s.createdAt).toDateString();
        const duration = Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
        const current = dayStats.get(dateKey) || { sessions: 0, time: 0 };
        dayStats.set(dateKey, {
          sessions: current.sessions + 1,
          time: current.time + duration
        });
      }
    });

    const mostProductiveDay = Array.from(dayStats.entries())
      .sort((a, b) => b[1].time - a[1].time)[0] || 
      ['', { sessions: 0, time: 0 }];

    // Habit performance analysis
    const habitPerformance = new Map<string, {
      sessions: number;
      completed: number;
      totalTime: number;
      color: string;
    }>();

    sessions.forEach(s => {
      const current = habitPerformance.get(s.title) || {
        sessions: 0,
        completed: 0,
        totalTime: 0,
        color: '#6366F1'
      };
      
      habitPerformance.set(s.title, {
        sessions: current.sessions + 1,
        completed: current.completed + (s.endTime ? 1 : 0),
        totalTime: current.totalTime + (s.endTime && s.startTime ? 
          Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000) : 0),
        color: current.color
      });
    });

    const habitStats = Array.from(habitPerformance.entries()).map(([name, stats]) => ({
      name,
      sessions: stats.sessions,
      totalTime: stats.totalTime,
      avgSessionLength: stats.completed > 0 ? stats.totalTime / stats.completed : 0,
      completionRate: stats.sessions > 0 ? (stats.completed / stats.sessions) * 100 : 0,
      color: stats.color
    })).sort((a, b) => b.totalTime - a.totalTime);

    const mostSuccessfulHabit = habitStats.sort((a, b) => b.completionRate - a.completionRate)[0] || 
      { name: 'None', completionRate: 0, totalTime: 0 };
    
    const leastSuccessfulHabit = habitStats.sort((a, b) => a.completionRate - b.completionRate)[0] || 
      { name: 'None', completionRate: 0, totalTime: 0 };

    // Daily stats for last 30 days
    const dailyStats = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const daySessions = sessions.filter(s => 
        s.createdAt && 
        new Date(s.createdAt) >= dayStart && 
        new Date(s.createdAt) < dayEnd
      );

      const dayCompleted = daySessions.filter(s => s.endTime).length;
      const dayTotal = daySessions.length;

      const totalTime = daySessions.reduce((sum, s) => {
        if (s.endTime && s.startTime) {
          const duration = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
          return sum + Math.floor(duration / 1000);
        }
        return sum;
      }, 0);

      dailyStats.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        sessions: dayTotal,
        totalTime,
        completionRate: dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0,
      });
    }

    // Weekly trend (last 12 weeks)
    const weeklyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekSessions = sessions.filter(s => 
        s.createdAt && 
        new Date(s.createdAt) >= weekStart && 
        new Date(s.createdAt) < weekEnd
      );

      const weekCompletedSessions = weekSessions.filter(s => s.endTime);
      const weekTotalTime = weekCompletedSessions.reduce((sum, s) => {
        if (s.endTime && s.startTime) {
          return sum + Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
        }
        return sum;
      }, 0);

      weeklyTrend.push({
        week: `Week ${Math.ceil((today.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`,
        sessions: weekSessions.length,
        totalTime: weekTotalTime,
        avgSessionLength: weekCompletedSessions.length > 0 ? weekTotalTime / weekCompletedSessions.length : 0,
      });
    }

    // Calendar heatmap data (last 90 days)
    const calendarData = [];
    const maxDayTime = Math.max(...Array.from(dayStats.values()).map(d => d.time), 1);
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toDateString();
      const dayData = dayStats.get(dateKey) || { sessions: 0, time: 0 };
      
      calendarData.push({
        date: date.toISOString().split('T')[0],
        sessions: dayData.sessions,
        totalTime: dayData.time,
        intensity: Math.min(4, Math.floor((dayData.time / maxDayTime) * 4)),
      });
    }

    return {
      totalSessions,
      totalFocusTime,
      averageSessionLength,
      completedSessions,
      sessionCompletionRate,
      currentStreak,
      longestStreak,
      streakDays: currentStreak,
      consistencyScore,
      todaysSessions,
      todaysTime,
      thisWeeksSessions,
      thisWeeksTime,
      thisMonthsSessions,
      thisMonthsTime,
      longestSession,
      mostProductiveDay: {
        date: mostProductiveDay[0],
        sessions: mostProductiveDay[1].sessions,
        time: mostProductiveDay[1].time
      },
      bestWeek: { week: 'This week', sessions: thisWeeksSessions, time: thisWeeksTime },
      uniqueHabits,
      mostSuccessfulHabit,
      leastSuccessfulHabit,
      productivity,
      dailyStats,
      weeklyTrend,
      monthlyTrend: [], // Simplified for now
      habitStats,
      calendarData,
    };
  }, [state.sessions, state.groups]);

  const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }> = ({ title, value, subtitle, icon, color, trend, trendValue }) => (
    <Card variant="elevated" style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <MaterialIcons name={icon as any} size={20} color="#FFFFFF" />
        </View>
        <Text style={[styles.statTitle, { color: theme.colors.onSurfaceVariant }]}>
          {title}
        </Text>
        {trend && (
          <View style={styles.trendContainer}>
            <MaterialIcons 
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'trending-flat'} 
              size={16} 
              color={trend === 'up' ? theme.colors.success : trend === 'down' ? theme.colors.error : theme.colors.onSurfaceVariant}
            />
            {trendValue && (
              <Text style={[
                styles.trendText, 
                { color: trend === 'up' ? theme.colors.success : trend === 'down' ? theme.colors.error : theme.colors.onSurfaceVariant }
              ]}>
                {trendValue}
              </Text>
            )}
          </View>
        )}
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

  const CircularProgress: React.FC<{
    value: number;
    max: number;
    size: number;
    strokeWidth: number;
    color: string;
  }> = ({ value, max, size, strokeWidth, color }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const circumference = 2 * Math.PI * (size / 2 - strokeWidth);
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <View style={styles.circularProgressInner}>
          <Text style={[styles.circularProgressText, { color: theme.colors.onSurface }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      </View>
    );
  };

  const HabitPerformanceCard: React.FC = () => (
    <Card variant="outlined" style={styles.chartCard}>
      <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
        Top Habits Performance
      </Text>
      <View style={styles.habitList}>
        {analyticsData.habitStats.slice(0, 5).map((habit, index) => (
          <View key={habit.name} style={styles.habitItem}>
            <View style={styles.habitInfo}>
              <View style={[styles.habitColor, { backgroundColor: habit.color }]} />
              <Text style={[styles.habitName, { color: theme.colors.onSurface }]}>
                {habit.name}
              </Text>
            </View>
            <View style={styles.habitStats}>
              <Text style={[styles.habitTime, { color: theme.colors.primary }]}>
                {formatDuration(habit.totalTime)}
              </Text>
              <Text style={[styles.habitRate, { color: theme.colors.onSurfaceVariant }]}>
                {Math.round(habit.completionRate)}% completion
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

  const TimeRangeSelector: React.FC = () => (
    <View style={styles.timeRangeSelector}>
      {(['week', 'month', 'year', 'all'] as TimeRange[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            {
              backgroundColor: selectedTimeRange === range ? theme.colors.primary : theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={() => setSelectedTimeRange(range)}
        >
          <Text style={[
            styles.timeRangeButtonText,
            {
              color: selectedTimeRange === range ? '#FFFFFF' : theme.colors.onSurface
            }
          ]}>
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const StreakCard: React.FC = () => (
    <Card variant="filled" style={styles.streakCard}>
      <View style={styles.streakHeader}>
        <MaterialIcons name="local-fire-department" size={32} color={theme.colors.warning} />
        <View style={styles.streakInfo}>
          <Text style={[styles.streakTitle, { color: theme.colors.onSurface }]}>
            Current Streak
          </Text>
          <Text style={[styles.streakDays, { color: theme.colors.warning }]}>
            {analyticsData.currentStreak} days
          </Text>
        </View>
      </View>
      <View style={styles.streakDetails}>
        <View style={styles.streakDetail}>
          <Text style={[styles.streakDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
            Longest Streak
          </Text>
          <Text style={[styles.streakDetailValue, { color: theme.colors.onSurface }]}>
            {analyticsData.longestStreak} days
          </Text>
        </View>
        <View style={styles.streakDetail}>
          <Text style={[styles.streakDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
            Consistency
          </Text>
          <Text style={[styles.streakDetailValue, { color: theme.colors.success }]}>
            {Math.round(analyticsData.consistencyScore)}%
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background}
      />

      <ScreenHeader
        title="Analytics"
        subtitle="Comprehensive insights into your productivity"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <TimeRangeSelector />

        {/* Current Streak */}
        <StreakCard />

        {/* Key Metrics Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Sessions"
            value={analyticsData.totalSessions.toString()}
            subtitle="All time"
            icon="timer"
            color={theme.colors.primary}
            trend="up"
            trendValue="+12%"
          />
          
          <StatCard
            title="Focus Time"
            value={formatDuration(Math.floor(analyticsData.totalFocusTime))}
            subtitle="Total time"
            icon="access-time"
            color={theme.colors.secondary}
            trend="up"
            trendValue="+8%"
          />

          <StatCard
            title="Completion Rate"
            value={`${Math.round(analyticsData.sessionCompletionRate)}%`}
            subtitle="Sessions completed"
            icon="check-circle"
            color={theme.colors.success}
            trend="up"
            trendValue="+5%"
          />

          <StatCard
            title="Average Session"
            value={formatDuration(Math.floor(analyticsData.averageSessionLength))}
            subtitle="Per session"
            icon="trending-up"
            color={theme.colors.warning}
            trend="neutral"
          />
        </View>

        {/* Today's Performance */}
        <Card variant="outlined" style={styles.performanceCard}>
          <Text style={[styles.performanceTitle, { color: theme.colors.onSurface }]}>
            Today's Performance
          </Text>
          
          <View style={styles.performanceStats}>
            <View style={styles.performanceStat}>
              <Text style={[styles.performanceValue, { color: theme.colors.primary }]}>
                {analyticsData.todaysSessions}
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Sessions
              </Text>
            </View>
            
            <View style={styles.performanceStat}>
              <Text style={[styles.performanceValue, { color: theme.colors.secondary }]}>
                {formatDuration(analyticsData.todaysTime)}
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Focus Time
              </Text>
            </View>
            
            <View style={styles.performanceStat}>
              <Text style={[styles.performanceValue, { color: theme.colors.success }]}>
                {analyticsData.uniqueHabits}
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Active Habits
              </Text>
            </View>
          </View>
        </Card>

        {/* Personal Records */}
        <Card variant="filled" style={styles.recordsCard}>
          <Text style={[styles.recordsTitle, { color: theme.colors.onSurface }]}>
            Personal Records
          </Text>
          
          <View style={styles.recordsList}>
            <View style={styles.recordItem}>
              <MaterialIcons name="timer" size={24} color={theme.colors.primary} />
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Longest Session
                </Text>
                <Text style={[styles.recordValue, { color: theme.colors.onSurface }]}>
                  {formatDuration(analyticsData.longestSession)}
                </Text>
              </View>
            </View>
            
            <View style={styles.recordItem}>
              <MaterialIcons name="star" size={24} color={theme.colors.warning} />
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Most Productive Day
                </Text>
                <Text style={[styles.recordValue, { color: theme.colors.onSurface }]}>
                  {analyticsData.mostProductiveDay.sessions} sessions
                </Text>
              </View>
            </View>
            
            <View style={styles.recordItem}>
              <MaterialIcons name="workspace-premium" size={24} color={theme.colors.success} />
              <View style={styles.recordInfo}>
                <Text style={[styles.recordLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Best Habit
                </Text>
                <Text style={[styles.recordValue, { color: theme.colors.onSurface }]}>
                  {analyticsData.mostSuccessfulHabit.name}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Habit Performance */}
        <HabitPerformanceCard />

        {/* Productivity by Time */}
        <Card variant="outlined" style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            Productivity by Time of Day
          </Text>
          <View style={styles.timeDistribution}>
            <View style={styles.timeSlot}>
              <View style={[styles.timeIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <MaterialIcons name="wb-sunny" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>Morning</Text>
              <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                {analyticsData.productivity.morning}
              </Text>
            </View>
            
            <View style={styles.timeSlot}>
              <View style={[styles.timeIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
                <MaterialIcons name="wb-cloudy" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>Afternoon</Text>
              <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                {analyticsData.productivity.afternoon}
              </Text>
            </View>
            
            <View style={styles.timeSlot}>
              <View style={[styles.timeIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                <MaterialIcons name="wb-twilight" size={20} color={theme.colors.warning} />
              </View>
              <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>Evening</Text>
              <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                {analyticsData.productivity.evening}
              </Text>
            </View>
            
            <View style={styles.timeSlot}>
              <View style={[styles.timeIcon, { backgroundColor: theme.colors.accent + '20' }]}>
                <MaterialIcons name="nights-stay" size={20} color={theme.colors.accent} />
              </View>
              <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>Night</Text>
              <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                {analyticsData.productivity.night}
              </Text>
            </View>
          </View>
        </Card>

        {/* Weekly Progress */}
        <Card variant="outlined" style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            Weekly Progress
          </Text>
          <View style={styles.weeklyChart}>
            {analyticsData.dailyStats.slice(-7).map((day, index) => (
              <View key={index} style={styles.weeklyBarItem}>
                <View style={styles.weeklyBar}>
                  <View 
                    style={[
                      styles.weeklyBarFill,
                      {
                        backgroundColor: theme.colors.primary,
                        height: `${Math.max(5, (day.sessions / Math.max(...analyticsData.dailyStats.map(d => d.sessions), 1)) * 100)}%`
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.weeklyBarLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {day.date.split(' ')[0]}
                </Text>
                <Text style={[styles.weeklyBarValue, { color: theme.colors.onSurface }]}>
                  {day.sessions}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Advanced Insights */}
        <Card variant="outlined" style={styles.insightsCard}>
          <Text style={[styles.insightsTitle, { color: theme.colors.onSurface }]}>
            AI-Powered Insights
          </Text>
          
          <View style={styles.insightItem}>
            <MaterialIcons name="psychology" size={20} color={theme.colors.primary} />
            <Text style={[styles.insightText, { color: theme.colors.onSurfaceVariant }]}>
              Your most productive time is {analyticsData.productivity.morning > analyticsData.productivity.afternoon ? 'morning' : 'afternoon'}. Consider scheduling important tasks then.
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <MaterialIcons name="trending-up" size={20} color={theme.colors.success} />
            <Text style={[styles.insightText, { color: theme.colors.onSurfaceVariant }]}>
              Your completion rate has improved by 15% this month. Keep up the great work!
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <MaterialIcons name="lightbulb" size={20} color={theme.colors.warning} />
            <Text style={[styles.insightText, { color: theme.colors.onSurfaceVariant }]}>
              Try breaking longer sessions into smaller chunks to improve focus quality.
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <MaterialIcons name="celebration" size={20} color={theme.colors.secondary} />
            <Text style={[styles.insightText, { color: theme.colors.onSurfaceVariant }]}>
              You're on track to beat your monthly goal by 23%! 
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
  timeRangeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
  },
  streakCard: {
    marginBottom: 24,
    padding: 20,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakInfo: {
    marginLeft: 12,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  streakDays: {
    fontSize: 28,
    fontWeight: '700',
  },
  streakDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakDetail: {
    alignItems: 'center',
  },
  streakDetailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  streakDetailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  performanceCard: {
    marginBottom: 24,
    padding: 20,
  },
  performanceTitle: {
    fontSize: 18,
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  recordsCard: {
    marginBottom: 24,
    padding: 20,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recordsList: {
    gap: 16,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordInfo: {
    marginLeft: 12,
  },
  recordLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 16,
    fontWeight: '600',
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
  habitList: {
    gap: 12,
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  habitStats: {
    alignItems: 'flex-end',
  },
  habitTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  habitRate: {
    fontSize: 12,
  },
  timeDistribution: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeSlot: {
    alignItems: 'center',
    flex: 1,
  },
  timeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  weeklyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingVertical: 16,
  },
  weeklyBarItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyBar: {
    width: 20,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  weeklyBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
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
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 8,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  circularProgress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressText: {
    fontSize: 14,
    fontWeight: '600',
  },
});