'use client';

import { useState } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { useProviders } from '@/hooks/useProviders';
import { useSchools } from '@/hooks/useSchools';
import { formatDuration } from '@dmdl/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';

export default function SessionsPage() {
  const [filterProvider, setFilterProvider] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { providers } = useProviders();
  const { schools } = useSchools();

  const { sessions, isLoading, error } = useSessions({
    providerId: filterProvider || undefined,
    schoolId: filterSchool || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate + 'T23:59:59') : undefined,
    pageSize: 100,
  });

  const getProviderName = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.displayName || 'Unknown Provider';
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find((s) => s.id === schoolId);
    return school?.name || 'Unknown School';
  };

  const clearFilters = () => {
    setFilterProvider('');
    setFilterSchool('');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    filterProvider || filterSchool || filterStatus !== 'all' || startDate || endDate;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-600 mt-1">View check-in/out history</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">
                Firebase Configuration Required
              </h3>
              <p className="text-sm text-yellow-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-600 mt-1">
            View and filter check-in/out history
          </p>
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              Active
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Providers</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>School</Label>
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="auto_completed">Auto Completed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No sessions found</p>
            <p className="text-sm text-gray-400 mt-1">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Sessions will appear here when providers check in'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        session.status === 'active'
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          session.status === 'active'
                            ? 'text-green-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {session.userDisplayName?.charAt(0).toUpperCase() ||
                          getProviderName(session.userId).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {session.status === 'active' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.userDisplayName ||
                        getProviderName(session.userId)}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.schoolName || getSchoolName(session.schoolId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-900 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {new Date(session.checkInTime).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(session.checkInTime).toLocaleTimeString(
                        'en-US',
                        {
                          hour: 'numeric',
                          minute: '2-digit',
                        }
                      )}
                      {session.checkOutTime && (
                        <>
                          {' - '}
                          {new Date(session.checkOutTime).toLocaleTimeString(
                            'en-US',
                            {
                              hour: 'numeric',
                              minute: '2-digit',
                            }
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <Badge
                      variant={
                        session.status === 'active'
                          ? 'success'
                          : session.status === 'completed'
                          ? 'secondary'
                          : 'warning'
                      }
                    >
                      {session.status === 'auto_completed'
                        ? 'Auto'
                        : session.status}
                    </Badge>
                    {session.durationMinutes !== undefined && (
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDuration(session.durationMinutes)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        Showing {sessions.length} sessions
      </div>
    </div>
  );
}
