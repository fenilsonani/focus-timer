import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onAction?: () => void;
  actionIcon?: string;
  actionColor?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  onClose,
  onAction,
  actionIcon = 'add',
  actionColor,
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity 
        onPress={onClose} 
        style={styles.closeButton}
        activeOpacity={0.7}
      >
        <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {onAction && (
        <TouchableOpacity 
          onPress={onAction} 
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name={actionIcon as any} 
            size={24} 
            color={actionColor || theme.colors.primary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  actionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
}); 