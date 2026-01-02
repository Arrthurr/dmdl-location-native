import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Session, COLLECTIONS, DEFAULT_PAGE_SIZE } from '@dmdl/shared';

interface UseSessionsResult {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSessions(): UseSessionsResult {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchSessions = useCallback(
    async (startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null) => {
      if (!user) {
        setSessions([]);
        setIsLoading(false);
        return;
      }

      try {
        const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
        let q = query(
          sessionsRef,
          where('userId', '==', user.id),
          orderBy('checkInTime', 'desc'),
          limit(DEFAULT_PAGE_SIZE)
        );

        if (startAfterDoc) {
          q = query(
            sessionsRef,
            where('userId', '==', user.id),
            orderBy('checkInTime', 'desc'),
            startAfter(startAfterDoc),
            limit(DEFAULT_PAGE_SIZE)
          );
        }

        const snapshot = await getDocs(q);
        const sessionList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            checkInTime: data.checkInTime?.toDate() || new Date(),
            checkOutTime: data.checkOutTime?.toDate(),
            notesUpdatedAt: data.notesUpdatedAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Session;
        });

        if (startAfterDoc) {
          setSessions((prev) => [...prev, ...sessionList]);
        } else {
          setSessions(sessionList);
        }

        setHasMore(snapshot.docs.length === DEFAULT_PAGE_SIZE);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setError(null);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchSessions();
  }, [fetchSessions]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !lastDoc) return;
    await fetchSessions(lastDoc);
  }, [hasMore, isLoading, lastDoc, fetchSessions]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setLastDoc(null);
    await fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
