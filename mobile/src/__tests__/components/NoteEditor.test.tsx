import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NoteEditor } from '@/components/NoteEditor';
import { SESSION_NOTE_MAX_LENGTH } from '@dmdl/shared';

// Mock SessionContext
const mockUpdateNotes = jest.fn();
jest.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({
    updateNotes: mockUpdateNotes,
  }),
}));

describe('NoteEditor', () => {
  beforeEach(() => {
    mockUpdateNotes.mockClear();
    mockUpdateNotes.mockResolvedValue(undefined);
  });

  describe('without initial notes', () => {
    it('should show "Add a note" button', () => {
      render(<NoteEditor sessionId="session-1" />);

      expect(screen.getByText('Add a note')).toBeTruthy();
    });

    it('should show editor when "Add a note" is pressed', () => {
      render(<NoteEditor sessionId="session-1" />);

      fireEvent.press(screen.getByText('Add a note'));

      expect(screen.getByPlaceholderText('Add a note about this session...')).toBeTruthy();
    });
  });

  describe('with initial notes', () => {
    it('should display existing notes', () => {
      render(
        <NoteEditor sessionId="session-1" initialNotes="Worked on reading skills" />
      );

      expect(screen.getByText('Worked on reading skills')).toBeTruthy();
    });

    it('should show "Note" label for existing notes', () => {
      render(
        <NoteEditor sessionId="session-1" initialNotes="Existing note" />
      );

      expect(screen.getByText('Note')).toBeTruthy();
    });

    it('should enter edit mode when note is pressed', () => {
      render(
        <NoteEditor sessionId="session-1" initialNotes="Existing note" />
      );

      fireEvent.press(screen.getByText('Existing note'));

      expect(screen.getByPlaceholderText('Add a note about this session...')).toBeTruthy();
    });
  });

  describe('editor mode', () => {
    it('should show character count', () => {
      render(<NoteEditor sessionId="session-1" />);
      fireEvent.press(screen.getByText('Add a note'));

      expect(screen.getByText(`0/${SESSION_NOTE_MAX_LENGTH}`)).toBeTruthy();
    });

    it('should update character count when typing', () => {
      render(<NoteEditor sessionId="session-1" />);
      fireEvent.press(screen.getByText('Add a note'));

      const input = screen.getByPlaceholderText('Add a note about this session...');
      fireEvent.changeText(input, 'Hello');

      expect(screen.getByText(`5/${SESSION_NOTE_MAX_LENGTH}`)).toBeTruthy();
    });

    it('should show Cancel and Save buttons', () => {
      render(<NoteEditor sessionId="session-1" />);
      fireEvent.press(screen.getByText('Add a note'));

      expect(screen.getByText('Cancel')).toBeTruthy();
      expect(screen.getByText('Save')).toBeTruthy();
    });

    it('should cancel editing when Cancel is pressed', () => {
      render(<NoteEditor sessionId="session-1" />);
      fireEvent.press(screen.getByText('Add a note'));
      fireEvent.press(screen.getByText('Cancel'));

      // Should go back to "Add a note" state
      expect(screen.getByText('Add a note')).toBeTruthy();
    });

    it('should reset to initial notes when Cancel is pressed', () => {
      render(
        <NoteEditor sessionId="session-1" initialNotes="Original note" />
      );

      // Enter edit mode and change text
      fireEvent.press(screen.getByText('Original note'));
      const input = screen.getByPlaceholderText('Add a note about this session...');
      fireEvent.changeText(input, 'Changed note');

      // Cancel
      fireEvent.press(screen.getByText('Cancel'));

      // Should show original note
      expect(screen.getByText('Original note')).toBeTruthy();
    });

    it('should call updateNotes when Save is pressed', async () => {
      render(<NoteEditor sessionId="session-1" />);
      fireEvent.press(screen.getByText('Add a note'));

      const input = screen.getByPlaceholderText('Add a note about this session...');
      fireEvent.changeText(input, 'New note content');
      fireEvent.press(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUpdateNotes).toHaveBeenCalledWith('session-1', 'New note content');
      });
    });

    it('should not save when no changes made', () => {
      render(
        <NoteEditor sessionId="session-1" initialNotes="Existing note" />
      );

      fireEvent.press(screen.getByText('Existing note'));
      fireEvent.press(screen.getByText('Save'));

      expect(mockUpdateNotes).not.toHaveBeenCalled();
    });
  });

  describe('character limit', () => {
    it('should show error styling when over limit', () => {
      render(<NoteEditor sessionId="session-1" />);
      fireEvent.press(screen.getByText('Add a note'));

      const input = screen.getByPlaceholderText('Add a note about this session...');
      const longText = 'A'.repeat(SESSION_NOTE_MAX_LENGTH + 10);
      fireEvent.changeText(input, longText);

      // Character count should show over limit
      expect(
        screen.getByText(`${SESSION_NOTE_MAX_LENGTH + 10}/${SESSION_NOTE_MAX_LENGTH}`)
      ).toBeTruthy();
    });

    it('should not save when over character limit', () => {
      render(<NoteEditor sessionId="session-1" />);
      fireEvent.press(screen.getByText('Add a note'));

      const input = screen.getByPlaceholderText('Add a note about this session...');
      const longText = 'A'.repeat(SESSION_NOTE_MAX_LENGTH + 10);
      fireEvent.changeText(input, longText);
      fireEvent.press(screen.getByText('Save'));

      expect(mockUpdateNotes).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should display error message when save fails', async () => {
      mockUpdateNotes.mockRejectedValue(new Error('Network error'));

      render(<NoteEditor sessionId="session-1" />);
      fireEvent.press(screen.getByText('Add a note'));

      const input = screen.getByPlaceholderText('Add a note about this session...');
      fireEvent.changeText(input, 'New note');
      fireEvent.press(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
      });
    });
  });
});
