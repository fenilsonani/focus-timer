import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAppState } from '../hooks/useAppState';
import { Button } from '../components/common/Button';
import { NotesModal } from '../components/common/NotesModal';
import { ItemCard, Tag } from '../components/common/ItemCard';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Note } from '../types';
import { formatRelativeTime } from '../utils';

type FilterType = 'all' | 'session' | 'unorganized';
type SortType = 'recent' | 'oldest' | 'alphabetical';

export const NotesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { state, deleteNote, getNotesForSession } = useAppState();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('recent');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Get all notes
  const allNotes = Object.values(state.notes);
  
  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = allNotes;

    // Apply filter
    if (selectedFilter === 'session') {
      filtered = allNotes.filter(note => note.sessionId);
    } else if (selectedFilter === 'unorganized') {
      filtered = allNotes.filter(note => !note.sessionId);
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
      unorganized: Note[];
    } = {
      sessions: {},
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
      } else {
        organized.unorganized.push(note);
      }
    });

    return organized;
  }, [filteredAndSortedNotes, state.sessions]);

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

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setShowNotesModal(true);
  }, []);

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

  const handleCloseModal = useCallback(() => {
    setShowNotesModal(false);
    setEditingNote(null);
  }, []);

  const renderNoteItem = useCallback(({ item }: { item: Note }) => {
    const isSelected = selectedNotes.has(item.id);
    
    const tags: Tag[] = item.tags.map(tag => ({
      label: `#${tag}`,
      backgroundColor: theme.colors.accent + '20',
      color: theme.colors.accent,
    }));

    const sessionTag = item.sessionId ? {
      label: state.sessions[item.sessionId]?.title || 'Session',
      backgroundColor: theme.colors.primary + '20',
      color: theme.colors.primary,
    } : undefined;

    const allTags = sessionTag ? [sessionTag, ...tags] : tags;
    
    const noteActions = !isSelectionMode ? [
      {
        icon: 'edit',
        color: theme.colors.primary,
        onPress: () => handleEditNote(item)
      },
      {
        icon: 'delete',
        color: theme.colors.error,
        onPress: () => {
          Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteNote(item.id),
              },
            ]
          );
        }
      }
    ] : [];

    return (
      <ItemCard
        title={item.title}
        description={item.content}
        metadata={formatRelativeTime(new Date(item.createdAt))}
        tags={allTags.slice(0, 4)}
        actions={noteActions}
        onPress={() => isSelectionMode ? handleNoteSelect(item.id) : handleEditNote(item)}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedNotes(new Set([item.id]));
          }
        }}
        isSelected={isSelected}
      />
    );
  }, [theme.colors, handleEditNote, handleNoteSelect, isSelectionMode, selectedNotes, state.sessions, deleteNote]);

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

  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyState}>
      <MaterialIcons 
        name="note-add" 
        size={64} 
        color={theme.colors.onSurfaceVariant}
        style={styles.emptyIcon}
      />
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
  ), [searchQuery, theme.colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Notes"
        subtitle="Create and organize your notes"
        rightElement={
          isSelectionMode ? (
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
          )
        }
      />

      {/* Filters and Search */}
      <View style={[styles.filtersSection, { borderBottomColor: theme.colors.border }]}>

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
            filter="unorganized" 
            label="General" 
            count={allNotes.filter(n => !n.sessionId).length} 
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
      {
        selectedFilter === 'all' ? (
          <FlatList
            data={filteredAndSortedNotes}
            renderItem={renderNoteItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            ListEmptyComponent={renderEmptyComponent}
          />
        ) : (
          <View style={styles.content}>
            {filteredAndSortedNotes.length === 0 ? (
              renderEmptyComponent()
            ) : (
              <>
                {/* Session Notes */}
                {selectedFilter === 'session' && Object.keys(organizedNotes.sessions).length > 0 && (
                  Object.values(organizedNotes.sessions).map(({ session, notes }) => (
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
                        <View key={note.id}>
                          {renderNoteItem({ item: note })}
                        </View>
                      ))}
                    </View>
                  ))
                )}

                {/* Unorganized Notes */}
                {selectedFilter === 'unorganized' && organizedNotes.unorganized.length > 0 && (
                  <FlatList
                    data={organizedNotes.unorganized}
                    renderItem={renderNoteItem}
                    keyExtractor={(item) => item.id}
                  />
                )}
              </>
            )}
          </View>
        )
      }

      {/* Notes Modal */}
      <NotesModal
        isVisible={showNotesModal}
        onClose={handleCloseModal}
        title={editingNote ? "Edit Note" : "Create Note"}
        sessionId={editingNote?.sessionId}
        editingNote={editingNote}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
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