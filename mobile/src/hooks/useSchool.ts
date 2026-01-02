import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { School, COLLECTIONS } from '@dmdl/shared';

interface UseSchoolResult {
  school: School | null;
  isLoading: boolean;
  error: string | null;
}

export function useSchool(schoolId: string | undefined): UseSchoolResult {
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setSchool(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);

    const unsubscribe = onSnapshot(
      schoolRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSchool({
            ...data,
            id: snapshot.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as School);
          setError(null);
        } else {
          setSchool(null);
          setError('School not found');
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching school:', err);
        setError('Failed to load school');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [schoolId]);

  return { school, isLoading, error };
}
