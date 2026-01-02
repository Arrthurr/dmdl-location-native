'use client';

import { useState, useMemo } from 'react';
import { useSchedules } from '@/hooks/useSchedules';
import { useProviders } from '@/hooks/useProviders';
import { useSchools } from '@/hooks/useSchools';
import { DAYS_OF_WEEK, DayOfWeek } from '@dmdl/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';

export default function SchedulesPage() {
  const { schedules, isLoading, error, addSchedule, deleteSchedule } =
    useSchedules();
  const { providers } = useProviders();
  const { schools } = useSchools();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [newSchedule, setNewSchedule] = useState({
    providerId: '',
    schoolId: '',
    dayOfWeek: 'monday' as DayOfWeek,
    startTime: '09:00',
    endTime: '17:00',
  });
  const [isAdding, setIsAdding] = useState(false);

  const filteredSchedules = useMemo(() => {
    let filtered = schedules;

    if (filterProvider) {
      filtered = filtered.filter((s) => s.providerId === filterProvider);
    }

    if (filterSchool) {
      filtered = filtered.filter((s) => s.schoolId === filterSchool);
    }

    return filtered;
  }, [schedules, filterProvider, filterSchool]);

  // Group schedules by day of week
  const schedulesByDay = useMemo(() => {
    const grouped: Record<string, typeof filteredSchedules> = {};
    DAYS_OF_WEEK.forEach((day) => {
      grouped[day] = filteredSchedules.filter((s) => s.dayOfWeek === day);
    });
    return grouped;
  }, [filteredSchedules]);

  const getProviderName = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.displayName || 'Unknown Provider';
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find((s) => s.id === schoolId);
    return school?.name || 'Unknown School';
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.providerId || !newSchedule.schoolId) return;

    setIsAdding(true);
    try {
      await addSchedule({
        providerId: newSchedule.providerId,
        schoolId: newSchedule.schoolId,
        dayOfWeek: newSchedule.dayOfWeek,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        providerName: getProviderName(newSchedule.providerId),
        schoolName: getSchoolName(newSchedule.schoolId),
      });
      setShowAddModal(false);
      setNewSchedule({
        providerId: '',
        schoolId: '',
        dayOfWeek: 'monday' as DayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
      });
    } catch (err) {
      console.error('Error adding schedule:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule slot?')) return;
    try {
      await deleteSchedule(scheduleId);
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
          <p className="text-gray-600 mt-1">Manage provider schedules</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
          <p className="text-gray-600 mt-1">
            Manage provider schedules and school assignments
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Schedule
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={filterProvider}
          onChange={(e) => setFilterProvider(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Providers</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.displayName}
            </option>
          ))}
        </select>
        <select
          value={filterSchool}
          onChange={(e) => setFilterSchool(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Schools</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      {/* Schedule Grid */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => (
            <Card key={day}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {schedulesByDay[day].length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No schedules</p>
                ) : (
                  schedulesByDay[day].map((schedule) => (
                    <div
                      key={schedule.id}
                      className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs group relative"
                    >
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="absolute top-1 right-1 p-1 bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                      >
                        <X className="h-3 w-3 text-red-600" />
                      </button>
                      <p className="font-medium text-blue-900 truncate pr-6">
                        {schedule.providerName ||
                          getProviderName(schedule.providerId)}
                      </p>
                      <p className="text-blue-700 truncate">
                        {schedule.schoolName || getSchoolName(schedule.schoolId)}
                      </p>
                      <p className="text-blue-600 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-gray-500">
        Total: {filteredSchedules.length} schedule slots
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Schedule Slot</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Provider *</Label>
                <select
                  value={newSchedule.providerId}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, providerId: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a provider</option>
                  {providers
                    .filter((p) => p.isActive)
                    .map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>School *</Label>
                <select
                  value={newSchedule.schoolId}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, schoolId: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a school</option>
                  {schools
                    .filter((s) => s.isActive)
                    .map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Day of Week *</Label>
                <select
                  value={newSchedule.dayOfWeek}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, dayOfWeek: e.target.value as DayOfWeek })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSchedule}
                  disabled={
                    isAdding ||
                    !newSchedule.providerId ||
                    !newSchedule.schoolId
                  }
                  className="flex-1"
                >
                  {isAdding ? 'Adding...' : 'Add Schedule'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
