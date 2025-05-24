import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAppState } from '../../hooks/useAppState';
import { Note } from '../../types';
import { formatRelativeTime } from '../../utils';
import { Button } from './Button';
import { ModalHeader } from './ModalHeader';
import { ItemCard, Tag } from './ItemCard';

interface NotesModalProps {
  isVisible: boolean;
  onClose: () => void;
  sessionId?: string;
  title?: string;
  editingNote?: Note | null;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isVisible,
  onClose,
  sessionId,
  title = 'Notes',
  editingNote,
}) => {
  const { theme } = useTheme();
  const { 
    state, 
    createNote, 
    updateNote, 
    deleteNote, 
    getNotesForSession, 
  } = useAppState();

  const [isCreating, setIsCreating] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Get relevant notes
  const notes = sessionId 
    ? getNotesForSession(sessionId)
    : Object.values(state.notes);

  // Sort notes by creation date (newest first)
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const resetForm = useCallback(() => {
    setNoteTitle('');
    setNoteContent('');
    setNoteTags([]);
    setTagInput('');
    setIsCreating(false);
  }, []);

  const handleCreateNote = useCallback(() => {
    setIsCreating(true);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags([]);
    setTagInput('');
  }, []);

  const handleEditNote = useCallback((note: Note) => {
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTags([...note.tags]);
    setTagInput('');
    setIsCreating(true);
  }, []);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (!noteTags.includes(newTag)) {
        setNoteTags(prev => [...prev, newTag]);
      }
      setTagInput('');
    }
  }, [tagInput, noteTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setNoteTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handleSaveNote = useCallback(async () => {
    if (!noteTitle.trim()) {
      Alert.alert('Error', 'Please enter a note title');
      return;
    }

    if (!noteContent.trim()) {
      Alert.alert('Error', 'Please enter note content');
      return;
    }

    try {
      if (editingNote) {
        await updateNote(editingNote.id, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
          tags: noteTags,
        });
      } else {
        await createNote(
          noteTitle.trim(),
          noteContent.trim(),
          sessionId,
          noteTags
        );
      }
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    }
  }, [noteTitle, noteContent, noteTags, editingNote, updateNote, createNote, sessionId, resetForm]);

  const handleDeleteNote = useCallback((note: Note) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNote(note.id),
        },
      ]
    );
  }, [deleteNote]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Set form data when editingNote changes
  useEffect(() => {
    if (editingNote) {
      handleEditNote(editingNote);
    }
  }, [editingNote, handleEditNote]);

  // Clear form when modal closes
  useEffect(() => {
    if (!isVisible) {
      resetForm();
    } else if (editingNote) {
      setIsCreating(true);
    }
  }, [isVisible, resetForm, editingNote]);

  const renderNoteItem = useCallback(({ item }: { item: Note }) => {
    const tags: Tag[] = item.tags.map(tag => ({
      label: `#${tag}`,
      backgroundColor: theme.colors.primary + '20',
      color: theme.colors.primary,
    }));

    return (
      <ItemCard
        title={item.title}
        description={item.content}
        metadata={formatRelativeTime(new Date(item.createdAt))}
        tags={tags}
        actions={[
          {
            icon: 'edit',
            color: theme.colors.primary,
            onPress: () => handleEditNote(item)
          },
          {
            icon: 'delete',
            color: theme.colors.error,
            onPress: () => handleDeleteNote(item)
          }
        ]}
      />
    );
  }, [theme.colors, handleEditNote, handleDeleteNote]);

  const renderTag = useCallback(({ item }: { item: string }) => (
    <View style={[styles.tag, { backgroundColor: theme.colors.primary + '20' }]}>
      <Text style={[styles.tagText, { color: theme.colors.primary }]}>
        #{item}
      </Text>
      <MaterialIcons 
        name="close" 
        size={16} 
        color={theme.colors.primary}
        onPress={() => handleRemoveTag(item)}
        style={styles.tagRemoveIcon}
      />
    </View>
  ), [theme.colors.primary, handleRemoveTag]);

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModalHeader
          title={title}
          subtitle={editingNote ? 'Edit Note' : `${sortedNotes.length} note${sortedNotes.length !== 1 ? 's' : ''}`}
          onClose={handleClose}
          onAction={handleCreateNote}
          actionIcon="add"
        />

        {/* Create/Edit Note Form */}
        {isCreating && (
          <View style={[styles.noteForm, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.formTitle, { color: theme.colors.onSurface }]}>
              {editingNote ? 'Edit Note' : 'Create Note'}
            </Text>
            
            <TextInput
              style={[
                styles.titleInput,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.onSurface,
                }
              ]}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Note title..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              maxLength={100}
            />
            
            <TextInput
              style={[
                styles.contentInput,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.onSurface,
                }
              ]}
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="Write your note here..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            
            {/* Tags Input */}
            <View style={styles.tagsSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Tags
              </Text>
              
              <View style={styles.tagsContainer}>
                <FlatList
                  data={noteTags}
                  renderItem={renderTag}
                  keyExtractor={(item) => item}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tagsList}
                />
              </View>
              
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[
                    styles.tagInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.onSurface,
                    }
                  ]}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add a tag..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  onSubmitEditing={handleAddTag}
                  blurOnSubmit={false}
                />
                <Button
                  title="Add"
                  onPress={handleAddTag}
                  variant="outline"
                  size="small"
                  style={styles.tagButton}
                  disabled={!tagInput.trim()}
                />
              </View>
            </View>
            
            <View style={styles.formActions}>
              <Button
                title="Cancel"
                onPress={resetForm}
                variant="outline"
                size="small"
                style={styles.formButton}
              />
              <Button
                title={editingNote ? 'Update' : 'Save'}
                onPress={handleSaveNote}
                variant="primary"
                size="small"
                style={styles.formButton}
              />
            </View>
          </View>
        )}

        {/* Notes List */}
        {!isCreating && (
          <FlatList
            data={sortedNotes}
            renderItem={renderNoteItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons 
                  name="note-add" 
                  size={64} 
                  color={theme.colors.onSurfaceVariant}
                  style={styles.emptyIcon}
                />
                <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                  No notes yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  Tap the + button to create your first note
                </Text>
                <Button
                  title="Create Note"
                  onPress={handleCreateNote}
                  variant="primary"
                  style={styles.emptyButton}
                />
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noteForm: {
    padding: 16,
    borderBottomWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    height: 120,
    marginBottom: 16,
  },
  tagsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  tagsContainer: {
    marginBottom: 8,
  },
  tagsList: {
    paddingVertical: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  tagButton: {
    minWidth: 70,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  tagRemoveIcon: {
    marginLeft: 2,
  },
  emptyState: {
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
  emptyButton: {
    minWidth: 160,
  },
}); 