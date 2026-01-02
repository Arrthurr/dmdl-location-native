'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useProvider, useProviders } from '@/hooks/useProviders';
import { useSchools } from '@/hooks/useSchools';
import { Session, COLLECTIONS, formatDuration } from '@dmdl/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Edit,
  UserX,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const { provider, isLoading, error } = useProvider(providerId);
  const { deactivateProvider, activateProvider } = useProviders();
  const { schools } = useSchools();
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Fetch recent sessions for this provider
  useEffect(() => {
    if (!db || !providerId) {
      setSessionsLoading(false);
      return;
    }

    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const sessionsQuery = query(
      sessionsRef,
      where('userId', '==', providerId),
      orderBy('checkInTime', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const sessions = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            checkInTime: data.checkInTime?.toDate() || new Date(),
            checkOutTime: data.checkOutTime?.toDate(),
          } as Session;
        });
        setRecentSessions(sessions);
        setSessionsLoading(false);
      },
      (err) => {
        console.error('Error fetching sessions:', err);
        setSessionsLoading(false);
      }
    );

    return unsubscribe;
  }, [providerId]);

  const handleToggleActive = async () => {
    if (!provider) return;
    try {
      if (provider.isActive) {
        await deactivateProvider(provider.id);
      } else {
        await activateProvider(provider.id);
      }
    } catch (err) {
      console.error('Error toggling provider status:', err);
    }
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find((s) => s.id === schoolId);
    return school?.name || 'Unknown School';
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">Provider Not Found</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {error || 'The requested provider could not be found.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Provider Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {provider.photoUrl ? (
              <img
                src={provider.photoUrl}
                alt={provider.displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-bold text-xl">
                  {provider.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {provider.displayName}
              </h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {provider.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={provider.isActive ? 'success' : 'secondary'}>
                  {provider.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{provider.role}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleToggleActive}
              className="gap-2"
            >
              {provider.isActive ? (
                <>
                  <UserX className="h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
            <Link href={`/providers/${provider.id}/edit`}>
              <Button className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              {provider.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Sessions</p>
            <p className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              {recentSessions.length}+ sessions
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Entra ID</p>
            <p className="font-medium text-sm font-mono">
              {provider.entraId || 'Not linked'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No sessions recorded yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {session.schoolName || getSchoolName(session.schoolId)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.checkInTime).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                        {' at '}
                        {new Date(session.checkInTime).toLocaleTimeString(
                          'en-US',
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        session.status === 'active'
                          ? 'success'
                          : session.status === 'completed'
                          ? 'secondary'
                          : 'warning'
                      }
                    >
                      {session.status}
                    </Badge>
                    {session.durationMinutes && (
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDuration(session.durationMinutes)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
