import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface BottomNavigationProps {
  activeTab: 'home' | 'analytics' | 'notes' | 'reminders' | 'settings';
  onTabPress: (tab: 'home' | 'analytics' | 'notes' | 'reminders' | 'settings') => void;
}

interface TabItem {
  key: 'home' | 'analytics' | 'notes' | 'reminders' | 'settings';
  label: string;
  icon: string;
}

const tabs: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'analytics', label: 'Analytics', icon: 'bar-chart' },
  { key: 'notes', label: 'Notes', icon: 'note' },
  { key: 'reminders', label: 'Reminders', icon: 'schedule' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
    }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.tabIconContainer,
              isActive && { backgroundColor: theme.colors.primary + '20' }
            ]}>
              <MaterialIcons
                name={tab.icon as any}
                size={24}
                color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            </View>
            <Text style={[
              styles.tabLabel,
              {
                color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant,
                fontWeight: isActive ? '600' : '500',
              }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 