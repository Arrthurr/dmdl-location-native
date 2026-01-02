// Geolocation constants
export const CHECK_IN_RADIUS_METERS = 150;
export const AUTO_CHECKOUT_HOURS = 12;

// Firestore collections
export const COLLECTIONS = {
  USERS: 'users',
  SCHOOLS: 'schools',
  SCHEDULES: 'schedules',
  ASSIGNMENTS: 'assignments',
  SESSIONS: 'sessions',
  LOCATION_CHECKS: 'locationChecks',
} as const;

// Days of week
export const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
