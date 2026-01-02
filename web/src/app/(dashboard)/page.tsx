'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session, COLLECTIONS, formatDuration } from '@dmdl/shared';
import { Activity, AlertCircle } from 'lucide-react';

interface StatsCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

export default function DashboardPage() {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [todaySessionCount, setTodaySessionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    // Subscribe to active sessions
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const activeQuery = query(
      sessionsRef,
      where('status', '==', 'active'),
      orderBy('checkInTime', 'desc'),
      limit(20)
    );

    const unsubscribeActive = onSnapshot(
      activeQuery,
      (snapshot) => {
        const sessions = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            checkInTime: data.checkInTime?.toDate() || new Date(),
          } as Session;
        });
        setActiveSessions(sessions);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching active sessions:', error);
        setIsLoading(false);
      }
    );

    // Get today's session count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayQuery = query(
      sessionsRef,
      where('checkInTime', '>=', Timestamp.fromDate(today)),
      orderBy('checkInTime', 'desc')
    );

    const unsubscribeToday = onSnapshot(
      todayQuery,
      (snapshot) => {
        setTodaySessionCount(snapshot.docs.length);
      },
      (error) => {
        console.error('Error fetching today sessions:', error);
      }
    );

    return () => {
      unsubscribeActive();
      unsubscribeToday();
    };
  }, []);

  // Show configuration warning if Firebase is not set up
  if (!db) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of provider check-ins and activity
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">
                Firebase Configuration Required
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please set up your Firebase environment variables to enable the
                dashboard. Create a .env.local file with your Firebase
                credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats: StatsCard[] = [
    {
      title: 'Active Sessions',
      value: activeSessions.length,
      icon: <Activity className="h-5 w-5 text-green-600" />,
      description: 'Providers currently checked in',
    },
    {
      title: "Today's Sessions",
      value: todaySessionCount,
      icon: <Activity className="h-5 w-5 text-blue-600" />,
      description: 'Total check-ins today',
    },
  ];

  const calculateElapsedMinutes = (checkInTime: Date) => {
    return Math.floor((Date.now() - checkInTime.getTime()) / 60000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of provider check-ins and activity
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">{stat.icon}</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Active Sessions
          </h2>
          <p className="text-sm text-gray-600">
            Providers currently checked in at schools
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active sessions</p>
            <p className="text-sm text-gray-400 mt-1">
              Check-ins will appear here in real-time
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-medium">
                        {session.userDisplayName?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.userDisplayName}
                    </p>
                    <p className="text-sm text-gray-500">{session.schoolName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    {formatDuration(calculateElapsedMinutes(new Date(session.checkInTime)))}
                  </p>
                  <p className="text-xs text-gray-500">
                    Since{' '}
                    {new Date(session.checkInTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
