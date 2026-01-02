import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/contexts/SessionContext';
import { SESSION_NOTE_MAX_LENGTH } from '@dmdl/shared';

interface NoteEditorProps {
  sessionId: string;
  initialNotes?: string;
}

export function NoteEditor({ sessionId, initialNotes = '' }: NoteEditorProps) {
  const { updateNotes } = useSession();
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = notes !== initialNotes;
  const charCount = notes.length;
  const isOverLimit = charCount > SESSION_NOTE_MAX_LENGTH;

  const handleSave = useCallback(async () => {
    if (!hasChanges || isOverLimit) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateNotes(sessionId, notes);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, notes, hasChanges, isOverLimit, updateNotes]);

  const handleCancel = () => {
    setNotes(initialNotes);
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing && !notes) {
    return (
      <TouchableOpacity
        style={styles.addNoteButton}
        onPress={() => setIsEditing(true)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#1a56db" />
        <Text style={styles.addNoteText}>Add a note</Text>
      </TouchableOpacity>
    );
  }

  if (!isEditing) {
    return (
      <TouchableOpacity
        style={styles.noteDisplay}
        onPress={() => setIsEditing(true)}
      >
        <View style={styles.noteHeader}>
          <Ionicons name="document-text-outline" size={16} color="#6b7280" />
          <Text style={styles.noteLabel}>Note</Text>
          <Ionicons name="pencil-outline" size={14} color="#9ca3af" />
        </View>
        <Text style={styles.noteText}>{notes}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.editorContainer}>
      <View style={styles.editorHeader}>
        <Text style={styles.editorLabel}>Note</Text>
        <Text
          style={[styles.charCount, isOverLimit && styles.charCountError]}
        >
          {charCount}/{SESSION_NOTE_MAX_LENGTH}
        </Text>
      </View>

      <TextInput
        style={styles.textInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add a note about this session..."
        placeholderTextColor="#9ca3af"
        multiline
        maxLength={SESSION_NOTE_MAX_LENGTH + 100} // Allow some overflow to show warning
        autoFocus
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || isOverLimit) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isOverLimit || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderStyle: 'dashed',
  },
  addNoteText: {
    fontSize: 14,
    color: '#1a56db',
    marginLeft: 8,
    fontWeight: '500',
  },
  noteDisplay: {
    paddingVertical: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    flex: 1,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  editorContainer: {
    marginTop: 8,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  charCountError: {
    color: '#dc2626',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#1a56db',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});
