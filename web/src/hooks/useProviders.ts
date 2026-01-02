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
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, COLLECTIONS } from '@dmdl/shared';

export function useProviders() {
  const [providers, setProviders] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      setError('Firebase is not configured');
      return;
    }

    const providersRef = collection(db, COLLECTIONS.USERS);
    const providersQuery = query(
      providersRef,
      where('role', '==', 'provider'),
      orderBy('displayName', 'asc')
    );

    const unsubscribe = onSnapshot(
      providersQuery,
      (snapshot) => {
        const providersList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as User;
        });
        setProviders(providersList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching providers:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const updateProvider = useCallback(
    async (providerId: string, updates: Partial<User>) => {
      if (!db) throw new Error('Firebase is not configured');

      const providerRef = doc(db, COLLECTIONS.USERS, providerId);
      await updateDoc(providerRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const deactivateProvider = useCallback(async (providerId: string) => {
    if (!db) throw new Error('Firebase is not configured');

    const providerRef = doc(db, COLLECTIONS.USERS, providerId);
    await updateDoc(providerRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  }, []);

  const activateProvider = useCallback(async (providerId: string) => {
    if (!db) throw new Error('Firebase is not configured');

    const providerRef = doc(db, COLLECTIONS.USERS, providerId);
    await updateDoc(providerRef, {
      isActive: true,
      updatedAt: serverTimestamp(),
    });
  }, []);

  return {
    providers,
    isLoading,
    error,
    updateProvider,
    deactivateProvider,
    activateProvider,
  };
}

export function useProvider(providerId: string) {
  const [provider, setProvider] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !providerId) {
      setIsLoading(false);
      return;
    }

    const providerRef = doc(db, COLLECTIONS.USERS, providerId);
    const unsubscribe = onSnapshot(
      providerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProvider({
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as User);
        } else {
          setProvider(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching provider:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [providerId]);

  return { provider, isLoading, error };
}

export function useAllUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      setError('Firebase is not configured');
      return;
    }

    const usersRef = collection(db, COLLECTIONS.USERS);
    const usersQuery = query(usersRef, orderBy('displayName', 'asc'));

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as User;
        });
        setUsers(usersList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { users, isLoading, error };
}
