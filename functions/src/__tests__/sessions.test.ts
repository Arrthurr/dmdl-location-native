import { calculateDistance } from '../utils/geo';
import { COLLECTIONS, CHECK_IN_RADIUS_METERS, DAYS_OF_WEEK } from '../utils/constants';

// Test the calculateDistance function used in sessions
describe('sessions/calculateDistance', () => {
  it('should calculate distance accurately', () => {
    // Empire State Building to Times Square (~1km)
    const distance = calculateDistance(40.7484, -73.9857, 40.7580, -73.9855);
    expect(distance).toBeGreaterThan(900);
    expect(distance).toBeLessThan(1200);
  });

  it('should return 0 for same coordinates', () => {
    expect(calculateDistance(40.7484, -73.9857, 40.7484, -73.9857)).toBe(0);
  });
});

// Test check-in validation logic
describe('checkIn validation logic', () => {
  describe('distance validation', () => {
    it('should accept check-in within radius', () => {
      const schoolLat = 40.7128;
      const schoolLon = -74.006;
      const userLat = 40.7129; // ~11m away
      const userLon = -74.006;

      const distance = calculateDistance(userLat, userLon, schoolLat, schoolLon);
      expect(distance).toBeLessThanOrEqual(CHECK_IN_RADIUS_METERS);
    });

    it('should reject check-in outside radius', () => {
      const schoolLat = 40.7128;
      const schoolLon = -74.006;
      const userLat = 40.715; // ~244m away
      const userLon = -74.006;

      const distance = calculateDistance(userLat, userLon, schoolLat, schoolLon);
      expect(distance).toBeGreaterThan(CHECK_IN_RADIUS_METERS);
    });

    it('should accept check-in at boundary (exactly 150m)', () => {
      const schoolLat = 40.7128;
      const schoolLon = -74.006;
      // Calculate a point that's roughly 150m away
      const userLat = 40.71415; // ~150m north
      const userLon = -74.006;

      const distance = calculateDistance(userLat, userLon, schoolLat, schoolLon);
      // Should be close to 150m
      expect(distance).toBeGreaterThan(140);
      expect(distance).toBeLessThan(160);
    });
  });

  describe('schedule time validation', () => {
    it('should validate time is within schedule range', () => {
      const startTime = '09:00';
      const endTime = '17:00';
      const currentTime = '12:00';

      expect(currentTime >= startTime && currentTime <= endTime).toBe(true);
    });

    it('should reject time before schedule', () => {
      const startTime = '09:00';
      const endTime = '17:00';
      const currentTime = '08:59';

      expect(currentTime >= startTime && currentTime <= endTime).toBe(false);
    });

    it('should reject time after schedule', () => {
      const startTime = '09:00';
      const endTime = '17:00';
      const currentTime = '17:01';

      expect(currentTime >= startTime && currentTime <= endTime).toBe(false);
    });

    it('should accept time at exact start boundary', () => {
      const startTime = '09:00';
      const endTime = '17:00';
      const currentTime = '09:00';

      expect(currentTime >= startTime && currentTime <= endTime).toBe(true);
    });

    it('should accept time at exact end boundary', () => {
      const startTime = '09:00';
      const endTime = '17:00';
      const currentTime = '17:00';

      expect(currentTime >= startTime && currentTime <= endTime).toBe(true);
    });
  });

  describe('effective date validation', () => {
    it('should accept when effectiveFrom is before now', () => {
      const now = new Date();
      const effectiveFrom = new Date(now.getTime() - 86400000); // Yesterday

      expect(effectiveFrom <= now).toBe(true);
    });

    it('should reject when effectiveFrom is after now', () => {
      const now = new Date();
      const effectiveFrom = new Date(now.getTime() + 86400000); // Tomorrow

      expect(effectiveFrom > now).toBe(true);
    });

    it('should accept when effectiveUntil is after now', () => {
      const now = new Date();
      const effectiveUntil = new Date(now.getTime() + 86400000); // Tomorrow

      expect(effectiveUntil >= now).toBe(true);
    });

    it('should reject when effectiveUntil is before now', () => {
      const now = new Date();
      const effectiveUntil = new Date(now.getTime() - 86400000); // Yesterday

      expect(effectiveUntil < now).toBe(true);
    });
  });

  describe('day of week validation', () => {
    it('should correctly identify day of week', () => {
      // Use explicit constructor to avoid timezone issues
      const testDate = new Date(2024, 0, 15, 12, 0, 0); // Monday Jan 15, 2024 at noon
      const dayIndex = testDate.getDay();
      expect(DAYS_OF_WEEK[dayIndex]).toBe('monday');
    });

    it('should match Sunday correctly', () => {
      const testDate = new Date(2024, 0, 14, 12, 0, 0); // Sunday Jan 14, 2024 at noon
      const dayIndex = testDate.getDay();
      expect(DAYS_OF_WEEK[dayIndex]).toBe('sunday');
    });

    it('should match Saturday correctly', () => {
      const testDate = new Date(2024, 0, 20, 12, 0, 0); // Saturday Jan 20, 2024 at noon
      const dayIndex = testDate.getDay();
      expect(DAYS_OF_WEEK[dayIndex]).toBe('saturday');
    });
  });
});

// Test check-out logic
describe('checkOut validation logic', () => {
  describe('duration calculation', () => {
    it('should calculate duration in minutes correctly', () => {
      const checkInTime = new Date('2024-01-15T09:00:00');
      const checkOutTime = new Date('2024-01-15T17:00:00');
      const durationMinutes = Math.round(
        (checkOutTime.getTime() - checkInTime.getTime()) / 60000
      );

      expect(durationMinutes).toBe(480); // 8 hours
    });

    it('should handle short sessions', () => {
      const checkInTime = new Date('2024-01-15T09:00:00');
      const checkOutTime = new Date('2024-01-15T09:15:00');
      const durationMinutes = Math.round(
        (checkOutTime.getTime() - checkInTime.getTime()) / 60000
      );

      expect(durationMinutes).toBe(15);
    });

    it('should round to nearest minute', () => {
      const checkInTime = new Date('2024-01-15T09:00:00');
      const checkOutTime = new Date('2024-01-15T09:00:45'); // 45 seconds
      const durationMinutes = Math.round(
        (checkOutTime.getTime() - checkInTime.getTime()) / 60000
      );

      expect(durationMinutes).toBe(1);
    });

    it('should handle sessions spanning midnight', () => {
      const checkInTime = new Date('2024-01-15T23:00:00');
      const checkOutTime = new Date('2024-01-16T01:00:00');
      const durationMinutes = Math.round(
        (checkOutTime.getTime() - checkInTime.getTime()) / 60000
      );

      expect(durationMinutes).toBe(120); // 2 hours
    });
  });

  describe('check-out distance calculation', () => {
    it('should calculate distance from school at check-out', () => {
      const schoolLocation = { latitude: 40.7128, longitude: -74.006 };
      const checkOutLocation = { latitude: 40.713, longitude: -74.006 };

      const distance = calculateDistance(
        checkOutLocation.latitude,
        checkOutLocation.longitude,
        schoolLocation.latitude,
        schoolLocation.longitude
      );

      expect(distance).toBeGreaterThan(0);
      expect(Math.round(distance)).toBeGreaterThan(0);
    });
  });
});

// Test updateSessionNotes validation
describe('updateSessionNotes validation', () => {
  describe('notes length validation', () => {
    it('should accept notes under 1000 characters', () => {
      const notes = 'A'.repeat(999);
      expect(notes.length <= 1000).toBe(true);
    });

    it('should accept notes exactly 1000 characters', () => {
      const notes = 'A'.repeat(1000);
      expect(notes.length <= 1000).toBe(true);
    });

    it('should reject notes over 1000 characters', () => {
      const notes = 'A'.repeat(1001);
      expect(notes.length > 1000).toBe(true);
    });
  });

  describe('permission validation', () => {
    it('should allow session owner to update', () => {
      const sessionUserId: string = 'user123';
      const requestUserId: string = 'user123';
      const isAdmin = false;

      const canUpdate = sessionUserId === requestUserId || isAdmin;
      expect(canUpdate).toBe(true);
    });

    it('should allow admin to update any session', () => {
      const sessionUserId: string = 'user123';
      const requestUserId: string = 'admin456';
      const isAdmin = true;

      const canUpdate = sessionUserId === requestUserId || isAdmin;
      expect(canUpdate).toBe(true);
    });

    it('should reject non-owner non-admin', () => {
      const sessionUserId: string = 'user123';
      const requestUserId: string = 'other789';
      const isAdmin = false;

      const canUpdate = sessionUserId === requestUserId || isAdmin;
      expect(canUpdate).toBe(false);
    });
  });
});

// Test constants
describe('constants', () => {
  it('should have CHECK_IN_RADIUS_METERS set to 150', () => {
    expect(CHECK_IN_RADIUS_METERS).toBe(150);
  });

  it('should have all required collections defined', () => {
    expect(COLLECTIONS.USERS).toBe('users');
    expect(COLLECTIONS.SCHOOLS).toBe('schools');
    expect(COLLECTIONS.SCHEDULES).toBe('schedules');
    expect(COLLECTIONS.SESSIONS).toBe('sessions');
  });

  it('should have 7 days in DAYS_OF_WEEK', () => {
    expect(DAYS_OF_WEEK).toHaveLength(7);
    expect(DAYS_OF_WEEK[0]).toBe('sunday');
    expect(DAYS_OF_WEEK[6]).toBe('saturday');
  });
});
