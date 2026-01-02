'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { School, COLLECTIONS, DEFAULT_CHECK_IN_RADIUS_METERS } from '@dmdl/shared';

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      setError('Firebase is not configured');
      return;
    }

    const schoolsRef = collection(db, COLLECTIONS.SCHOOLS);
    const schoolsQuery = query(schoolsRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      schoolsQuery,
      (snapshot) => {
        const schoolsList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            location: data.location
              ? {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                }
              : { latitude: 0, longitude: 0 },
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as School;
        });
        setSchools(schoolsList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching schools:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const addSchool = useCallback(
    async (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!db) throw new Error('Firebase is not configured');

      const schoolsRef = collection(db, COLLECTIONS.SCHOOLS);
      const docRef = await addDoc(schoolsRef, {
        ...schoolData,
        location: new GeoPoint(
          schoolData.location.latitude,
          schoolData.location.longitude
        ),
        checkInRadiusMeters:
          schoolData.checkInRadiusMeters || DEFAULT_CHECK_IN_RADIUS_METERS,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    []
  );

  const updateSchool = useCallback(
    async (schoolId: string, updates: Partial<School>) => {
      if (!db) throw new Error('Firebase is not configured');

      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      if (updates.location) {
        updateData.location = new GeoPoint(
          updates.location.latitude,
          updates.location.longitude
        );
      }

      await updateDoc(schoolRef, updateData);
    },
    []
  );

  const deleteSchool = useCallback(async (schoolId: string) => {
    if (!db) throw new Error('Firebase is not configured');

    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
    await deleteDoc(schoolRef);
  }, []);

  const deactivateSchool = useCallback(async (schoolId: string) => {
    if (!db) throw new Error('Firebase is not configured');

    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
    await updateDoc(schoolRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  }, []);

  return {
    schools,
    isLoading,
    error,
    addSchool,
    updateSchool,
    deleteSchool,
    deactivateSchool,
  };
}

export function useSchool(schoolId: string) {
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !schoolId) {
      setIsLoading(false);
      return;
    }

    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
    const unsubscribe = onSnapshot(
      schoolRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSchool({
            ...data,
            id: docSnap.id,
            location: data.location
              ? {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                }
              : { latitude: 0, longitude: 0 },
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as School);
        } else {
          setSchool(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching school:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [schoolId]);

  return { school, isLoading, error };
}
