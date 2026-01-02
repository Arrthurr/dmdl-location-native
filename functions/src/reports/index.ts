import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { COLLECTIONS } from '../utils/constants';

interface ReportRequest {
  startDate: string; // ISO string
  endDate: string;
  providerIds?: string[];
  schoolIds?: string[];
}

export const generateSessionReport = functions.https.onCall(
  async (request: functions.https.CallableRequest<ReportRequest>) => {
    const { data, auth } = request;

    if (!auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated'
      );
    }

    const db = admin.firestore();

    // Verify user is admin
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'administrator') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    // Build query
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const sessionsQuery = await db
      .collection(COLLECTIONS.SESSIONS)
      .where(
        'checkInTime',
        '>=',
        admin.firestore.Timestamp.fromDate(startDate)
      )
      .where('checkInTime', '<=', admin.firestore.Timestamp.fromDate(endDate))
      .orderBy('checkInTime', 'desc')
      .get();

    // Filter in memory for provider/school (Firestore limitation on multiple IN clauses)
    let filteredDocs = sessionsQuery.docs;

    if (data.providerIds && data.providerIds.length > 0) {
      filteredDocs = filteredDocs.filter((doc) =>
        data.providerIds!.includes(doc.data().userId)
      );
    }

    if (data.schoolIds && data.schoolIds.length > 0) {
      filteredDocs = filteredDocs.filter((doc) =>
        data.schoolIds!.includes(doc.data().schoolId)
      );
    }

    // Generate CSV content
    const headers = [
      'Session ID',
      'Provider Name',
      'Provider Email',
      'School Name',
      'Check-In Date',
      'Check-In Time',
      'Check-Out Date',
      'Check-Out Time',
      'Duration (minutes)',
      'Status',
      'Notes',
    ];

    const rows = filteredDocs.map((doc) => {
      const session = doc.data();
      const checkInDate = session.checkInTime?.toDate();
      const checkOutDate = session.checkOutTime?.toDate();

      return [
        session.id,
        session.userDisplayName || '',
        '', // Email would need to be fetched separately
        session.schoolName || '',
        checkInDate ? checkInDate.toISOString().split('T')[0] : '',
        checkInDate ? checkInDate.toTimeString().split(' ')[0] : '',
        checkOutDate ? checkOutDate.toISOString().split('T')[0] : '',
        checkOutDate ? checkOutDate.toTimeString().split(' ')[0] : '',
        session.durationMinutes?.toString() || '',
        session.status || '',
        (session.notes || '').replace(/"/g, '""').replace(/\n/g, ' '),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return {
      success: true,
      csv: csvContent,
      filename: `sessions_${data.startDate}_to_${data.endDate}.csv`,
      recordCount: rows.length,
    };
  }
);
