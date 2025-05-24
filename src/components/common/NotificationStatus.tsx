import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../../hooks/useTheme';
import { notificationService } from '../../services/notificationService';
import { Card } from './Card';

export interface NotificationStatusProps {
  showDetails?: boolean;
}

export const NotificationStatus: React.FC<NotificationStatusProps> = ({ showDetails = false }) => {
  const { theme } = useTheme();
  const [permissions, setPermissions] = useState<{
    granted: boolean;
    canAskAgain: boolean;
    isSupported: boolean;
  }>({
    granted: false,
    canAskAgain: false,
    isSupported: false,
  });

  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const perms = await notificationService.getPermissions();
    setPermissions(perms);
  };

  const requestPermissions = async () => {
    if (!permissions.isSupported) return;
    
    const newPerms = await notificationService.requestPermissions();
    setPermissions(newPerms);
  };

  const openDevelopmentBuildDocs = () => {
    Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/');
  };

  const getStatusIcon = () => {
    if (!permissions.isSupported) return 'warning';
    if (permissions.granted) return 'notifications-active';
    return 'notifications-off';
  };

  const getStatusColor = () => {
    if (!permissions.isSupported) return theme.colors.warning;
    if (permissions.granted) return theme.colors.success;
    return theme.colors.error;
  };

  const getStatusText = () => {
    if (isExpoGo) {
      return 'Limited in Expo Go';
    }
    if (!permissions.isSupported) {
      return 'Not supported';
    }
    if (permissions.granted) {
      return 'Enabled';
    }
    return 'Disabled';
  };

  if (!showDetails && permissions.granted && permissions.isSupported) {
    // Don't show anything if notifications are working properly
    return null;
  }

  return (
    <Card variant="outlined" style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons
          name={getStatusIcon()}
          size={24}
          color={getStatusColor()}
        />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Notifications
          </Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

             {isExpoGo && (
         <View style={styles.section}>
           <View style={[styles.notice, { backgroundColor: theme.colors.warning + '20' }]}>
             <MaterialIcons
               name="info"
               size={16}
               color={theme.colors.warning}
               style={styles.noticeIcon}
             />
             <Text style={[styles.noticeText, { color: theme.colors.onSurface }]}>
               Running in Expo Go - notifications will show as alerts
             </Text>
           </View>
          
          {showDetails && (
            <View style={styles.details}>
              <Text style={[styles.detailsTitle, { color: theme.colors.onSurface }]}>
                For full notification support:
              </Text>
              <TouchableOpacity
                style={[styles.linkButton, { borderColor: theme.colors.primary }]}
                onPress={openDevelopmentBuildDocs}
              >
                <MaterialIcons
                  name="open-in-new"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                  Create a Development Build
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {!isExpoGo && !permissions.granted && permissions.canAskAgain && (
                 <TouchableOpacity
           style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
           onPress={requestPermissions}
         >
           <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
             Enable Notifications
           </Text>
         </TouchableOpacity>
      )}

      {!permissions.canAskAgain && !permissions.granted && !isExpoGo && (
        <View style={styles.section}>
          <Text style={[styles.helpText, { color: theme.colors.onSurfaceVariant }]}>
            Notifications were denied. Please enable them in your device settings to receive timer alerts.
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: 12,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  noticeIcon: {
    marginRight: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  details: {
    gap: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
}); 