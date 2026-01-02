import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Session, COLLECTIONS } from '@dmdl/shared';

interface UseSessionDetailsResult {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export function useSessionDetails(sessionId: string | undefined): UseSessionDetailsResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const sessionRef = doc(db, COLLECTIONS.SESSIONS, sessionId);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSession({
            ...data,
            id: snapshot.id,
            checkInTime: data.checkInTime?.toDate() || new Date(),
            checkOutTime: data.checkOutTime?.toDate(),
            notesUpdatedAt: data.notesUpdatedAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Session);
          setError(null);
        } else {
          setSession(null);
          setError('Session not found');
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching session:', err);
        setError('Failed to load session');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [sessionId]);

  return { session, isLoading, error };
}
