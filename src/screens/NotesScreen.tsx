import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAppState } from '../hooks/useAppState';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { NotesModal } from '../components/common/NotesModal';
import { Note } from '../types';
import { formatRelativeTime } from '../utils';

type FilterType = 'all' | 'session' | 'group' | 'unorganized';
type SortType = 'recent' | 'oldest' | 'alphabetical';

export const NotesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { state, deleteNote, getNotesForGroup, getNotesForSession } = useAppState();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('recent');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Get all notes and organize them
  const allNotes = Object.values(state.notes);
  
  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = allNotes;

    // Apply filter
    if (selectedFilter === 'session') {
      filtered = allNotes.filter(note => note.sessionId);
    } else if (selectedFilter === 'group') {
      filtered = allNotes.filter(note => note.groupId && !note.sessionId);
    } else if (selectedFilter === 'unorganized') {
      filtered = allNotes.filter(note => !note.groupId && !note.sessionId);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allNotes, selectedFilter, searchQuery, selectedSort]);

  // Organize notes hierarchically
  const organizedNotes = useMemo(() => {
    const organized: {
      sessions: { [key: string]: { session: any; notes: Note[] } };
      groups: { [key: string]: { group: any; notes: Note[] } };
      unorganized: Note[];
    } = {
      sessions: {},
      groups: {},
      unorganized: []
    };

    filteredAndSortedNotes.forEach(note => {
      if (note.sessionId) {
        const session = state.sessions[note.sessionId];
        if (session) {
          if (!organized.sessions[note.sessionId]) {
            organized.sessions[note.sessionId] = { session, notes: [] };
          }
          organized.sessions[note.sessionId].notes.push(note);
        }
      } else if (note.groupId) {
        const group = state.groups[note.groupId];
        if (group) {
          if (!organized.groups[note.groupId]) {
            organized.groups[note.groupId] = { group, notes: [] };
          }
          organized.groups[note.groupId].notes.push(note);
        }
      } else {
        organized.unorganized.push(note);
      }
    });

    return organized;
  }, [filteredAndSortedNotes, state.sessions, state.groups]);

  const handleNoteSelect = useCallback((noteId: string) => {
    if (!isSelectionMode) return;
    
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, [isSelectionMode]);

  const handleBulkDelete = useCallback(() => {
    if (selectedNotes.size === 0) return;

    Alert.alert(
      'Delete Notes',
      `Are you sure you want to delete ${selectedNotes.size} note${selectedNotes.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const noteId of selectedNotes) {
              await deleteNote(noteId);
            }
            setSelectedNotes(new Set());
            setIsSelectionMode(false);
          },
        },
      ]
    );
  }, [selectedNotes, deleteNote]);

  const clearSelection = useCallback(() => {
    setSelectedNotes(new Set());
    setIsSelectionMode(false);
  }, []);

  const NoteCard: React.FC<{ note: Note; showContext?: boolean }> = ({ note, showContext = true }) => {
    const isSelected = selectedNotes.has(note.id);
    
    return (
      <TouchableOpacity
        onPress={() => handleNoteSelect(note.id)}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedNotes(new Set([note.id]));
          }
        }}
        style={[
          styles.noteCard,
          {
            backgroundColor: isSelected 
              ? theme.colors.primary + '15' 
              : theme.colors.surface,
            borderColor: isSelected 
              ? theme.colors.primary 
              : theme.colors.border,
          }
        ]}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteInfo}>
            <Text style={[styles.noteTitle, { color: theme.colors.onSurface }]}>
              {note.title}
            </Text>
            
            {showContext && (
              <View style={styles.noteContext}>
                {note.sessionId && (
                  <View style={[styles.contextTag, { backgroundColor: theme.colors.primary + '20' }]}>
                    <MaterialIcons name="fitness-center" size={12} color={theme.colors.primary} />
                    <Text style={[styles.contextText, { color: theme.colors.primary }]}>
                      {state.sessions[note.sessionId]?.title || 'Session'}
                    </Text>
                  </View>
                )}
                
                {note.groupId && !note.sessionId && (
                  <View style={[styles.contextTag, { backgroundColor: theme.colors.secondary + '20' }]}>
                    <MaterialIcons name="folder" size={12} color={theme.colors.secondary} />
                    <Text style={[styles.contextText, { color: theme.colors.secondary }]}>
                      {state.groups[note.groupId]?.name || 'Group'}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            <Text style={[styles.noteDate, { color: theme.colors.onSurfaceVariant }]}>
              {formatRelativeTime(new Date(note.createdAt))}
            </Text>
          </View>
          
          {isSelectionMode && (
            <View style={[
              styles.selectionIndicator,
              {
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant,
                borderColor: theme.colors.border,
              }
            ]}>
              {isSelected && (
                <MaterialIcons name="check" size={16} color="#FFFFFF" />
              )}
            </View>
          )}
        </View>
        
        <Text 
          style={[styles.noteContent, { color: theme.colors.onSurfaceVariant }]}
          numberOfLines={2}
        >
          {note.content}
        </Text>
        
        {note.tags.length > 0 && (
          <View style={styles.noteTags}>
            {note.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                style={[styles.noteTag, { backgroundColor: theme.colors.accent + '20' }]}
              >
                <Text style={[styles.noteTagText, { color: theme.colors.accent }]}>
                  #{tag}
                </Text>
              </View>
            ))}
            {note.tags.length > 3 && (
              <Text style={[styles.moreTagsText, { color: theme.colors.onSurfaceVariant }]}>
                +{note.tags.length - 3}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const FilterButton: React.FC<{ filter: FilterType; label: string; count: number }> = ({ 
    filter, label, count 
  }) => (
    <TouchableOpacity
      onPress={() => setSelectedFilter(filter)}
      style={[
        styles.filterButton,
        {
          backgroundColor: selectedFilter === filter 
            ? theme.colors.primary 
            : theme.colors.surface,
          borderColor: selectedFilter === filter 
            ? theme.colors.primary 
            : theme.colors.border,
        }
      ]}
    >
      <Text style={[
        styles.filterButtonText,
        {
          color: selectedFilter === filter 
            ? '#FFFFFF' 
            : theme.colors.onSurface
        }
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Notes
          </Text>
          
          {isSelectionMode ? (
            <View style={styles.selectionActions}>
              <Text style={[styles.selectionCount, { color: theme.colors.onSurfaceVariant }]}>
                {selectedNotes.size} selected
              </Text>
              <TouchableOpacity onPress={handleBulkDelete} style={styles.bulkActionButton}>
                <MaterialIcons name="delete" size={20} color={theme.colors.error} />
              </TouchableOpacity>
              <TouchableOpacity onPress={clearSelection} style={styles.bulkActionButton}>
                <MaterialIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowNotesModal(true)}
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Search notes..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <FilterButton filter="all" label="All" count={allNotes.length} />
          <FilterButton 
            filter="session" 
            label="Sessions" 
            count={allNotes.filter(n => n.sessionId).length} 
          />
          <FilterButton 
            filter="group" 
            label="Groups" 
            count={allNotes.filter(n => n.groupId && !n.sessionId).length} 
          />
          <FilterButton 
            filter="unorganized" 
            label="General" 
            count={allNotes.filter(n => !n.groupId && !n.sessionId).length} 
          />
        </ScrollView>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: theme.colors.onSurfaceVariant }]}>Sort by:</Text>
          <TouchableOpacity
            onPress={() => {
              const options: SortType[] = ['recent', 'oldest', 'alphabetical'];
              const currentIndex = options.indexOf(selectedSort);
              const nextIndex = (currentIndex + 1) % options.length;
              setSelectedSort(options[nextIndex]);
            }}
            style={[styles.sortButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.sortButtonText, { color: theme.colors.primary }]}>
              {selectedSort === 'recent' ? 'Most Recent' : 
               selectedSort === 'oldest' ? 'Oldest First' : 'A-Z'}
            </Text>
            <MaterialIcons name="swap-vert" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredAndSortedNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="note-add" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {searchQuery 
                ? 'Try adjusting your search or filter'
                : 'Start by creating your first note'
              }
            </Text>
            {!searchQuery && (
              <Button
                title="Create Note"
                onPress={() => setShowNotesModal(true)}
                variant="primary"
                style={styles.emptyActionButton}
              />
            )}
          </View>
        ) : (
          <>
            {/* Session Notes */}
            {Object.keys(organizedNotes.sessions).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                  Session Notes ({Object.values(organizedNotes.sessions).reduce((acc, { notes }) => acc + notes.length, 0)})
                </Text>
                {Object.values(organizedNotes.sessions).map(({ session, notes }) => (
                  <View key={session.id} style={styles.hierarchyGroup}>
                    <View style={[styles.hierarchyHeader, { backgroundColor: theme.colors.primary + '10' }]}>
                      <MaterialIcons name="fitness-center" size={20} color={theme.colors.primary} />
                      <Text style={[styles.hierarchyTitle, { color: theme.colors.primary }]}>
                        {session.title}
                      </Text>
                      <Text style={[styles.hierarchyCount, { color: theme.colors.primary }]}>
                        {notes.length}
                      </Text>
                    </View>
                    {notes.map(note => (
                      <NoteCard key={note.id} note={note} showContext={false} />
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Group Notes */}
            {Object.keys(organizedNotes.groups).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                  Group Notes ({Object.values(organizedNotes.groups).reduce((acc, { notes }) => acc + notes.length, 0)})
                </Text>
                {Object.values(organizedNotes.groups).map(({ group, notes }) => (
                  <View key={group.id} style={styles.hierarchyGroup}>
                    <View style={[styles.hierarchyHeader, { backgroundColor: theme.colors.secondary + '10' }]}>
                      <MaterialIcons name="folder" size={20} color={theme.colors.secondary} />
                      <Text style={[styles.hierarchyTitle, { color: theme.colors.secondary }]}>
                        {group.name}
                      </Text>
                      <Text style={[styles.hierarchyCount, { color: theme.colors.secondary }]}>
                        {notes.length}
                      </Text>
                    </View>
                    {notes.map(note => (
                      <NoteCard key={note.id} note={note} showContext={false} />
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Unorganized Notes */}
            {organizedNotes.unorganized.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                  General Notes ({organizedNotes.unorganized.length})
                </Text>
                {organizedNotes.unorganized.map(note => (
                  <NoteCard key={note.id} note={note} showContext={false} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Notes Modal */}
      <NotesModal
        isVisible={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title="Create Note"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  bulkActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  hierarchyGroup: {
    marginBottom: 16,
  },
  hierarchyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  hierarchyTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  hierarchyCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteContext: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  contextTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  contextText: {
    fontSize: 10,
    fontWeight: '600',
  },
  noteDate: {
    fontSize: 12,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  noteTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noteTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActionButton: {
    minWidth: 140,
  },
}); 