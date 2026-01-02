import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { calculateDistance } from '../utils/geo';
import { COLLECTIONS, DAYS_OF_WEEK, CHECK_IN_RADIUS_METERS } from '../utils/constants';

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface CheckInRequest {
  schoolId: string;
  location: GeoPoint;
  deviceInfo?: {
    platform: 'ios' | 'android' | 'web';
    deviceId?: string;
    appVersion?: string;
  };
}

interface CheckOutRequest {
  sessionId: string;
  location: GeoPoint;
}

interface UpdateNotesRequest {
  sessionId: string;
  notes: string;
}

export const checkIn = functions.https.onCall(
  async (request: functions.https.CallableRequest<CheckInRequest>) => {
    const { data, auth } = request;

    // 1. Verify authentication
    if (!auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated'
      );
    }

    const userId = auth.uid;
    const db = admin.firestore();

    // 2. Get user document
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    const user = userDoc.data()!;

    // 3. Check for existing active session
    const activeSessionQuery = await db
      .collection(COLLECTIONS.SESSIONS)
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!activeSessionQuery.empty) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Already checked in. Please check out first.'
      );
    }

    // 4. Get school document
    const schoolDoc = await db
      .collection(COLLECTIONS.SCHOOLS)
      .doc(data.schoolId)
      .get();
    if (!schoolDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'School not found');
    }
    const school = schoolDoc.data()!;

    // 5. Validate distance
    const schoolLocation = school.location;
    const distance = calculateDistance(
      data.location.latitude,
      data.location.longitude,
      schoolLocation.latitude,
      schoolLocation.longitude
    );

    const maxRadius = school.checkInRadiusMeters || CHECK_IN_RADIUS_METERS;
    if (distance > maxRadius) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Too far from school. You are ${Math.round(distance)}m away (max ${maxRadius}m).`
      );
    }

    // 6. For providers, validate schedule
    let scheduleId: string | null = null;
    if (user.role === 'provider') {
      const now = new Date();
      const dayOfWeek = DAYS_OF_WEEK[now.getDay()];
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

      const scheduleQuery = await db
        .collection(COLLECTIONS.SCHEDULES)
        .where('providerId', '==', userId)
        .where('schoolId', '==', data.schoolId)
        .where('dayOfWeek', '==', dayOfWeek)
        .where('isActive', '==', true)
        .get();

      const validSchedule = scheduleQuery.docs.find((doc) => {
        const schedule = doc.data();
        // Check if schedule is currently effective
        const effectiveFrom = schedule.effectiveFrom?.toDate();
        const effectiveUntil = schedule.effectiveUntil?.toDate();
        if (effectiveFrom && effectiveFrom > now) return false;
        if (effectiveUntil && effectiveUntil < now) return false;
        // Check if within time range
        return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
      });

      if (!validSchedule) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Check-in not allowed outside your scheduled times.'
        );
      }

      scheduleId = validSchedule.id;
    }

    // 7. Create session
    const sessionRef = db.collection(COLLECTIONS.SESSIONS).doc();
    const session = {
      id: sessionRef.id,
      userId,
      userRole: user.role,
      userDisplayName: user.displayName,
      schoolId: data.schoolId,
      schoolName: school.name,
      scheduleId,
      checkInTime: admin.firestore.FieldValue.serverTimestamp(),
      checkInLocation: new admin.firestore.GeoPoint(
        data.location.latitude,
        data.location.longitude
      ),
      checkInDistanceMeters: Math.round(distance),
      status: 'active',
      deviceInfo: data.deviceInfo || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await sessionRef.set(session);

    return {
      success: true,
      sessionId: sessionRef.id,
      message: `Checked in at ${school.name}`,
    };
  }
);

export const checkOut = functions.https.onCall(
  async (request: functions.https.CallableRequest<CheckOutRequest>) => {
    const { data, auth } = request;

    if (!auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated'
      );
    }

    const userId = auth.uid;
    const db = admin.firestore();

    // Get session
    const sessionRef = db.collection(COLLECTIONS.SESSIONS).doc(data.sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const session = sessionDoc.data()!;

    // Verify ownership
    if (session.userId !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Not your session'
      );
    }

    if (session.status !== 'active') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Session is not active'
      );
    }

    // Calculate duration
    const checkInTime = session.checkInTime.toDate();
    const checkOutTime = new Date();
    const durationMinutes = Math.round(
      (checkOutTime.getTime() - checkInTime.getTime()) / 60000
    );

    // Get school for distance calculation
    const schoolDoc = await db
      .collection(COLLECTIONS.SCHOOLS)
      .doc(session.schoolId)
      .get();
    let checkOutDistanceMeters = 0;
    if (schoolDoc.exists) {
      const school = schoolDoc.data()!;
      checkOutDistanceMeters = Math.round(
        calculateDistance(
          data.location.latitude,
          data.location.longitude,
          school.location.latitude,
          school.location.longitude
        )
      );
    }

    // Update session
    await sessionRef.update({
      checkOutTime: admin.firestore.FieldValue.serverTimestamp(),
      checkOutLocation: new admin.firestore.GeoPoint(
        data.location.latitude,
        data.location.longitude
      ),
      checkOutDistanceMeters,
      status: 'completed',
      durationMinutes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      durationMinutes,
      message: `Checked out after ${durationMinutes} minutes`,
    };
  }
);

export const updateSessionNotes = functions.https.onCall(
  async (request: functions.https.CallableRequest<UpdateNotesRequest>) => {
    const { data, auth } = request;

    if (!auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated'
      );
    }

    const userId = auth.uid;
    const db = admin.firestore();

    // Get session
    const sessionRef = db.collection(COLLECTIONS.SESSIONS).doc(data.sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const session = sessionDoc.data()!;

    // Verify ownership or admin
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const user = userDoc.data();
    const isAdmin = user?.role === 'administrator';

    if (session.userId !== userId && !isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Not your session'
      );
    }

    // Validate notes length
    if (data.notes.length > 1000) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Notes must be 1000 characters or less'
      );
    }

    // Update session notes
    await sessionRef.update({
      notes: data.notes,
      notesUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'Notes updated',
    };
  }
);
