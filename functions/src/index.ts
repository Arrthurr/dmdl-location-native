import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export auth functions
export { signInWithMicrosoft } from './auth';

// Export session functions
export { checkIn, checkOut, updateSessionNotes } from './sessions';

// Export scheduled functions
export { autoCheckOutStale } from './scheduled';

// Export report functions
export { generateSessionReport } from './reports';
