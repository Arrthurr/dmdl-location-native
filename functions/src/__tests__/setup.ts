import * as admin from 'firebase-admin';

// Initialize firebase-admin with a mock project
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project',
  });
}

// Mock console.log for cleaner test output
jest.spyOn(console, 'log').mockImplementation(() => {});
