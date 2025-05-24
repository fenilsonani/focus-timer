import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppState } from '../../hooks/useAppState';
import { HabitReminder } from '../../types';
import { Button } from './Button';
import { InputModal } from './InputModal';
import { ModalHeader } from './ModalHeader';
import { ItemCard, Tag } from './ItemCard';

interface ReminderModalProps {
  isVisible: boolean;
  onClose: () => void;
  habitTitle?: string;
  groupId?: string;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

// Extended time options for better selection
const TIME_OPTIONS = [
  { label: '6:00 AM', value: '06:00' },
  { label: '7:00 AM', value: '07:00' },
  { label: '8:00 AM', value: '08:00' },
  { label: '9:00 AM', value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '11:00 AM', value: '11:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '1:00 PM', value: '13:00' },
  { label: '2:00 PM', value: '14:00' },
  { label: '3:00 PM', value: '15:00' },
  { label: '4:00 PM', value: '16:00' },
  { label: '5:00 PM', value: '17:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '7:00 PM', value: '19:00' },
  { label: '8:00 PM', value: '20:00' },
  { label: '9:00 PM', value: '21:00' },
  { label: '10:00 PM', value: '22:00' },
];

// Quick time selection presets
const QUICK_TIME_PRESETS = [
  { label: 'Morning', times: ['06:00', '07:00', '08:00', '09:00'] },
  { label: 'Midday', times: ['11:00', '12:00', '13:00', '14:00'] },
  { label: 'Evening', times: ['17:00', '18:00', '19:00', '20:00'] },
];

// Day presets for quick selection
const DAY_PRESETS = [
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
  { label: 'Everyday', days: [0, 1, 2, 3, 4, 5, 6] },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isVisible,
  onClose,
  habitTitle = '',
  groupId,
}) => {
  const { theme } = useTheme();
  const { state, createReminder, updateReminder, deleteReminder } = useAppState();

  const [isCreating, setIsCreating] = useState(false);
  const [editingReminder, setEditingReminder] = useState<HabitReminder | null>(null);
  const [showHabitInput, setShowHabitInput] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(habitTitle);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday to Friday
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [timeFilter, setTimeFilter] = useState<string | null>(null);

  // Get existing reminders
  const reminders = Object.values(state.reminders).sort((a, b) => 
    a.time.localeCompare(b.time)
  );

  const resetForm = useCallback(() => {
    setSelectedHabit(habitTitle);
    setSelectedTime('09:00');
    setSelectedDays([1, 2, 3, 4, 5]);
    setShowCustomTime(false);
    setEditingReminder(null);
    setIsCreating(false);
  }, [habitTitle]);

  const handleCreateReminder = useCallback(() => {
    setEditingReminder(null);
    setSelectedHabit(habitTitle);
    setSelectedTime('09:00');
    setSelectedDays([1, 2, 3, 4, 5]);
    setShowCustomTime(false);
    setIsCreating(true);
  }, [habitTitle]);

  const handleEditReminder = useCallback((reminder: HabitReminder) => {
    setEditingReminder(reminder);
    setSelectedHabit(reminder.habitTitle);
    setSelectedTime(reminder.time);
    setSelectedDays(reminder.days);
    setIsCreating(true);
  }, []);

  const toggleDay = useCallback((dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId].sort()
    );
  }, []);
  
  const selectDayPreset = useCallback((days: number[]) => {
    setSelectedDays(days);
  }, []);

  const handleTimeSelection = useCallback((time: string) => {
    setSelectedTime(time);
    setShowCustomTime(false);
  }, []);

  const handleSaveReminder = useCallback(async () => {
    if (!selectedHabit.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, {
          habitTitle: selectedHabit.trim(),
          time: selectedTime,
          days: selectedDays,
        });
      } else {
        await createReminder({
          habitTitle: selectedHabit.trim(),
          time: selectedTime,
          days: selectedDays,
          groupId,
        });
      }
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save reminder');
    }
  }, [selectedHabit, selectedTime, selectedDays, editingReminder, updateReminder, createReminder, groupId, resetForm]);

  const handleDeleteReminder = useCallback((reminder: HabitReminder) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReminder(reminder.id),
        },
      ]
    );
  }, [deleteReminder]);

  const handleToggleReminder = useCallback(async (reminder: HabitReminder, enabled: boolean) => {
    await updateReminder(reminder.id, { isEnabled: enabled });
  }, [updateReminder]);

  const formatDays = useCallback((days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    
    return days
      .map(dayId => DAYS_OF_WEEK.find(d => d.id === dayId)?.short)
      .join(', ');
  }, []);

  const formatTime12Hour = useCallback((time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, []);

  useEffect(() => {
    if (!isVisible) {
      resetForm();
    }
  }, [isVisible, resetForm]);

  // Filter times based on selected filter
  const filteredTimes = timeFilter
    ? TIME_OPTIONS.filter(time => {
        const preset = QUICK_TIME_PRESETS.find(p => p.label === timeFilter);
        return preset?.times.includes(time.value);
      })
    : TIME_OPTIONS;

  // Organize reminders by time of day
  const organizeRemindersByTime = () => {
    const organized: Record<string, HabitReminder[]> = {};
    
    reminders.forEach(reminder => {
      const hour = parseInt(reminder.time.split(':')[0]);
      let timeKey;
      
      if (hour < 12) {
        timeKey = 'Morning';
      } else if (hour < 17) {
        timeKey = 'Afternoon';
      } else {
        timeKey = 'Evening';
      }
      
      if (!organized[timeKey]) {
        organized[timeKey] = [];
      }
      
      organized[timeKey].push(reminder);
    });
    
    return organized;
  };
  
  const organizedReminders = organizeRemindersByTime();
  
  const renderReminderItem = ({ item }: { item: HabitReminder }) => {
    const dayTags: Tag[] = [
      { 
        label: formatDays(item.days),
        backgroundColor: theme.colors.surfaceVariant,
        color: theme.colors.onSurfaceVariant
      }
    ];
    
    return (
      <ItemCard
        title={item.habitTitle}
        subtitle={formatTime12Hour(item.time)}
        tags={dayTags}
        toggleEnabled={true}
        isEnabled={item.isEnabled}
        onToggle={(value) => handleToggleReminder(item, value)}
        actions={[
          {
            icon: 'edit',
            color: theme.colors.primary,
            onPress: () => handleEditReminder(item)
          },
          {
            icon: 'delete',
            color: theme.colors.error,
            onPress: () => handleDeleteReminder(item)
          }
        ]}
      />
    );
  };

  const renderTimePresetButton = ({ item }: { item: typeof QUICK_TIME_PRESETS[0] }) => (
    <TouchableOpacity
      style={[
        styles.timePresetButton,
        { 
          backgroundColor: timeFilter === item.label 
            ? theme.colors.primary + '20' 
            : theme.colors.surfaceVariant,
        }
      ]}
      onPress={() => setTimeFilter(timeFilter === item.label ? null : item.label)}
    >
      <Text style={{ 
        color: timeFilter === item.label ? theme.colors.primary : theme.colors.onSurfaceVariant,
        fontWeight: timeFilter === item.label ? '600' : '400'
      }}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderDayPresetButton = ({ item }: { item: typeof DAY_PRESETS[0] }) => {
    const isSelected = JSON.stringify(selectedDays.sort()) === JSON.stringify(item.days.sort());
    
    return (
      <TouchableOpacity
        style={[
          styles.dayPresetButton,
          { 
            backgroundColor: isSelected 
              ? theme.colors.primary 
              : theme.colors.surfaceVariant,
          }
        ]}
        onPress={() => selectDayPreset(item.days)}
      >
        <Text style={{ 
          color: isSelected ? '#FFFFFF' : theme.colors.onSurfaceVariant,
          fontWeight: isSelected ? '600' : '400'
        }}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModalHeader
          title="Reminders"
          subtitle={`${reminders.length} reminder${reminders.length !== 1 ? 's' : ''}`}
          onClose={onClose}
          onAction={handleCreateReminder}
          actionIcon="add"
        />

        {/* Create/Edit Reminder Form */}
        {isCreating && (
          <View style={[styles.reminderForm, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.formTitle, { color: theme.colors.onSurface }]}>
              {editingReminder ? 'Edit Reminder' : 'Create Reminder'}
            </Text>
            
            {/* Habit Selection */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Habit
              </Text>
              <TouchableOpacity
                style={[
                  styles.habitSelector,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => setShowHabitInput(true)}
              >
                <Text style={[
                  styles.habitSelectorText,
                  { color: selectedHabit ? theme.colors.onSurface : theme.colors.onSurfaceVariant }
                ]}>
                  {selectedHabit || 'Select habit...'}
                </Text>
                <MaterialIcons name="edit" size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Time Selection */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Time
              </Text>
              
              <FlatList
                data={QUICK_TIME_PRESETS}
                renderItem={renderTimePresetButton}
                keyExtractor={(item) => item.label}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timePresetsList}
              />

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.timeGrid}
                contentContainerStyle={styles.timeGridContent}
              >
                {filteredTimes.map((time) => (
                  <TouchableOpacity
                    key={time.value}
                    style={[
                      styles.timeButton,
                      {
                        backgroundColor: selectedTime === time.value
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderColor: selectedTime === time.value
                          ? theme.colors.primary
                          : theme.colors.border,
                      }
                    ]}
                    onPress={() => handleTimeSelection(time.value)}
                  >
                    <Text style={[
                      styles.timeButtonText,
                      {
                        color: selectedTime === time.value
                          ? '#FFFFFF'
                          : theme.colors.onSurface
                      }
                    ]}>
                      {time.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Days Selection */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Days
              </Text>
              
              <FlatList
                data={DAY_PRESETS}
                renderItem={renderDayPresetButton}
                keyExtractor={(item) => item.label}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dayPresetsList}
              />
              
              <View style={styles.daysGrid}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: selectedDays.includes(day.id)
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => toggleDay(day.id)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      {
                        color: selectedDays.includes(day.id)
                          ? '#FFFFFF'
                          : theme.colors.onSurface
                      }
                    ]}>
                      {day.short}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form Actions */}
            <View style={styles.formActions}>
              <Button
                title="Cancel"
                onPress={resetForm}
                variant="outline"
                size="small"
                style={styles.formButton}
              />
              <Button
                title={editingReminder ? 'Update' : 'Save'}
                onPress={handleSaveReminder}
                variant="primary"
                size="small"
                style={styles.formButton}
              />
            </View>
          </View>
        )}

        {/* Reminders List */}
        {!isCreating && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {reminders.length > 0 ? (
              Object.entries(organizedReminders).map(([timeOfDay, timeReminders]) => (
                <View key={timeOfDay} style={styles.timeSection}>
                  <Text style={[styles.timeSectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                    {timeOfDay} ({timeReminders.length})
                  </Text>
                  {timeReminders.map(reminder => (
                    <View key={reminder.id}>
                      {renderReminderItem({ item: reminder })}
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons 
                  name="schedule" 
                  size={64} 
                  color={theme.colors.onSurfaceVariant}
                  style={styles.emptyIcon}
                />
                <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                  No reminders yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  Tap the + button to create your first reminder
                </Text>
                <Button
                  title="Create Reminder"
                  onPress={handleCreateReminder}
                  variant="primary"
                  style={styles.emptyButton}
                />
              </View>
            )}
          </ScrollView>
        )}

        {/* Habit Input Modal */}
        <InputModal
          isVisible={showHabitInput}
          title="Habit Title"
          subtitle="Enter the name of the habit you want to be reminded about"
          placeholder="e.g., Morning Exercise"
          initialValue={selectedHabit}
          onConfirm={(value) => {
            setSelectedHabit(value);
            setShowHabitInput(false);
          }}
          onCancel={() => setShowHabitInput(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reminderForm: {
    padding: 16,
    borderBottomWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  habitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  habitSelectorText: {
    fontSize: 16,
  },
  timePresetsList: {
    marginBottom: 12,
  },
  timePresetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  timeGrid: {
    marginBottom: 8,
  },
  timeGridContent: {
    paddingBottom: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  dayPresetsList: {
    marginBottom: 12,
  },
  dayPresetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timeSection: {
    marginBottom: 20,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 180,
  },
}); 