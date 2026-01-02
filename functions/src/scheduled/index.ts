import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLECTIONS, AUTO_CHECKOUT_HOURS } from '../utils/constants';

// Run every 15 minutes to check for stale sessions
export const autoCheckOutStale = functions.scheduler.onSchedule(
  'every 15 minutes',
  async () => {
    const db = admin.firestore();

    // Find sessions that have been active for more than AUTO_CHECKOUT_HOURS
    const cutoffTime = new Date(
      Date.now() - AUTO_CHECKOUT_HOURS * 60 * 60 * 1000
    );

    const staleSessions = await db
      .collection(COLLECTIONS.SESSIONS)
      .where('status', '==', 'active')
      .where(
        'checkInTime',
        '<',
        admin.firestore.Timestamp.fromDate(cutoffTime)
      )
      .get();

    if (staleSessions.empty) {
      console.log('No stale sessions found');
      return;
    }

    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    staleSessions.docs.forEach((doc) => {
      const session = doc.data();
      const checkInTime = session.checkInTime.toDate();
      const durationMinutes = Math.round(
        (Date.now() - checkInTime.getTime()) / 60000
      );

      batch.update(doc.ref, {
        checkOutTime: now,
        status: 'auto_completed',
        durationMinutes,
        notes: session.notes
          ? `${session.notes}\n\n[Auto-checked out after ${AUTO_CHECKOUT_HOURS} hours]`
          : `[Auto-checked out after ${AUTO_CHECKOUT_HOURS} hours]`,
        updatedAt: now,
      });
    });

    await batch.commit();
    console.log(`Auto-checked out ${staleSessions.docs.length} stale sessions`);
  }
);
