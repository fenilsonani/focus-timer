import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAppState } from '../hooks/useAppState';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { TimePickerModal } from '../components/common/TimePickerModal';
import { ThemeSelectorModal } from '../components/common/ThemeSelectorModal';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { notificationService } from '../services/notificationService';
import { formatDuration } from '../utils';

export const SettingsScreen: React.FC = () => {
  const { theme, isDark, setMode } = useTheme();
  const { state, updateSettings, exportData, importData, clearAllData } = useAppState();
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [notificationPermissions, setNotificationPermissions] = useState({ granted: false, canAskAgain: true });
  
  const settings = state.settings;

  const handleUpdateSetting = useCallback(async (key: keyof typeof settings, value: any) => {
    await updateSettings({ [key]: value });
  }, [updateSettings]);

  const handleDefaultTimeChange = useCallback((minutes: number) => {
    handleUpdateSetting('defaultFocusDuration', minutes * 60);
  }, [handleUpdateSetting]);

  const handleExportData = useCallback(async () => {
    try {
      const data = await exportData();
      Alert.alert(
        'Export Successful',
        'Your data has been exported. You can share or save this data.',
        [{ text: 'OK' }]
      );
      // In a real app, you'd use a library to save/share the file
      console.log('Exported data:', data.substring(0, 100) + '...');
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    }
  }, [exportData]);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your habits, sessions, and notes? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: clearAllData
        }
      ]
    );
  }, [clearAllData]);

  const handleRequestNotificationPermissions = useCallback(async () => {
    const permissions = await notificationService.requestPermissions();
    setNotificationPermissions(permissions);
  }, []);

  // Check notification permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const permissions = await notificationService.getPermissions();
      setNotificationPermissions(permissions);
    };
    checkPermissions();
  }, []);

  const SettingRow: React.FC<{
    title: string;
    subtitle?: string;
    icon: string;
    onPress?: () => void;
    value?: string;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
  }> = ({ title, subtitle, icon, onPress, value, switchValue, onSwitchChange }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <MaterialIcons name={icon as any} size={24} color={theme.colors.primary} />
      
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      <View style={styles.settingAction}>
        {switchValue !== undefined && onSwitchChange && (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{
              false: theme.colors.surfaceVariant,
              true: theme.colors.primary + '40'
            }}
            thumbColor={switchValue ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        )}
        {value && (
          <Text style={[styles.settingValue, { color: theme.colors.onSurfaceVariant }]}>
            {value}
          </Text>
        )}
        {onPress && (
          <MaterialIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
        )}
      </View>
    </TouchableOpacity>
  );

  const TimeSettingButton: React.FC<{ minutes: number; label: string }> = ({ minutes, label }) => (
    <TouchableOpacity
      style={[
        styles.timeButton,
        {
          backgroundColor: settings.defaultFocusDuration === minutes * 60
            ? theme.colors.primary
            : theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}
      onPress={() => handleDefaultTimeChange(minutes)}
    >
      <Text style={[
        styles.timeButtonText,
        {
          color: settings.defaultFocusDuration === minutes * 60
            ? '#FFFFFF'
            : theme.colors.onSurface
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.background}
      />

      <ScreenHeader
        title="Settings"
        subtitle="Customize your habit tracking experience"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timer Settings */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Timer Settings
          </Text>

          <SettingRow
            title="Default Session Duration"
            subtitle={formatDuration(settings.defaultFocusDuration)}
            icon="timer"
            onPress={() => setShowTimeSettings(!showTimeSettings)}
          />

          {showTimeSettings && (
            <View style={styles.timeSettings}>
              <Text style={[styles.timeSettingsTitle, { color: theme.colors.onSurfaceVariant }]}>
                Choose Default Duration
              </Text>
              <View style={styles.timeGrid}>
                <TimeSettingButton minutes={5} label="5 min" />
                <TimeSettingButton minutes={10} label="10 min" />
                <TimeSettingButton minutes={15} label="15 min" />
                <TimeSettingButton minutes={20} label="20 min" />
                <TimeSettingButton minutes={25} label="25 min" />
                <TimeSettingButton minutes={30} label="30 min" />
                <TimeSettingButton minutes={45} label="45 min" />
                <TimeSettingButton minutes={60} label="1 hour" />
                <TimeSettingButton minutes={90} label="1.5 hours" />
                
                <TouchableOpacity
                  style={[
                    styles.customTimeButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.primary,
                    }
                  ]}
                  onPress={() => setShowCustomTimePicker(true)}
                >
                  <MaterialIcons name="edit" size={16} color={theme.colors.primary} />
                  <Text style={[
                    styles.customTimeButtonText,
                    { color: theme.colors.primary }
                  ]}>
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <SettingRow
            title="Break Duration"
            subtitle={formatDuration(settings.breakDuration)}
            icon="coffee"
            value={formatDuration(settings.breakDuration)}
          />

          <SettingRow
            title="Keep Screen Awake"
            subtitle="Prevent screen from sleeping during sessions"
            icon="brightness-6"
            switchValue={settings.keepScreenAwake}
            onSwitchChange={(value) => handleUpdateSetting('keepScreenAwake', value)}
          />

          <SettingRow
            title="Auto-start Breaks"
            subtitle="Automatically start break timer after sessions"
            icon="play-circle-filled"
            switchValue={settings.autoStartBreaks}
            onSwitchChange={(value) => handleUpdateSetting('autoStartBreaks', value)}
          />
        </Card>

        {/* Feedback Settings */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Feedback & Notifications
          </Text>

          <SettingRow
            title="Haptic Feedback"
            subtitle="Vibration feedback for timer actions"
            icon="vibration"
            switchValue={settings.hapticFeedback}
            onSwitchChange={(value) => handleUpdateSetting('hapticFeedback', value)}
          />

          <SettingRow
            title="Sound Notifications"
            subtitle="Audio alerts for session completion"
            icon="volume-up"
            switchValue={settings.soundEnabled}
            onSwitchChange={(value) => handleUpdateSetting('soundEnabled', value)}
          />

          <SettingRow
            title="Push Notifications"
            subtitle={notificationPermissions.granted 
              ? "Live timer updates and session alerts" 
              : "Allow notifications for better experience"
            }
            icon="notifications"
            switchValue={notificationPermissions.granted}
            onSwitchChange={notificationPermissions.granted ? undefined : handleRequestNotificationPermissions}
            onPress={!notificationPermissions.granted && notificationPermissions.canAskAgain 
              ? handleRequestNotificationPermissions 
              : undefined
            }
          />
        </Card>

        {/* Appearance */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Appearance
          </Text>

          <SettingRow
            title="Theme & Colors"
            subtitle={`${settings.theme === 'auto' ? 'Auto' : settings.theme === 'light' ? 'Light' : 'Dark'} • ${(settings.colorTheme || 'default').charAt(0).toUpperCase() + (settings.colorTheme || 'default').slice(1)} • ${(settings.borderRadiusStyle || 'rounded').charAt(0).toUpperCase() + (settings.borderRadiusStyle || 'rounded').slice(1)} corners`}
            icon="palette"
            onPress={() => setShowThemeSelector(true)}
          />
        </Card>

        {/* Data Management */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Data Management
          </Text>

          <SettingRow
            title="Export Data"
            subtitle="Backup your habits and sessions"
            icon="download"
            onPress={handleExportData}
          />

          <SettingRow
            title="Import Data"
            subtitle="Restore from backup"
            icon="upload"
            onPress={() => {
              Alert.alert('Import Data', 'Import functionality would be implemented here');
            }}
          />

          <SettingRow
            title="Clear All Data"
            subtitle="Delete all habits, sessions, and notes"
            icon="delete-forever"
            onPress={handleClearData}
          />
        </Card>

        {/* App Info */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            About
          </Text>

          <SettingRow
            title="App Version"
            subtitle="Focus Timer Pro"
            icon="info"
            value="1.0.0"
          />

          <SettingRow
            title="Privacy Policy"
            subtitle="Learn how we protect your data"
            icon="privacy-tip"
            onPress={() => {
              Alert.alert('Privacy Policy', 'Privacy policy would be shown here');
            }}
          />

          <SettingRow
            title="Support"
            subtitle="Get help or send feedback"
            icon="help"
            onPress={() => {
              Alert.alert('Support', 'Support contact information would be shown here');
            }}
          />

          {/* Development notification test */}
          {__DEV__ && (
            <SettingRow
              title="Test Notification"
              subtitle="Send a test notification (Dev only)"
              icon="notification-important"
              onPress={() => {
                notificationService.sendHabitReminderNotification('Test Habit');
              }}
            />
          )}
        </Card>

        {/* Statistics Summary */}
        <Card variant="filled" style={styles.statsCard}>
          <Text style={[styles.statsTitle, { color: theme.colors.onSurface }]}>
            Quick Stats
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {Object.keys(state.sessions).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Sessions
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
                {Object.keys(state.groups).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Habit Categories
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {[...new Set(Object.values(state.sessions).map(s => s.title))].length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Unique Habits
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Custom Time Picker Modal */}
      <TimePickerModal
        isVisible={showCustomTimePicker}
        title="Set Default Duration"
        subtitle="Choose your preferred default session length"
        initialDuration={settings.defaultFocusDuration}
        onConfirm={(duration) => {
          handleUpdateSetting('defaultFocusDuration', duration);
          setShowCustomTimePicker(false);
        }}
        onCancel={() => setShowCustomTimePicker(false)}
      />

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
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
  section: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeSettings: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeSettingsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 70,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
  customTimeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  customTimeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 