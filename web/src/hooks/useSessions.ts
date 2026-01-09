'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  getDocs,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session, COLLECTIONS } from '@dmdl/shared';

interface UseSessionsOptions {
  providerId?: string;
  schoolId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  pageSize?: number;
}

export function useSessions(options: UseSessionsOptions = {}) {
  const { providerId, schoolId, startDate, endDate, status, pageSize = 50 } =
    options;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract date timestamps for stable dependency comparison
  const startDateTimestamp = startDate?.getTime();
  const endDateTimestamp = endDate?.getTime();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      setError('Firebase is not configured');
      return;
    }

    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    let constraints: QueryConstraint[] = [orderBy('checkInTime', 'desc'), limit(pageSize)];

    if (providerId) {
      constraints = [where('userId', '==', providerId), ...constraints];
    }

    if (schoolId) {
      constraints = [where('schoolId', '==', schoolId), ...constraints];
    }

    if (status && status !== 'all') {
      constraints = [where('status', '==', status), ...constraints];
    }

    if (startDate) {
      constraints = [
        where('checkInTime', '>=', Timestamp.fromDate(startDate)),
        ...constraints,
      ];
    }

    if (endDate) {
      constraints = [
        where('checkInTime', '<=', Timestamp.fromDate(endDate)),
        ...constraints,
      ];
    }

    const sessionsQuery = query(sessionsRef, ...constraints);

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const sessionsList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            checkInTime: data.checkInTime?.toDate() || new Date(),
            checkOutTime: data.checkOutTime?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Session;
        });
        setSessions(sessionsList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching sessions:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [providerId, schoolId, startDateTimestamp, endDateTimestamp, status, pageSize, startDate, endDate]);

  return { sessions, isLoading, error };
}

export function useSessionsForExport(options: UseSessionsOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportSessions = useCallback(async () => {
    if (!db) {
      setError('Firebase is not configured');
      return [];
    }

    setIsExporting(true);
    setError(null);

    try {
      const { providerId, schoolId, startDate, endDate, status } = options;
      const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
      let constraints: QueryConstraint[] = [orderBy('checkInTime', 'desc')];

      if (providerId) {
        constraints = [where('userId', '==', providerId), ...constraints];
      }

      if (schoolId) {
        constraints = [where('schoolId', '==', schoolId), ...constraints];
      }

      if (status && status !== 'all') {
        constraints = [where('status', '==', status), ...constraints];
      }

      if (startDate) {
        constraints = [
          where('checkInTime', '>=', Timestamp.fromDate(startDate)),
          ...constraints,
        ];
      }

      if (endDate) {
        constraints = [
          where('checkInTime', '<=', Timestamp.fromDate(endDate)),
          ...constraints,
        ];
      }

      const sessionsQuery = query(sessionsRef, ...constraints);
      const snapshot = await getDocs(sessionsQuery);

      const sessions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          checkInTime: data.checkInTime?.toDate() || new Date(),
          checkOutTime: data.checkOutTime?.toDate(),
        } as Session;
      });

      setIsExporting(false);
      return sessions;
    } catch (err) {
      console.error('Error exporting sessions:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      setIsExporting(false);
      return [];
    }
  }, [options]);

  return { exportSessions, isExporting, error };
}
