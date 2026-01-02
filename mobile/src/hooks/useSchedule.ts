import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  ScheduleSlot,
  COLLECTIONS,
  getCurrentDayOfWeek,
  isWithinTimeRange,
} from '@dmdl/shared';

interface UseScheduleResult {
  schedules: ScheduleSlot[];
  todaySchedule: ScheduleSlot | null;
  isWithinSchedule: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSchedule(schoolId: string | undefined): UseScheduleResult {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId || !user) {
      setSchedules([]);
      setIsLoading(false);
      return;
    }

    // Administrators don't have schedules
    if (user.role === 'administrator') {
      setSchedules([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const schedulesRef = collection(db, COLLECTIONS.SCHEDULES);
    const q = query(
      schedulesRef,
      where('providerId', '==', user.id),
      where('schoolId', '==', schoolId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const scheduleList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            effectiveFrom: data.effectiveFrom?.toDate() || new Date(),
            effectiveUntil: data.effectiveUntil?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as ScheduleSlot;
        });
        setSchedules(scheduleList);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching schedules:', err);
        setError('Failed to load schedule');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [schoolId, user]);

  // Find today's schedule
  const todaySchedule = useMemo(() => {
    const today = getCurrentDayOfWeek();
    const now = new Date();

    return schedules.find((schedule) => {
      // Check if it's the right day
      if (schedule.dayOfWeek !== today) return false;

      // Check if schedule is currently effective
      if (schedule.effectiveFrom > now) return false;
      if (schedule.effectiveUntil && schedule.effectiveUntil < now) return false;

      return true;
    }) || null;
  }, [schedules]);

  // Check if current time is within the schedule
  const isWithinSchedule = useMemo(() => {
    if (!todaySchedule) return false;
    return isWithinTimeRange(todaySchedule.startTime, todaySchedule.endTime);
  }, [todaySchedule]);

  return {
    schedules,
    todaySchedule,
    isWithinSchedule,
    isLoading,
    error,
  };
}
