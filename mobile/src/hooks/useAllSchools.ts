import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { School, COLLECTIONS } from '@dmdl/shared';

interface UseAllSchoolsResult {
  schools: School[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAllSchools(): UseAllSchoolsResult {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    const schoolsRef = collection(db, COLLECTIONS.SCHOOLS);
    const q = query(
      schoolsRef,
      where('isActive', '==', true),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const schoolList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as School;
        });
        setSchools(schoolList);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching all schools:', err);
        setError('Failed to load schools');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const refetch = useCallback(async () => {
    // The onSnapshot listener automatically updates
    // This is here for pull-to-refresh UI consistency
  }, []);

  return { schools, isLoading, error, refetch };
}
