import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { School, COLLECTIONS } from '@dmdl/shared';

interface UseSchoolsResult {
  schools: School[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSchools(): UseSchoolsResult {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSchools([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // For administrators, show all active schools
    // For providers, show assigned schools via assignments collection
    if (user.role === 'administrator') {
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
          console.error('Error fetching schools:', err);
          setError('Failed to load schools');
          setIsLoading(false);
        }
      );

      return unsubscribe;
    } else {
      // Provider - get assigned schools
      const assignmentsRef = collection(db, COLLECTIONS.ASSIGNMENTS);
      const q = query(
        assignmentsRef,
        where('providerId', '==', user.id),
        where('isActive', '==', true)
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          // Get school IDs from assignments
          const schoolPromises = snapshot.docs.map(async (assignmentDoc) => {
            const assignment = assignmentDoc.data();
            // The assignment contains denormalized school data
            return {
              id: assignment.schoolId,
              name: assignment.schoolName,
              address: assignment.schoolAddress,
              location: assignment.schoolLocation,
              // We'll need to fetch full school data if needed
            } as Partial<School>;
          });

          const schoolDataList = await Promise.all(schoolPromises);

          // For now, use the denormalized data from assignments
          // In production, you might want to fetch full school documents
          setSchools(schoolDataList as School[]);
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching assignments:', err);
          setError('Failed to load assigned schools');
          setIsLoading(false);
        }
      );

      return unsubscribe;
    }
  }, [user]);

  const refetch = useCallback(async () => {
    // The onSnapshot listener automatically updates
    // This is here for pull-to-refresh UI consistency
  }, []);

  return { schools, isLoading, error, refetch };
}
