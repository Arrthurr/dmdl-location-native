// Geolocation constants
export const CHECK_IN_RADIUS_METERS = 150;
export const DEFAULT_CHECK_IN_RADIUS_METERS = CHECK_IN_RADIUS_METERS; // Alias for convenience
export const DEFAULT_LOCATION_ACCURACY = 'high';
export const BACKGROUND_LOCATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const BACKGROUND_LOCATION_DISTANCE_METERS = 50; // Minimum distance change to trigger update

// Session constants
export const AUTO_CHECKOUT_HOURS = 12; // Auto-checkout after this many hours
export const SESSION_NOTE_MAX_LENGTH = 1000;

// Time constants
export const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Collections (Firestore)
export const COLLECTIONS = {
  USERS: 'users',
  SCHOOLS: 'schools',
  SCHEDULES: 'schedules',
  ASSIGNMENTS: 'assignments',
  SESSIONS: 'sessions',
  LOCATION_CHECKS: 'locationChecks',
} as const;
