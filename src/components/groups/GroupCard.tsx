import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../common/Card';
import { Group } from '../../types';
import { hexToRgba } from '../../utils';
import * as Haptics from 'expo-haptics';

interface GroupCardProps {
  group: Group;
  onPress?: () => void;
  onLongPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  level?: number;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
  level = 0,
}) => {
  const { theme } = useTheme();

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };

  const indentStyle = {
    marginLeft: level * 16,
  };

  return (
    <Card
      onPress={onPress}
      onLongPress={handleLongPress}
      variant="outlined"
      style={[styles.container, indentStyle] as any}
    >
      <View style={styles.content}>
        {/* Group Color Indicator */}
        <View
          style={[
            styles.colorIndicator,
            {
              backgroundColor: group.color,
              shadowColor: group.color,
              ...theme.shadows.sm,
            }
          ]}
        />

        {/* Group Info */}
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: theme.colors.onSurface }]}>
              {group.name}
            </Text>
            
            {group.icon && (
              <MaterialIcons
                name={group.icon as any}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            )}
          </View>

          <View style={styles.stats}>
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {group.children.length} groups • {group.sessions.length} sessions
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={[styles.actionButton, { backgroundColor: hexToRgba(theme.colors.primary, 0.1) }]}
            >
              <MaterialIcons
                name="edit"
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={[styles.actionButton, { backgroundColor: hexToRgba(theme.colors.error, 0.1) }]}
            >
              <MaterialIcons
                name="delete"
                size={16}
                color={theme.colors.error}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 