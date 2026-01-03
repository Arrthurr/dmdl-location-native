// Test schedule validation logic used in useSchedule hook

import {
  getCurrentDayOfWeek,
  isWithinTimeRange,
  DAYS_OF_WEEK,
} from '@dmdl/shared';

describe('Schedule validation logic', () => {
  describe('findTodaySchedule', () => {
    interface MockSchedule {
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      effectiveFrom: Date;
      effectiveUntil?: Date;
    }

    const findTodaySchedule = (
      schedules: MockSchedule[],
      today: string,
      now: Date
    ): MockSchedule | null => {
      return (
        schedules.find((schedule) => {
          // Check if it's the right day
          if (schedule.dayOfWeek !== today) return false;

          // Check if schedule is currently effective
          if (schedule.effectiveFrom > now) return false;
          if (schedule.effectiveUntil && schedule.effectiveUntil < now)
            return false;

          return true;
        }) || null
      );
    };

    it('should find schedule for today', () => {
      const schedules: MockSchedule[] = [
        {
          id: '1',
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '17:00',
          effectiveFrom: new Date(2024, 0, 1),
        },
        {
          id: '2',
          dayOfWeek: 'tuesday',
          startTime: '09:00',
          endTime: '17:00',
          effectiveFrom: new Date(2024, 0, 1),
        },
      ];

      const result = findTodaySchedule(schedules, 'monday', new Date(2024, 5, 1));
      expect(result?.id).toBe('1');
    });

    it('should return null when no schedule for today', () => {
      const schedules: MockSchedule[] = [
        {
          id: '1',
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '17:00',
          effectiveFrom: new Date(2024, 0, 1),
        },
      ];

      const result = findTodaySchedule(schedules, 'friday', new Date(2024, 5, 1));
      expect(result).toBeNull();
    });

    it('should exclude schedules not yet effective', () => {
      const now = new Date(2024, 5, 1);
      const futureDate = new Date(2024, 6, 1); // One month in future

      const schedules: MockSchedule[] = [
        {
          id: '1',
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '17:00',
          effectiveFrom: futureDate,
        },
      ];

      const result = findTodaySchedule(schedules, 'monday', now);
      expect(result).toBeNull();
    });

    it('should exclude expired schedules', () => {
      const now = new Date(2024, 5, 1);
      const pastDate = new Date(2024, 4, 1); // One month in past

      const schedules: MockSchedule[] = [
        {
          id: '1',
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '17:00',
          effectiveFrom: new Date(2024, 0, 1),
          effectiveUntil: pastDate,
        },
      ];

      const result = findTodaySchedule(schedules, 'monday', now);
      expect(result).toBeNull();
    });
  });

  describe('isWithinSchedule', () => {
    it('should return true when within time range', () => {
      expect(isWithinTimeRange('09:00', '17:00', '12:00')).toBe(true);
    });

    it('should return false when before time range', () => {
      expect(isWithinTimeRange('09:00', '17:00', '08:00')).toBe(false);
    });

    it('should return false when after time range', () => {
      expect(isWithinTimeRange('09:00', '17:00', '18:00')).toBe(false);
    });

    it('should return true at exact start time', () => {
      expect(isWithinTimeRange('09:00', '17:00', '09:00')).toBe(true);
    });

    it('should return true at exact end time', () => {
      expect(isWithinTimeRange('09:00', '17:00', '17:00')).toBe(true);
    });
  });

  describe('day of week utilities', () => {
    it('should have 7 days', () => {
      expect(DAYS_OF_WEEK).toHaveLength(7);
    });

    it('should start with sunday (index 0)', () => {
      expect(DAYS_OF_WEEK[0]).toBe('sunday');
    });

    it('should end with saturday (index 6)', () => {
      expect(DAYS_OF_WEEK[6]).toBe('saturday');
    });

    it('getCurrentDayOfWeek should return valid day', () => {
      const today = getCurrentDayOfWeek();
      expect(DAYS_OF_WEEK).toContain(today);
    });
  });
});
