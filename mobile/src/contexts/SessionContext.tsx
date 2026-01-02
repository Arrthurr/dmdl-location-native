import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { httpsCallable } from 'firebase/functions';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { db, functions } from '@/services/firebase';
import { useAuth } from './AuthContext';
import {
  Session,
  GeoPoint,
  CheckInInput,
  CheckOutInput,
  COLLECTIONS,
} from '@dmdl/shared';

interface SessionContextType {
  activeSession: Session | null;
  isChecking: boolean;
  error: string | null;
  checkIn: (schoolId: string, location: GeoPoint) => Promise<void>;
  checkOut: (sessionId: string, location: GeoPoint) => Promise<void>;
  updateNotes: (sessionId: string, notes: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser } = useAuth();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to active session
  useEffect(() => {
    if (!firebaseUser) {
      setActiveSession(null);
      return;
    }

    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const q = query(
      sessionsRef,
      where('userId', '==', firebaseUser.uid),
      where('status', '==', 'active'),
      orderBy('checkInTime', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setActiveSession(null);
        } else {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setActiveSession({
            ...data,
            id: doc.id,
            checkInTime: data.checkInTime?.toDate() || new Date(),
            checkOutTime: data.checkOutTime?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Session);
        }
      },
      (err) => {
        console.error('Error subscribing to sessions:', err);
        setError('Failed to load session data');
      }
    );

    return unsubscribe;
  }, [firebaseUser]);

  const checkIn = useCallback(
    async (schoolId: string, location: GeoPoint): Promise<void> => {
      setIsChecking(true);
      setError(null);

      try {
        const checkInFn = httpsCallable<CheckInInput, { success: boolean; sessionId: string }>(
          functions,
          'checkIn'
        );

        const result = await checkInFn({
          schoolId,
          location,
          deviceInfo: {
            platform: Platform.OS as 'ios' | 'android',
            appVersion: Constants.expoConfig?.version,
          },
        });

        if (!result.data.success) {
          throw new Error('Check-in failed');
        }

        // Session will be updated via the snapshot listener
      } catch (err: any) {
        const message = err.message || 'Failed to check in';
        setError(message);
        throw new Error(message);
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  const checkOut = useCallback(
    async (sessionId: string, location: GeoPoint): Promise<void> => {
      setIsChecking(true);
      setError(null);

      try {
        const checkOutFn = httpsCallable<CheckOutInput, { success: boolean; durationMinutes: number }>(
          functions,
          'checkOut'
        );

        const result = await checkOutFn({
          sessionId,
          location,
        });

        if (!result.data.success) {
          throw new Error('Check-out failed');
        }

        // Session will be updated via the snapshot listener
      } catch (err: any) {
        const message = err.message || 'Failed to check out';
        setError(message);
        throw new Error(message);
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  const updateNotes = useCallback(
    async (sessionId: string, notes: string): Promise<void> => {
      try {
        const updateNotesFn = httpsCallable<
          { sessionId: string; notes: string },
          { success: boolean }
        >(functions, 'updateSessionNotes');

        await updateNotesFn({ sessionId, notes });
      } catch (err: any) {
        const message = err.message || 'Failed to update notes';
        setError(message);
        throw new Error(message);
      }
    },
    []
  );

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        isChecking,
        error,
        checkIn,
        checkOut,
        updateNotes,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
