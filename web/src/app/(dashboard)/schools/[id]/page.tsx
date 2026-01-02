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
import { useSchool, useSchools } from '@/hooks/useSchools';
import { Session, COLLECTIONS, formatDuration } from '@dmdl/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Edit,
  Building2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;

  const { school, isLoading, error } = useSchool(schoolId);
  const { deactivateSchool, updateSchool } = useSchools();
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Fetch recent sessions for this school
  useEffect(() => {
    if (!db || !schoolId) {
      setSessionsLoading(false);
      return;
    }

    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const sessionsQuery = query(
      sessionsRef,
      where('schoolId', '==', schoolId),
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
  }, [schoolId]);

  const handleToggleActive = async () => {
    if (!school) return;
    try {
      if (school.isActive) {
        await deactivateSchool(school.id);
      } else {
        await updateSchool(school.id, { isActive: true });
      }
    } catch (err) {
      console.error('Error toggling school status:', err);
    }
  };

  const getGoogleMapsUrl = () => {
    if (!school) return '#';
    return `https://www.google.com/maps/search/?api=1&query=${school.location.latitude},${school.location.longitude}`;
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  if (error || !school) {
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
              <h3 className="font-medium text-yellow-800">School Not Found</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {error || 'The requested school could not be found.'}
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

      {/* School Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                {school.address}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={school.isActive ? 'success' : 'secondary'}>
                  {school.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  View on Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleToggleActive}>
              {school.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Link href={`/schools/${school.id}/edit`}>
              <Button className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500">Coordinates</p>
            <p className="font-medium font-mono text-sm">
              {school.location.latitude.toFixed(6)},{' '}
              {school.location.longitude.toFixed(6)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Check-in Radius</p>
            <p className="font-medium">{school.checkInRadiusMeters} meters</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              {school.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
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
              No sessions recorded at this school yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-medium text-sm">
                        {session.userDisplayName?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{session.userDisplayName}</p>
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
