import {
  getCurrentDayOfWeek,
  getCurrentTime,
  isWithinTimeRange,
  formatDuration,
  formatTime12Hour,
  calculateDurationMinutes,
  formatDate,
  formatDateTime,
  getDayOfWeekName,
  timeToMinutes,
  minutesToTime,
} from '../utils/time';
import { DAYS_OF_WEEK } from '../constants';

describe('getCurrentDayOfWeek', () => {
  it('should return a valid day of week', () => {
    const day = getCurrentDayOfWeek();
    expect(DAYS_OF_WEEK).toContain(day);
  });

  it('should match the current date day', () => {
    const day = getCurrentDayOfWeek();
    const expectedDay = DAYS_OF_WEEK[new Date().getDay()];
    expect(day).toBe(expectedDay);
  });
});

describe('getCurrentTime', () => {
  it('should return time in HH:MM format', () => {
    const time = getCurrentTime();
    expect(time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should return valid hours (00-23)', () => {
    const time = getCurrentTime();
    const hours = parseInt(time.split(':')[0], 10);
    expect(hours).toBeGreaterThanOrEqual(0);
    expect(hours).toBeLessThanOrEqual(23);
  });

  it('should return valid minutes (00-59)', () => {
    const time = getCurrentTime();
    const minutes = parseInt(time.split(':')[1], 10);
    expect(minutes).toBeGreaterThanOrEqual(0);
    expect(minutes).toBeLessThanOrEqual(59);
  });
});

describe('isWithinTimeRange', () => {
  it('should return true when time is within range', () => {
    expect(isWithinTimeRange('09:00', '17:00', '12:00')).toBe(true);
    expect(isWithinTimeRange('09:00', '17:00', '09:30')).toBe(true);
    expect(isWithinTimeRange('09:00', '17:00', '16:59')).toBe(true);
  });

  it('should return true at exact start time (boundary)', () => {
    expect(isWithinTimeRange('09:00', '17:00', '09:00')).toBe(true);
  });

  it('should return true at exact end time (boundary)', () => {
    expect(isWithinTimeRange('09:00', '17:00', '17:00')).toBe(true);
  });

  it('should return false when time is before range', () => {
    expect(isWithinTimeRange('09:00', '17:00', '08:59')).toBe(false);
    expect(isWithinTimeRange('09:00', '17:00', '00:00')).toBe(false);
  });

  it('should return false when time is after range', () => {
    expect(isWithinTimeRange('09:00', '17:00', '17:01')).toBe(false);
    expect(isWithinTimeRange('09:00', '17:00', '23:59')).toBe(false);
  });

  it('should use current time when not provided', () => {
    // This test verifies the function runs without error
    const result = isWithinTimeRange('00:00', '23:59');
    expect(typeof result).toBe('boolean');
  });

  it('should handle edge times correctly', () => {
    expect(isWithinTimeRange('00:00', '23:59', '00:00')).toBe(true);
    expect(isWithinTimeRange('00:00', '23:59', '23:59')).toBe(true);
  });

  it('should work with minute precision', () => {
    expect(isWithinTimeRange('09:30', '09:45', '09:37')).toBe(true);
    expect(isWithinTimeRange('09:30', '09:45', '09:46')).toBe(false);
  });
});

describe('formatDuration', () => {
  it('should format minutes under 60 as minutes only', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(1)).toBe('1m');
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(59)).toBe('59m');
  });

  it('should format exactly 60 minutes as 1h', () => {
    expect(formatDuration(60)).toBe('1h');
  });

  it('should format hours with no remaining minutes as hours only', () => {
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(180)).toBe('3h');
  });

  it('should format hours with remaining minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(75)).toBe('1h 15m');
    expect(formatDuration(125)).toBe('2h 5m');
  });

  it('should handle large durations', () => {
    expect(formatDuration(720)).toBe('12h');
    expect(formatDuration(1440)).toBe('24h');
    expect(formatDuration(1441)).toBe('24h 1m');
  });
});

describe('formatTime12Hour', () => {
  it('should format midnight as 12:00 AM', () => {
    expect(formatTime12Hour('00:00')).toBe('12:00 AM');
    expect(formatTime12Hour('00:30')).toBe('12:30 AM');
  });

  it('should format morning times correctly', () => {
    expect(formatTime12Hour('01:00')).toBe('1:00 AM');
    expect(formatTime12Hour('09:30')).toBe('9:30 AM');
    expect(formatTime12Hour('11:59')).toBe('11:59 AM');
  });

  it('should format noon as 12:00 PM', () => {
    expect(formatTime12Hour('12:00')).toBe('12:00 PM');
    expect(formatTime12Hour('12:30')).toBe('12:30 PM');
  });

  it('should format afternoon times correctly', () => {
    expect(formatTime12Hour('13:00')).toBe('1:00 PM');
    expect(formatTime12Hour('17:30')).toBe('5:30 PM');
    expect(formatTime12Hour('23:59')).toBe('11:59 PM');
  });

  it('should preserve leading zeros in minutes', () => {
    expect(formatTime12Hour('09:05')).toBe('9:05 AM');
    expect(formatTime12Hour('14:00')).toBe('2:00 PM');
  });
});

describe('calculateDurationMinutes', () => {
  it('should calculate duration between two dates in minutes', () => {
    const start = new Date('2024-01-01T09:00:00');
    const end = new Date('2024-01-01T10:30:00');
    expect(calculateDurationMinutes(start, end)).toBe(90);
  });

  it('should return 0 for same start and end', () => {
    const date = new Date('2024-01-01T09:00:00');
    expect(calculateDurationMinutes(date, date)).toBe(0);
  });

  it('should handle durations spanning days', () => {
    const start = new Date('2024-01-01T23:00:00');
    const end = new Date('2024-01-02T01:00:00');
    expect(calculateDurationMinutes(start, end)).toBe(120);
  });

  it('should round to nearest minute', () => {
    const start = new Date('2024-01-01T09:00:00');
    const end = new Date('2024-01-01T09:00:45'); // 45 seconds
    expect(calculateDurationMinutes(start, end)).toBe(1);
  });

  it('should handle short durations', () => {
    const start = new Date('2024-01-01T09:00:00');
    const end = new Date('2024-01-01T09:01:00');
    expect(calculateDurationMinutes(start, end)).toBe(1);
  });

  it('should handle negative duration (end before start)', () => {
    const start = new Date('2024-01-01T10:00:00');
    const end = new Date('2024-01-01T09:00:00');
    expect(calculateDurationMinutes(start, end)).toBe(-60);
  });
});

describe('formatDate', () => {
  it('should format date in en-US short month format', () => {
    // Use explicit time to avoid timezone issues
    const date = new Date(2024, 2, 15); // March 15, 2024 (month is 0-indexed)
    const formatted = formatDate(date);
    expect(formatted).toContain('2024');
    expect(formatted).toContain('15');
    expect(formatted).toContain('Mar');
  });

  it('should handle different dates', () => {
    const date1 = new Date(2024, 0, 1); // Jan 1, 2024
    const date2 = new Date(2024, 11, 31); // Dec 31, 2024
    expect(formatDate(date1)).not.toBe(formatDate(date2));
  });
});

describe('formatDateTime', () => {
  it('should include both date and time', () => {
    // Use explicit constructor to avoid timezone issues
    const date = new Date(2024, 2, 15, 14, 30, 0); // March 15, 2024 2:30 PM
    const formatted = formatDateTime(date);
    expect(formatted).toContain('2024');
    expect(formatted).toContain('15');
    expect(formatted).toContain('Mar');
  });

  it('should use 12-hour format', () => {
    const pmDate = new Date(2024, 2, 15, 14, 30, 0); // March 15, 2024 2:30 PM
    const formatted = formatDateTime(pmDate);
    expect(formatted).toMatch(/PM|AM/i);
  });
});

describe('getDayOfWeekName', () => {
  it('should capitalize first letter', () => {
    expect(getDayOfWeekName('sunday')).toBe('Sunday');
    expect(getDayOfWeekName('monday')).toBe('Monday');
    expect(getDayOfWeekName('saturday')).toBe('Saturday');
  });

  it('should work for all days', () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    days.forEach((day) => {
      const result = getDayOfWeekName(day);
      expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
      expect(result.slice(1)).toBe(day.slice(1));
    });
  });
});

describe('timeToMinutes', () => {
  it('should convert midnight to 0', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('should convert times correctly', () => {
    expect(timeToMinutes('01:00')).toBe(60);
    expect(timeToMinutes('01:30')).toBe(90);
    expect(timeToMinutes('12:00')).toBe(720);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('should handle leading zeros', () => {
    expect(timeToMinutes('09:05')).toBe(545);
  });
});

describe('minutesToTime', () => {
  it('should convert 0 to midnight', () => {
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('should convert minutes correctly', () => {
    expect(minutesToTime(60)).toBe('01:00');
    expect(minutesToTime(90)).toBe('01:30');
    expect(minutesToTime(720)).toBe('12:00');
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('should pad single digits', () => {
    expect(minutesToTime(5)).toBe('00:05');
    expect(minutesToTime(65)).toBe('01:05');
  });

  it('should be inverse of timeToMinutes', () => {
    const times = ['00:00', '09:30', '12:00', '17:45', '23:59'];
    times.forEach((time) => {
      expect(minutesToTime(timeToMinutes(time))).toBe(time);
    });
  });
});
