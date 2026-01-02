'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSchools } from '@/hooks/useSchools';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, MapPin, Plus, AlertCircle } from 'lucide-react';

export default function SchoolsPage() {
  const { schools, isLoading, error, deactivateSchool: _deactivateSchool } = useSchools();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredSchools = useMemo(() => {
    let filtered = schools;

    if (!showInactive) {
      filtered = filtered.filter((s) => s.isActive);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [schools, searchQuery, showInactive]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="text-gray-600 mt-1">Manage school locations</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="text-gray-600 mt-1">
            Manage school locations for provider check-ins
          </p>
        </div>
        <Link href="/schools/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add School
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show inactive
        </label>
      </div>

      {/* Schools Grid */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No schools found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Add your first school to get started'}
          </p>
          {!searchQuery && (
            <Link href="/schools/new">
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add School
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchools.map((school) => (
            <Link
              key={school.id}
              href={`/schools/${school.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant={school.isActive ? 'success' : 'secondary'}>
                  {school.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{school.name}</h3>
              <p className="text-sm text-gray-500 flex items-start gap-1 mb-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{school.address}</span>
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t">
                <span>
                  Radius: {school.checkInRadiusMeters}m
                </span>
                <span>
                  {school.location.latitude.toFixed(4)},{' '}
                  {school.location.longitude.toFixed(4)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-gray-500">
        Showing {filteredSchools.length} of {schools.length} schools
      </div>
    </div>
  );
}
