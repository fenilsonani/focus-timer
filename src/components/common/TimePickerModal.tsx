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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';
import { formatDuration } from '../../utils';

interface TimePickerModalProps {
  isVisible: boolean;
  title: string;
  subtitle?: string;
  initialDuration?: number; // in seconds
  onConfirm: (duration: number) => void; // duration in seconds
  onCancel: () => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  isVisible,
  title,
  subtitle,
  initialDuration = 1500, // 25 minutes default
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('25');
  const [error, setError] = useState<string | null>(null);
  const minutesInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isVisible) {
      const totalMinutes = Math.floor(initialDuration / 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      
      setHours(h.toString());
      setMinutes(m.toString());
      setError(null);
    }
  }, [isVisible, initialDuration]);

  const getTotalDuration = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    return (h * 60 + m) * 60; // return in seconds
  };

  const handleConfirm = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    if (h < 0 || h > 12) {
      setError('Hours must be between 0 and 12');
      return;
    }

    if (m < 0 || m > 59) {
      setError('Minutes must be between 0 and 59');
      return;
    }

    const totalMinutes = h * 60 + m;

    if (totalMinutes < 1) {
      setError('Duration must be at least 1 minute');
      return;
    }

    if (totalMinutes > 720) { // 12 hours
      setError('Duration cannot exceed 12 hours');
      return;
    }

    onConfirm(getTotalDuration());
  };

  const handleCancel = () => {
    setError(null);
    onCancel();
  };

  const handleHoursChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setHours(numericText);
    if (error) setError(null);

    // Auto-focus minutes when hours reaches 2 digits
    if (numericText.length === 2) {
      minutesInputRef.current?.focus();
    }
  };

  const handleMinutesChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setMinutes(numericText);
    if (error) setError(null);
  };

  const QuickTimeButton: React.FC<{ totalMinutes: number; label: string; color: string }> = ({ 
    totalMinutes, 
    label, 
    color 
  }) => (
    <TouchableOpacity
      style={[styles.quickTimeButton, { 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border 
      }]}
      onPress={() => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        setHours(h.toString());
        setMinutes(m.toString());
      }}
    >
      <View style={[styles.quickTimeColor, { backgroundColor: color }]} />
      <Text style={[styles.quickTimeText, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity
            style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
            activeOpacity={1}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <MaterialIcons name="schedule" size={24} color={theme.colors.primary} />
              </View>
              
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                {title}
              </Text>
              
              {subtitle && (
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {subtitle}
                </Text>
              )}
            </View>

            {/* Time Input Section */}
            <View style={styles.timeInputSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Set Custom Duration
              </Text>

              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.onSurface,
                      }
                    ]}
                    value={hours}
                    onChangeText={handleHoursChange}
                    placeholder="0"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                    returnKeyType="next"
                    onSubmitEditing={() => minutesInputRef.current?.focus()}
                  />
                  <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>
                    hours
                  </Text>
                </View>

                <Text style={[styles.timeSeparator, { color: theme.colors.onSurfaceVariant }]}>
                  :
                </Text>

                <View style={styles.timeInputGroup}>
                  <TextInput
                    ref={minutesInputRef}
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        color: theme.colors.onSurface,
                      }
                    ]}
                    value={minutes}
                    onChangeText={handleMinutesChange}
                    placeholder="25"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                    returnKeyType="done"
                    onSubmitEditing={handleConfirm}
                  />
                  <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>
                    minutes
                  </Text>
                </View>
              </View>

              {/* Total Duration Display */}
              <View style={styles.totalDuration}>
                <MaterialIcons name="timer" size={20} color={theme.colors.primary} />
                <Text style={[styles.totalDurationText, { color: theme.colors.onSurface }]}>
                  Total: {formatDuration(getTotalDuration())}
                </Text>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error" size={16} color={theme.colors.error} />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Time Buttons */}
            <View style={styles.quickTimesSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Quick Select
              </Text>
              <View style={styles.quickTimesGrid}>
                <QuickTimeButton totalMinutes={5} label="5 min" color="#FF6B6B" />
                <QuickTimeButton totalMinutes={15} label="15 min" color="#4ECDC4" />
                <QuickTimeButton totalMinutes={25} label="25 min" color="#FECA57" />
                <QuickTimeButton totalMinutes={30} label="30 min" color="#FF9FF3" />
                <QuickTimeButton totalMinutes={45} label="45 min" color="#54A0FF" />
                <QuickTimeButton totalMinutes={60} label="1 hour" color="#5F27CD" />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="ghost"
                style={styles.button}
              />
              <Button
                title="Set Time"
                onPress={handleConfirm}
                variant="primary"
                style={styles.button}
                disabled={getTotalDuration() < 60} // Less than 1 minute
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  timeInputSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  timeInputGroup: {
    alignItems: 'center',
    gap: 6,
  },
  timeInput: {
    width: 60,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 16,
  },
  totalDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  totalDurationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  quickTimesSection: {
    marginBottom: 24,
  },
  quickTimesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  quickTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  quickTimeColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
}); 