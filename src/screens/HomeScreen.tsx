import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAppState } from '../hooks/useAppState';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ScreenWrapper } from '../components/common/ScreenWrapper';
import { InputModal } from '../components/common/InputModal';
import { FolderEditModal } from '../components/common/FolderEditModal';
import { HabitCreationModal } from '../components/common/HabitCreationModal';
import { GroupCard } from '../components/groups/GroupCard';
import { SessionDetailModal } from '../components/timer/SessionDetailModal';
import { Group, FocusSession } from '../types';
import { formatDuration, formatRelativeTime, getRandomColor } from '../utils';

export const HomeScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { 
    state, 
    createGroup, 
    updateGroup, 
    deleteGroup, 
    createSession,
    getGroupChildren,
    getGroupSessions 
  } = useAppState();

  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Group | null>(null);

  // Get current folder or root
  const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : undefined;
  const currentFolder = currentFolderId ? state.groups[currentFolderId] : undefined;

  // Get items in current folder
  const childGroups = currentFolderId 
    ? getGroupChildren(currentFolderId)
    : Object.values(state.groups).filter(group => !group.parentId);

  const childSessions = currentFolderId
    ? getGroupSessions(currentFolderId)
    : Object.values(state.sessions).filter(session => !session.groupId);

  // Navigation functions
  const navigateToFolder = useCallback((folderId: string) => {
    setCurrentPath([...currentPath, folderId]);
  }, [currentPath]);

  const navigateToParent = useCallback(() => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  }, [currentPath]);

  const navigateToRoot = useCallback(() => {
    setCurrentPath([]);
  }, []);

  const navigateToBreadcrumb = useCallback((index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  }, [currentPath]);

  // CRUD Operations
  const handleCreateFolder = useCallback(() => {
    setShowFolderModal(true);
  }, []);

  const handleCreateTimer = useCallback(() => {
    setShowHabitModal(true);
  }, []);

  const handleEditFolder = useCallback((group: Group) => {
    setEditingFolder(group);
  }, []);

  const handleFolderCreate = useCallback(async (name: string, color: string) => {
    const group = await createGroup(name, currentFolderId);
    await updateGroup(group.id, { color });
    setShowFolderModal(false);
  }, [createGroup, updateGroup, currentFolderId]);

  const handleFolderEdit = useCallback(async (name: string, color: string) => {
    if (editingFolder) {
      await updateGroup(editingFolder.id, { name, color });
      setEditingFolder(null);
    }
  }, [updateGroup, editingFolder]);

  const handleHabitCreate = useCallback(async (name: string, duration: number) => {
    await createSession(name, duration, currentFolderId);
    setShowHabitModal(false);
  }, [createSession, currentFolderId]);

  const handleDeleteFolder = useCallback((group: Group) => {
    Alert.alert(
      'Delete Folder',
      `Are you sure you want to delete "${group.name}" and all its contents?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGroup(group.id)
        }
      ]
    );
  }, [deleteGroup]);

  // Generate breadcrumb path
  const getBreadcrumbPath = useCallback(() => {
    const path = [{ id: 'root', name: 'Home' }];
    for (let i = 0; i < currentPath.length; i++) {
      const folderId = currentPath[i];
      const folder = state.groups[folderId];
      if (folder) {
        path.push({ id: folder.id, name: folder.name });
      }
    }
    return path;
  }, [currentPath, state.groups]);

  const breadcrumbPath = getBreadcrumbPath();

  return (
    <ScreenWrapper>
      <ScreenHeader
        title={currentFolder ? currentFolder.name : "Home"}
        subtitle={currentFolder ? `${childGroups.length} folders • ${childSessions.length} timers` : "Organize your habits and sessions"}
        showBackButton={currentPath.length > 0}
        onBackPress={() => {
          if (currentPath.length > 0) {
            setCurrentPath(currentPath.slice(0, -1));
          }
        }}
        rightElement={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleCreateFolder}
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            >
              <MaterialIcons name="create-new-folder" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleCreateTimer}
              style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            >
              <MaterialIcons name="timer" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current folder info */}
        {currentFolder && (
          <Card variant="filled" style={styles.currentFolderCard}>
            <View style={styles.currentFolderHeader}>
              <View style={[styles.folderIcon, { backgroundColor: currentFolder.color }]}>
                <MaterialIcons name="folder" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.currentFolderInfo}>
                <Text style={[styles.currentFolderName, { color: theme.colors.onSurface }]}>
                  {currentFolder.name}
                </Text>
                <Text style={[styles.currentFolderStats, { color: theme.colors.onSurfaceVariant }]}>
                  {childGroups.length} folders • {childSessions.length} timers
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Folders */}
        {childGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Folders ({childGroups.length})
            </Text>
            {childGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => navigateToFolder(group.id)}
                onEdit={() => handleEditFolder(group)}
                onDelete={() => handleDeleteFolder(group)}
                level={0}
              />
            ))}
          </View>
        )}

        {/* Timer Sessions */}
        {childSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Timer Sessions ({childSessions.length})
            </Text>
            {childSessions.map((session) => {
              // Calculate habit stats for this session
              const allSessionsWithTitle = Object.values(state.sessions).filter(s => s.title === session.title);
              const completedCount = allSessionsWithTitle.filter(s => s.endTime).length;
              const totalTime = allSessionsWithTitle.reduce((sum, s) => {
                if (s.endTime && s.startTime) {
                  return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000;
                }
                return sum;
              }, 0);

              return (
                <Card
                  key={session.id}
                  variant="outlined"
                  style={styles.sessionCard}
                  onPress={() => {
                    setSelectedSession(session);
                  }}
                >
                  <View style={styles.sessionContent}>
                    <View style={styles.sessionHeader}>
                      <MaterialIcons name="fitness-center" size={20} color={theme.colors.primary} />
                      <Text style={[styles.sessionTitle, { color: theme.colors.onSurface }]}>
                        {session.title}
                      </Text>
                      <View style={[
                        styles.sessionStatusDot,
                        { backgroundColor: session.isActive ? theme.colors.success : theme.colors.surfaceVariant }
                      ]} />
                    </View>
                    
                    <View style={styles.sessionStats}>
                      <Text style={[styles.sessionDuration, { color: theme.colors.primary }]}>
                        {formatDuration(session.duration)} session
                      </Text>
                      <Text style={[styles.sessionHabitStats, { color: theme.colors.onSurfaceVariant }]}>
                        {completedCount} completed • {formatDuration(totalTime)} total
                      </Text>
                    </View>
                    
                    <Text style={[styles.sessionTime, { color: theme.colors.onSurfaceVariant }]}>
                      Last: {formatRelativeTime(new Date(session.createdAt))}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Habit Templates */}
        {childGroups.length === 0 && childSessions.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="folder-open" 
              size={64} 
              color={theme.colors.onSurfaceVariant} 
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
              {currentFolder ? 'Empty Folder' : 'Start Building Habits'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Create folders to organize habits or add sessions to start tracking
            </Text>
            
            <View style={styles.habitTemplates}>
              <Text style={[styles.templatesTitle, { color: theme.colors.onSurfaceVariant }]}>
                Popular Habits
              </Text>
              <View style={styles.templateGrid}>
                <TouchableOpacity
                  style={[styles.templateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleHabitCreate('Morning Exercise', 30 * 60)}
                >
                  <MaterialIcons name="fitness-center" size={24} color={theme.colors.primary} />
                  <Text style={[styles.templateTitle, { color: theme.colors.onSurface }]}>Exercise</Text>
                  <Text style={[styles.templateDuration, { color: theme.colors.onSurfaceVariant }]}>30 min</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.templateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleHabitCreate('Daily Meditation', 15 * 60)}
                >
                  <MaterialIcons name="self-improvement" size={24} color={theme.colors.secondary} />
                  <Text style={[styles.templateTitle, { color: theme.colors.onSurface }]}>Meditation</Text>
                  <Text style={[styles.templateDuration, { color: theme.colors.onSurfaceVariant }]}>15 min</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.templateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleHabitCreate('Reading Session', 25 * 60)}
                >
                  <MaterialIcons name="menu-book" size={24} color={theme.colors.success} />
                  <Text style={[styles.templateTitle, { color: theme.colors.onSurface }]}>Reading</Text>
                  <Text style={[styles.templateDuration, { color: theme.colors.onSurfaceVariant }]}>25 min</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.templateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleHabitCreate('Deep Work', 50 * 60)}
                >
                  <MaterialIcons name="psychology" size={24} color={theme.colors.warning} />
                  <Text style={[styles.templateTitle, { color: theme.colors.onSurface }]}>Deep Work</Text>
                  <Text style={[styles.templateDuration, { color: theme.colors.onSurfaceVariant }]}>50 min</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.emptyActions}>
              <Button
                title="Create Folder"
                onPress={handleCreateFolder}
                variant="outline"
                style={styles.emptyActionButton}
              />
              <Button
                title="Custom Habit"
                onPress={handleCreateTimer}
                variant="primary"
                style={styles.emptyActionButton}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          isVisible={!!selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}

      {/* Create/Edit Folder Modal */}
      <FolderEditModal
        isVisible={showFolderModal || !!editingFolder}
        onClose={() => {
          setShowFolderModal(false);
          setEditingFolder(null);
        }}
        folder={editingFolder}
        onSave={(name, color) => {
          if (editingFolder) {
            handleFolderEdit(name, color);
          } else {
            handleFolderCreate(name, color);
          }
        }}
        validation={(value) => {
          if (value.length < 2) return 'Folder name must be at least 2 characters';
          const existingNames = Object.values(state.groups)
            .filter(g => g.parentId === currentFolderId && g.id !== editingFolder?.id)
            .map(g => g.name.toLowerCase());
          if (existingNames.includes(value.toLowerCase())) {
            return 'A folder with this name already exists';
          }
          return null;
        }}
      />

      {/* Create Habit Modal */}
      <HabitCreationModal
        isVisible={showHabitModal}
        onClose={() => setShowHabitModal(false)}
        onCreateHabit={handleHabitCreate}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currentFolderCard: {
    marginBottom: 24,
  },
  currentFolderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentFolderInfo: {
    flex: 1,
  },
  currentFolderName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentFolderStats: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sessionCard: {
    marginBottom: 8,
  },
  sessionContent: {
    gap: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sessionStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionStats: {
    marginVertical: 4,
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionHabitStats: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionTime: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyActionButton: {
    minWidth: 120,
  },
  habitTemplates: {
    marginBottom: 32,
    width: '100%',
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  templateCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  templateDuration: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 