import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { notificationService, NotificationPermissions } from '../../services/notificationService';

interface NotificationStatusProps {
  onPress?: () => void;
}

export const NotificationStatus: React.FC<NotificationStatusProps> = ({ onPress }) => {
  const { theme } = useTheme();
  const [permissions, setPermissions] = useState<NotificationPermissions>({ 
    granted: false, 
    canAskAgain: true 
  });

  useEffect(() => {
    const checkPermissions = async () => {
      const perms = await notificationService.getPermissions();
      setPermissions(perms);
    };

    checkPermissions();
    
    // Refresh permissions every 5 seconds when component is mounted
    const interval = setInterval(checkPermissions, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (permissions.granted) return 'notifications-active';
    if (permissions.canAskAgain) return 'notifications-none';
    return 'notifications-off';
  };

  const getStatusColor = () => {
    if (permissions.granted) return theme.colors.success;
    if (permissions.canAskAgain) return theme.colors.warning;
    return theme.colors.error;
  };

  const getStatusText = () => {
    if (permissions.granted) return 'Notifications Enabled';
    if (permissions.canAskAgain) return 'Enable Notifications';
    return 'Notifications Blocked';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { 
        backgroundColor: theme.colors.surface,
        borderColor: getStatusColor() + '40',
      }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <MaterialIcons 
        name={getStatusIcon() as any} 
        size={20} 
        color={getStatusColor()} 
      />
      <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
        {getStatusText()}
      </Text>
      {onPress && (
        <MaterialIcons 
          name="chevron-right" 
          size={16} 
          color={theme.colors.onSurfaceVariant} 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
}); 