import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from './Card';

interface Action {
  icon: string;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
}

export interface Tag {
  label: string;
  color?: string;
  backgroundColor?: string;
}

interface ItemCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: string;
  tags?: Tag[];
  actions?: Action[];
  toggleEnabled?: boolean;
  isEnabled?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  selected?: boolean;
  variant?: 'default' | 'compact';
  showArrow?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  title,
  subtitle,
  description,
  metadata,
  tags = [],
  actions = [],
  toggleEnabled = false,
  isEnabled = true,
  onToggle,
  onPress,
  onLongPress,
  isSelected = false,
  selected = false,
  variant = 'default',
  showArrow = false,
}) => {
  const { theme } = useTheme();
  
  const isSelectionMode = isSelected || selected;
  
  const cardStyle: ViewStyle = {
    marginBottom: 12,
    padding: 16,
    backgroundColor: isSelectionMode ? theme.colors.primary + '15' : theme.colors.surface,
    borderColor: isSelectionMode ? theme.colors.primary : theme.colors.border,
    opacity: toggleEnabled && !isEnabled ? 0.7 : 1,
  };
  
  return (
    <Card
      variant="outlined"
      style={cardStyle}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text 
              style={[
                styles.title, 
                variant === 'compact' ? styles.titleCompact : {},
                { color: theme.colors.onSurface }
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            
            {showArrow && (
              <MaterialIcons 
                name="chevron-right" 
                size={20} 
                color={theme.colors.onSurfaceVariant} 
              />
            )}
          </View>
          
          {subtitle && (
            <Text 
              style={[
                styles.subtitle, 
                variant === 'compact' ? styles.subtitleCompact : {},
                { color: theme.colors.primary }
              ]}
            >
              {subtitle}
            </Text>
          )}
          
          {metadata && (
            <Text style={[styles.metadata, { color: theme.colors.onSurfaceVariant }]}>
              {metadata}
            </Text>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          {isSelectionMode ? (
            <View style={[
              styles.selectionIndicator,
              {
                backgroundColor: isSelectionMode ? theme.colors.primary : theme.colors.surfaceVariant,
                borderColor: theme.colors.border,
              }
            ]}>
              {isSelectionMode && (
                <MaterialIcons name="check" size={16} color="#FFFFFF" />
              )}
            </View>
          ) : (
            <View style={styles.actions}>
              {toggleEnabled && onToggle && (
                <Switch
                  value={isEnabled}
                  onValueChange={onToggle}
                  trackColor={{ 
                    false: theme.colors.surfaceVariant, 
                    true: theme.colors.primary + '40' 
                  }}
                  thumbColor={isEnabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              )}
              
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={action.onPress}
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: action.backgroundColor || 
                        (action.color ? action.color + '15' : theme.colors.surfaceVariant)
                    }
                  ]}
                >
                  <MaterialIcons 
                    name={action.icon as any} 
                    size={16} 
                    color={action.color || theme.colors.onSurfaceVariant} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
      
      {description && (
        <Text 
          style={[
            styles.description, 
            { color: theme.colors.onSurfaceVariant }
          ]}
          numberOfLines={variant === 'compact' ? 2 : undefined}
        >
          {description}
        </Text>
      )}
      
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View
              key={index}
              style={[
                styles.tag,
                { 
                  backgroundColor: tag.backgroundColor || theme.colors.primary + '20',
                }
              ]}
            >
              <Text 
                style={[
                  styles.tagText,
                  { color: tag.color || theme.colors.primary }
                ]}
              >
                {tag.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    flex: 1,
  },
  titleCompact: {
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitleCompact: {
    fontSize: 16,
  },
  metadata: {
    fontSize: 14,
  },
  actionsContainer: {
    alignItems: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
}); 