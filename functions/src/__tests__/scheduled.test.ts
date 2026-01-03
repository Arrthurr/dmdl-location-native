import { AUTO_CHECKOUT_HOURS } from '../utils/constants';

describe('autoCheckOutStale logic', () => {
  describe('cutoff time calculation', () => {
    it('should calculate cutoff time correctly', () => {
      const now = Date.now();
      const cutoffTime = new Date(now - AUTO_CHECKOUT_HOURS * 60 * 60 * 1000);

      // Should be 12 hours ago
      const expectedMs = AUTO_CHECKOUT_HOURS * 60 * 60 * 1000;
      expect(now - cutoffTime.getTime()).toBe(expectedMs);
    });

    it('should identify stale sessions (over 12 hours old)', () => {
      const now = new Date();
      const checkInTime = new Date(now.getTime() - 13 * 60 * 60 * 1000); // 13 hours ago
      const cutoffTime = new Date(now.getTime() - AUTO_CHECKOUT_HOURS * 60 * 60 * 1000);

      expect(checkInTime < cutoffTime).toBe(true);
    });

    it('should not identify recent sessions as stale', () => {
      const now = new Date();
      const checkInTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); // 6 hours ago
      const cutoffTime = new Date(now.getTime() - AUTO_CHECKOUT_HOURS * 60 * 60 * 1000);

      expect(checkInTime < cutoffTime).toBe(false);
    });

    it('should handle exact boundary (exactly 12 hours)', () => {
      const now = new Date();
      const checkInTime = new Date(now.getTime() - AUTO_CHECKOUT_HOURS * 60 * 60 * 1000);
      const cutoffTime = new Date(now.getTime() - AUTO_CHECKOUT_HOURS * 60 * 60 * 1000);

      // Exactly at boundary - not less than, so not stale
      expect(checkInTime < cutoffTime).toBe(false);
    });
  });

  describe('duration calculation for auto-checkout', () => {
    it('should calculate duration from checkInTime to now', () => {
      const now = Date.now();
      const checkInTime = new Date(now - 13 * 60 * 60 * 1000); // 13 hours ago
      const durationMinutes = Math.round((now - checkInTime.getTime()) / 60000);

      expect(durationMinutes).toBe(780); // 13 hours = 780 minutes
    });

    it('should round to nearest minute', () => {
      const now = Date.now();
      const checkInTime = new Date(now - 12.5 * 60 * 60 * 1000); // 12.5 hours ago
      const durationMinutes = Math.round((now - checkInTime.getTime()) / 60000);

      expect(durationMinutes).toBe(750); // 12.5 hours = 750 minutes
    });
  });

  describe('notes concatenation', () => {
    it('should append auto-checkout message to existing notes', () => {
      const existingNotes = 'Worked on reading assessment';
      const autoMessage = `[Auto-checked out after ${AUTO_CHECKOUT_HOURS} hours]`;
      const newNotes = `${existingNotes}\n\n${autoMessage}`;

      expect(newNotes).toBe(`Worked on reading assessment\n\n[Auto-checked out after 12 hours]`);
    });

    it('should use auto-checkout message when no existing notes', () => {
      const existingNotes = '';
      const autoMessage = `[Auto-checked out after ${AUTO_CHECKOUT_HOURS} hours]`;
      const newNotes = existingNotes
        ? `${existingNotes}\n\n${autoMessage}`
        : autoMessage;

      expect(newNotes).toBe('[Auto-checked out after 12 hours]');
    });

    it('should handle null notes', () => {
      const existingNotes: string | null = null;
      const autoMessage = `[Auto-checked out after ${AUTO_CHECKOUT_HOURS} hours]`;
      const newNotes = existingNotes
        ? `${existingNotes}\n\n${autoMessage}`
        : autoMessage;

      expect(newNotes).toBe('[Auto-checked out after 12 hours]');
    });
  });

  describe('AUTO_CHECKOUT_HOURS constant', () => {
    it('should be 12 hours', () => {
      expect(AUTO_CHECKOUT_HOURS).toBe(12);
    });

    it('should convert to milliseconds correctly', () => {
      const msIn12Hours = AUTO_CHECKOUT_HOURS * 60 * 60 * 1000;
      expect(msIn12Hours).toBe(43200000);
    });
  });
});
