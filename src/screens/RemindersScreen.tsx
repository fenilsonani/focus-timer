import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAppState } from '../hooks/useAppState';
import { Button } from '../components/common/Button';
import { ReminderModal } from '../components/common/ReminderModal';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { HabitReminder } from '../types';
import { formatTime } from '../utils';

type ReminderFilterType = 'all' | 'enabled' | 'disabled' | 'today';
type ReminderSortType = 'time' | 'habit' | 'recent';

export const RemindersScreen: React.FC = () => {
  const { theme } = useTheme();
  const { state, updateReminder, deleteReminder } = useAppState();
  
  const [selectedFilter, setSelectedFilter] = useState<ReminderFilterType>('all');
  const [selectedSort, setSelectedSort] = useState<ReminderSortType>('time');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Get all reminders
  const allReminders = Object.values(state.reminders);
  
  // Current day for today filter
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayMappings: { [key: string]: string } = {
    'sunday': 'sun',
    'monday': 'mon',
    'tuesday': 'tue',
    'wednesday': 'wed',
    'thursday': 'thu',
    'friday': 'fri',
    'saturday': 'sat'
  };

  // Filter and sort reminders
  const filteredAndSortedReminders = useMemo(() => {
    let filtered = allReminders;

    // Apply filter
    if (selectedFilter === 'enabled') {
      filtered = allReminders.filter(reminder => reminder.isEnabled);
    } else if (selectedFilter === 'disabled') {
      filtered = allReminders.filter(reminder => !reminder.isEnabled);
    } else if (selectedFilter === 'today') {
      const todayDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      filtered = allReminders.filter(reminder => 
        reminder.isEnabled && reminder.days.includes(todayDay)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'time':
          return a.time.localeCompare(b.time);
        case 'habit':
          const habitA = a.habitTitle || '';
          const habitB = b.habitTitle || '';
          return habitA.localeCompare(habitB);
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [allReminders, selectedFilter, selectedSort]);

  // Group reminders by time for better organization
  const remindersByTime = useMemo(() => {
    const grouped: { [time: string]: HabitReminder[] } = {};
    
    filteredAndSortedReminders.forEach(reminder => {
      const timeKey = reminder.time;
      if (!grouped[timeKey]) {
        grouped[timeKey] = [];
      }
      grouped[timeKey].push(reminder);
    });

    return grouped;
  }, [filteredAndSortedReminders]);

  const handleToggleReminder = useCallback(async (reminder: HabitReminder) => {
    await updateReminder(reminder.id, { ...reminder, isEnabled: !reminder.isEnabled });
  }, [updateReminder]);

  const handleReminderSelect = useCallback((reminderId: string) => {
    if (!isSelectionMode) return;
    
    setSelectedReminders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reminderId)) {
        newSet.delete(reminderId);
      } else {
        newSet.add(reminderId);
      }
      return newSet;
    });
  }, [isSelectionMode]);

  const handleBulkToggle = useCallback(async (enable: boolean) => {
    if (selectedReminders.size === 0) return;

    for (const reminderId of selectedReminders) {
      const reminder = state.reminders[reminderId];
      if (reminder) {
        await updateReminder(reminderId, { ...reminder, isEnabled: enable });
      }
    }
    
    setSelectedReminders(new Set());
    setIsSelectionMode(false);
  }, [selectedReminders, state.reminders, updateReminder]);

  const handleBulkDelete = useCallback(() => {
    if (selectedReminders.size === 0) return;

    Alert.alert(
      'Delete Reminders',
      `Are you sure you want to delete ${selectedReminders.size} reminder${selectedReminders.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const reminderId of selectedReminders) {
              await deleteReminder(reminderId);
            }
            setSelectedReminders(new Set());
            setIsSelectionMode(false);
          },
        },
      ]
    );
  }, [selectedReminders, deleteReminder]);

  const clearSelection = useCallback(() => {
    setSelectedReminders(new Set());
    setIsSelectionMode(false);
  }, []);

  const testReminder = useCallback((reminder: HabitReminder) => {
    Alert.alert(
      'Test Reminder',
      `This is how your reminder will look:\n\n"⏰ Time for ${reminder.habitTitle}!\n${formatDaysText(reminder.days)} at ${reminder.time}"`,
      [{ text: 'OK' }]
    );
  }, []);

  const formatDaysText = (days: number[]): string => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    
    const dayNames: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return days.map(day => dayNames[day]).join(', ');
  };

  const ReminderCard: React.FC<{ reminder: HabitReminder }> = ({ reminder }) => {
    const isSelected = selectedReminders.has(reminder.id);
    const todayDay = new Date().getDay();
    const isToday = reminder.days.includes(todayDay);
    
    return (
      <TouchableOpacity
        onPress={() => handleReminderSelect(reminder.id)}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedReminders(new Set([reminder.id]));
          }
        }}
        style={[
          styles.reminderCard,
          {
            backgroundColor: isSelected 
              ? theme.colors.primary + '15' 
              : theme.colors.surface,
            borderColor: isSelected 
              ? theme.colors.primary 
              : theme.colors.border,
            opacity: reminder.isEnabled ? 1 : 0.6,
          }
        ]}
      >
        <View style={styles.reminderHeader}>
          <View style={styles.reminderInfo}>
            <View style={styles.reminderTitleRow}>
              <Text style={[styles.reminderHabit, { color: theme.colors.onSurface }]}>
                {reminder.habitTitle || 'Unknown Habit'}
              </Text>
              
              {isToday && reminder.isEnabled && (
                <View style={[styles.todayBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                  <Text style={[styles.todayText, { color: theme.colors.accent }]}>
                    Today
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={[styles.reminderTime, { color: theme.colors.primary }]}>
              {reminder.time}
            </Text>
            
            <Text style={[styles.reminderDays, { color: theme.colors.onSurfaceVariant }]}>
              {formatDaysText(reminder.days)}
            </Text>
          </View>
          
          <View style={styles.reminderActions}>
            {isSelectionMode ? (
              <View style={[
                styles.selectionIndicator,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant,
                  borderColor: theme.colors.border,
                }
              ]}>
                {isSelected && (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  onPress={() => testReminder(reminder)}
                  style={styles.actionButton}
                >
                  <MaterialIcons name="play-arrow" size={20} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
                
                <Switch
                  value={reminder.isEnabled}
                  onValueChange={() => handleToggleReminder(reminder)}
                  trackColor={{ 
                    false: theme.colors.surfaceVariant, 
                    true: theme.colors.primary + '40' 
                  }}
                  thumbColor={reminder.isEnabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton: React.FC<{ filter: ReminderFilterType; label: string; count: number }> = ({ 
    filter, label, count 
  }) => (
    <TouchableOpacity
      onPress={() => setSelectedFilter(filter)}
      style={[
        styles.filterButton,
        {
          backgroundColor: selectedFilter === filter 
            ? theme.colors.primary 
            : theme.colors.surface,
          borderColor: selectedFilter === filter 
            ? theme.colors.primary 
            : theme.colors.border,
        }
      ]}
    >
      <Text style={[
        styles.filterButtonText,
        {
          color: selectedFilter === filter 
            ? '#FFFFFF' 
            : theme.colors.onSurface
        }
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const enabledCount = allReminders.filter(r => r.isEnabled).length;
  const disabledCount = allReminders.filter(r => !r.isEnabled).length;
  const todayDay = new Date().getDay();
  const todayCount = allReminders.filter(r => 
    r.isEnabled && r.days.includes(todayDay)
  ).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Reminders"
        subtitle="Manage your habit reminders"
        rightElement={
          isSelectionMode ? (
            <View style={styles.selectionActions}>
              <Text style={[styles.selectionCount, { color: theme.colors.onSurfaceVariant }]}>
                {selectedReminders.size} selected
              </Text>
              <TouchableOpacity 
                onPress={() => handleBulkToggle(true)} 
                style={styles.bulkActionButton}
              >
                <MaterialIcons name="notifications-active" size={20} color={theme.colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleBulkToggle(false)} 
                style={styles.bulkActionButton}
              >
                <MaterialIcons name="notifications-off" size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBulkDelete} style={styles.bulkActionButton}>
                <MaterialIcons name="delete" size={20} color={theme.colors.error} />
              </TouchableOpacity>
              <TouchableOpacity onPress={clearSelection} style={styles.bulkActionButton}>
                <MaterialIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowReminderModal(true)}
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )
        }
      />

      {/* Filters and Sort */}
      <View style={[styles.filtersSection, { borderBottomColor: theme.colors.border }]}>

        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <FilterButton filter="all" label="All" count={allReminders.length} />
          <FilterButton filter="enabled" label="Active" count={enabledCount} />
          <FilterButton filter="disabled" label="Inactive" count={disabledCount} />
          <FilterButton filter="today" label="Today" count={todayCount} />
        </ScrollView>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: theme.colors.onSurfaceVariant }]}>Sort by:</Text>
          <TouchableOpacity
            onPress={() => {
              const options: ReminderSortType[] = ['time', 'habit', 'recent'];
              const currentIndex = options.indexOf(selectedSort);
              const nextIndex = (currentIndex + 1) % options.length;
              setSelectedSort(options[nextIndex]);
            }}
            style={[styles.sortButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.sortButtonText, { color: theme.colors.primary }]}>
              {selectedSort === 'time' ? 'Time' : 
               selectedSort === 'habit' ? 'Habit' : 'Most Recent'}
            </Text>
            <MaterialIcons name="swap-vert" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredAndSortedReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="schedule" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
              No reminders found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {selectedFilter === 'all'
                ? 'Create your first reminder to stay on track'
                : `No ${selectedFilter} reminders`
              }
            </Text>
            {selectedFilter === 'all' && (
              <Button
                title="Create Reminder"
                onPress={() => setShowReminderModal(true)}
                variant="primary"
                style={styles.emptyActionButton}
              />
            )}
          </View>
        ) : (
          <>
            {selectedSort === 'time' ? (
              // Group by time when sorting by time
              Object.keys(remindersByTime)
                .sort()
                .map(time => (
                  <View key={time} style={styles.timeGroup}>
                    <View style={[styles.timeHeader, { backgroundColor: theme.colors.primary + '10' }]}>
                      <MaterialIcons name="access-time" size={20} color={theme.colors.primary} />
                      <Text style={[styles.timeTitle, { color: theme.colors.primary }]}>
                        {time}
                      </Text>
                      <Text style={[styles.timeCount, { color: theme.colors.primary }]}>
                        {remindersByTime[time].length}
                      </Text>
                    </View>
                    {remindersByTime[time].map(reminder => (
                      <ReminderCard key={reminder.id} reminder={reminder} />
                    ))}
                  </View>
                ))
            ) : (
              // Simple list for other sort types
              filteredAndSortedReminders.map(reminder => (
                <ReminderCard key={reminder.id} reminder={reminder} />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Statistics Footer */}
      {allReminders.length > 0 && (
        <View style={[styles.statsFooter, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {enabledCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Active
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.accent }]}>
              {todayCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Today
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
              {allReminders.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Total
            </Text>
          </View>
        </View>
      )}

      {/* Reminder Modal */}
      <ReminderModal
        isVisible={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  bulkActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  timeGroup: {
    marginBottom: 20,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timeCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  reminderCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
    marginRight: 16,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reminderHabit: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reminderTime: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  reminderDays: {
    fontSize: 14,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActionButton: {
    minWidth: 140,
  },
  statsFooter: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
  },
}); 