'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProviders } from '@/hooks/useProviders';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, MoreVertical, Mail, AlertCircle } from 'lucide-react';

export default function ProvidersPage() {
  const { providers, isLoading, error, deactivateProvider, activateProvider } =
    useProviders();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredProviders = useMemo(() => {
    let filtered = providers;

    if (!showInactive) {
      filtered = filtered.filter((p) => p.isActive);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.displayName.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [providers, searchQuery, showInactive]);

  const handleToggleActive = async (providerId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateProvider(providerId);
      } else {
        await activateProvider(providerId);
      }
    } catch (err) {
      console.error('Error toggling provider status:', err);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
          <p className="text-gray-600 mt-1">Manage service providers</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
          <p className="text-gray-600 mt-1">
            Manage service providers and their assignments
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
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

      {/* Providers List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No providers found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Providers will appear here when they sign in'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredProviders.map((provider) => (
              <Link
                key={provider.id}
                href={`/providers/${provider.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {provider.photoUrl ? (
                      <img
                        src={provider.photoUrl}
                        alt={provider.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-medium">
                          {provider.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        provider.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {provider.displayName}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {provider.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={provider.isActive ? 'success' : 'secondary'}>
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleActive(provider.id, provider.isActive);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        Showing {filteredProviders.length} of {providers.length} providers
      </div>
    </div>
  );
}
