import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppState } from '../../hooks/useAppState';
import { Button } from './Button';
import { TimePickerModal } from './TimePickerModal';
import { formatDuration } from '../../utils';

interface HabitCreationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCreateHabit: (name: string, duration: number) => void;
}

const QUICK_DURATIONS = [
  { minutes: 5, label: '5 min', icon: 'speed', color: '#FF6B6B' },
  { minutes: 10, label: '10 min', icon: 'timer-10', color: '#4ECDC4' },
  { minutes: 15, label: '15 min', icon: 'self-improvement', color: '#45B7D1' },
  { minutes: 20, label: '20 min', icon: 'schedule', color: '#96CEB4' },
  { minutes: 25, label: '25 min', icon: 'timer', color: '#FECA57' },
  { minutes: 30, label: '30 min', icon: 'fitness-center', color: '#FF9FF3' },
  { minutes: 45, label: '45 min', icon: 'psychology', color: '#54A0FF' },
  { minutes: 60, label: '1 hour', icon: 'access-time', color: '#5F27CD' },
];

export const HabitCreationModal: React.FC<HabitCreationModalProps> = ({
  isVisible,
  onClose,
  onCreateHabit,
}) => {
  const { theme } = useTheme();
  const { state } = useAppState();
  const [name, setName] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(state.settings.defaultFocusDuration);
  const [error, setError] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isVisible) {
      setName('');
      setSelectedDuration(state.settings.defaultFocusDuration);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isVisible, state.settings.defaultFocusDuration]);

  const handleCreate = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Habit name is required');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Habit name must be at least 2 characters');
      return;
    }

    // Check for duplicate names in current context
    const existingHabits = Object.values(state.sessions).map(s => s.title.toLowerCase());
    if (existingHabits.includes(trimmedName.toLowerCase())) {
      setError('A habit with this name already exists');
      return;
    }

    onCreateHabit(trimmedName, selectedDuration);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setSelectedDuration(state.settings.defaultFocusDuration);
    setError(null);
    onClose();
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (error) {
      setError(null);
    }
  };

  const DurationButton: React.FC<{ duration: typeof QUICK_DURATIONS[0] }> = ({ duration }) => {
    const isSelected = selectedDuration === duration.minutes * 60;
    
    return (
      <TouchableOpacity
        style={[
          styles.durationButton,
          {
            backgroundColor: isSelected ? duration.color : theme.colors.surface,
            borderColor: isSelected ? duration.color : theme.colors.border,
          }
        ]}
        onPress={() => setSelectedDuration(duration.minutes * 60)}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={duration.icon as any}
          size={20}
          color={isSelected ? '#FFFFFF' : duration.color}
        />
        <Text style={[
          styles.durationButtonText,
          { color: isSelected ? '#FFFFFF' : theme.colors.onSurface }
        ]}>
          {duration.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Create New Habit
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Build a lasting habit with focused sessions
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Habit Name Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Habit Name
            </Text>
            <TextInput
              ref={inputRef}
              style={[
                styles.nameInput,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: error ? theme.colors.error : theme.colors.border,
                  color: theme.colors.onSurface,
                }
              ]}
              value={name}
              onChangeText={handleNameChange}
              placeholder="e.g., Morning Exercise, Daily Reading..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              maxLength={50}
            />
            
            {error && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error" size={16} color={theme.colors.error} />
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              </View>
            )}
            
            <Text style={[styles.charCount, { color: theme.colors.onSurfaceVariant }]}>
              {name.length}/50
            </Text>
          </View>

          {/* Duration Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Session Duration
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Choose how long each session should be
            </Text>
            
            <View style={styles.currentDuration}>
              <MaterialIcons name="schedule" size={20} color={theme.colors.primary} />
              <Text style={[styles.currentDurationText, { color: theme.colors.onSurface }]}>
                Selected: {formatDuration(selectedDuration)}
              </Text>
            </View>

            <View style={styles.durationGrid}>
              {QUICK_DURATIONS.map((duration, index) => (
                <DurationButton key={index} duration={duration} />
              ))}
              
              {/* Custom Duration Button */}
              <TouchableOpacity
                style={[
                  styles.customDurationButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.primary,
                  }
                ]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
                <Text style={[
                  styles.customDurationButtonText,
                  { color: theme.colors.primary }
                ]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Popular Habits Suggestions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Popular Habits
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Tap to use these names as inspiration
            </Text>
            
            <View style={styles.suggestionsGrid}>
              {[
                'Morning Exercise', 'Daily Meditation', 'Reading Session',
                'Deep Work', 'Language Learning', 'Yoga Practice',
                'Journaling', 'Skill Practice', 'Creative Writing'
              ].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={[styles.suggestionChip, { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border 
                  }]}
                  onPress={() => setName(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: theme.colors.onSurface }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
          <Button
            title="Cancel"
            onPress={handleClose}
            variant="ghost"
            style={styles.actionButton}
          />
          <Button
            title="Create Habit"
            onPress={handleCreate}
            variant="primary"
            style={styles.actionButton}
            disabled={!name.trim()}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Custom Time Picker Modal */}
      <TimePickerModal
        isVisible={showTimePicker}
        title="Set Custom Duration"
        subtitle="Choose exactly how long your habit session should be"
        initialDuration={selectedDuration}
        onConfirm={(duration) => {
          setSelectedDuration(duration);
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
      />
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
    fontSize: 18,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
  },
  currentDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  currentDurationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    minWidth: 80,
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  customDurationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    gap: 6,
    minWidth: 90,
  },
  customDurationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 