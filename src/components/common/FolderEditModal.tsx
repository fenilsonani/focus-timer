import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Group } from '../../types';
import { Button } from './Button';
import { getRandomColor } from '../../utils';

interface FolderEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  folder?: Group | null;
  onSave: (name: string, color: string) => void;
  validation?: (value: string) => string | null;
}

const FOLDER_COLORS = [
  '#6366F1', // Indigo
  '#EC4899', // Pink  
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#3B82F6', // Blue
];

export const FolderEditModal: React.FC<FolderEditModalProps> = ({
  isVisible,
  onClose,
  folder,
  onSave,
  validation,
}) => {
  const { theme } = useTheme();
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!folder;

  useEffect(() => {
    if (isVisible) {
      if (folder) {
        setFolderName(folder.name);
        setSelectedColor(folder.color);
      } else {
        setFolderName('');
        setSelectedColor(getRandomColor());
      }
      setError(null);
    }
  }, [isVisible, folder]);

  const handleSave = useCallback(() => {
    const trimmedName = folderName.trim();
    
    if (!trimmedName) {
      setError('Folder name is required');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Folder name must be at least 2 characters');
      return;
    }

    if (validation) {
      const validationError = validation(trimmedName);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onSave(trimmedName, selectedColor);
    setError(null);
  }, [folderName, selectedColor, validation, onSave]);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleNameChange = useCallback((text: string) => {
    setFolderName(text);
    if (error) {
      setError(null);
    }
  }, [error]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              {isEditing ? 'Edit Folder' : 'Create Folder'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {isEditing ? 'Update folder details' : 'Organize your habits with folders'}
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Folder Preview */}
          <View style={styles.previewSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Preview
            </Text>
            <View style={[
              styles.folderPreview, 
              { 
                backgroundColor: theme.colors.surface, 
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }
            ]}>
              <View style={[
                styles.folderIcon, 
                { 
                  backgroundColor: selectedColor,
                  shadowColor: selectedColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 2,
                }
              ]}>
                <MaterialIcons name="folder" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.folderInfo}>
                <Text style={[styles.folderName, { color: theme.colors.onSurface }]}>
                  {folderName || 'Folder Name'}
                </Text>
                <Text style={[styles.folderStats, { color: theme.colors.onSurfaceVariant }]}>
                  0 subfolders • 0 habits
                </Text>
              </View>
            </View>
          </View>

          {/* Folder Name */}
          <View style={styles.inputSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Folder Name
            </Text>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: error ? theme.colors.error : theme.colors.border,
                  color: theme.colors.onSurface,
                }
              ]}
              value={folderName}
              onChangeText={handleNameChange}
              placeholder="Enter folder name..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              maxLength={50}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            
            <View style={styles.inputFooter}>
              {error ? (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error" size={16} color={theme.colors.error} />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.characterCount, { color: theme.colors.onSurfaceVariant }]}>
                  {folderName.length}/50
                </Text>
              )}
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.colorSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Folder Color
            </Text>
            <View style={styles.colorGrid}>
              {FOLDER_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && {
                      ...styles.selectedColor,
                      transform: [{ scale: 1.1 }],
                    }
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <View style={styles.checkContainer}>
                      <MaterialIcons name="check" size={18} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              onPress={handleClose}
              style={[
                styles.cancelButton,
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.primary,
                }
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSave}
              disabled={!folderName.trim() || !!error}
              style={[
                styles.saveButton,
                { 
                  backgroundColor: !folderName.trim() || !!error 
                    ? theme.colors.surfaceVariant 
                    : theme.colors.primary,
                }
              ]}
            >
              <Text style={[
                styles.saveButtonText, 
                { 
                  color: !folderName.trim() || !!error 
                    ? theme.colors.onSurfaceVariant 
                    : '#FFFFFF' 
                }
              ]}>
                {isEditing ? 'Update Folder' : 'Create Folder'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  folderPreview: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  folderStats: {
    fontSize: 14,
  },
  inputSection: {
    marginBottom: 32,
  },
  nameInput: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  colorSection: {
    marginBottom: 40,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 2,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 