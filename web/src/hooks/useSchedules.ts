'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScheduleSlot, COLLECTIONS, DayOfWeek } from '@dmdl/shared';

interface CreateScheduleInput {
  providerId: string;
  schoolId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  providerName?: string;
  schoolName?: string;
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      setError('Firebase is not configured');
      return;
    }

    const schedulesRef = collection(db, COLLECTIONS.SCHEDULES);
    const schedulesQuery = query(
      schedulesRef,
      orderBy('dayOfWeek', 'asc'),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(
      schedulesQuery,
      (snapshot) => {
        const schedulesList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ScheduleSlot;
        });
        setSchedules(schedulesList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching schedules:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const addSchedule = useCallback(
    async (scheduleData: CreateScheduleInput) => {
      if (!db) throw new Error('Firebase is not configured');

      const schedulesRef = collection(db, COLLECTIONS.SCHEDULES);
      const docRef = await addDoc(schedulesRef, {
        ...scheduleData,
        isActive: true,
        effectiveFrom: new Date(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    []
  );

  const updateSchedule = useCallback(
    async (scheduleId: string, updates: Partial<ScheduleSlot>) => {
      if (!db) throw new Error('Firebase is not configured');

      const scheduleRef = doc(db, COLLECTIONS.SCHEDULES, scheduleId);
      await updateDoc(scheduleRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const deleteSchedule = useCallback(async (scheduleId: string) => {
    if (!db) throw new Error('Firebase is not configured');

    const scheduleRef = doc(db, COLLECTIONS.SCHEDULES, scheduleId);
    await deleteDoc(scheduleRef);
  }, []);

  return {
    schedules,
    isLoading,
    error,
    addSchedule,
    updateSchedule,
    deleteSchedule,
  };
}

export function useProviderSchedules(providerId: string) {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !providerId) {
      setIsLoading(false);
      return;
    }

    const schedulesRef = collection(db, COLLECTIONS.SCHEDULES);
    const schedulesQuery = query(
      schedulesRef,
      where('providerId', '==', providerId),
      orderBy('dayOfWeek', 'asc'),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(
      schedulesQuery,
      (snapshot) => {
        const schedulesList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ScheduleSlot;
        });
        setSchedules(schedulesList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching provider schedules:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [providerId]);

  return { schedules, isLoading, error };
}

export function useSchoolSchedules(schoolId: string) {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !schoolId) {
      setIsLoading(false);
      return;
    }

    const schedulesRef = collection(db, COLLECTIONS.SCHEDULES);
    const schedulesQuery = query(
      schedulesRef,
      where('schoolId', '==', schoolId),
      orderBy('dayOfWeek', 'asc'),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(
      schedulesQuery,
      (snapshot) => {
        const schedulesList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ScheduleSlot;
        });
        setSchedules(schedulesList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching school schedules:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [schoolId]);

  return { schedules, isLoading, error };
}
