'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSchool, useSchools } from '@/hooks/useSchools';
import { DEFAULT_CHECK_IN_RADIUS_METERS } from '@dmdl/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, MapPin, AlertCircle } from 'lucide-react';

export default function EditSchoolPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;

  const { school, isLoading, error } = useSchool(schoolId);
  const { updateSchool } = useSchools();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    checkInRadiusMeters: DEFAULT_CHECK_IN_RADIUS_METERS.toString(),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name,
        address: school.address,
        latitude: school.location.latitude.toString(),
        longitude: school.location.longitude.toString(),
        checkInRadiusMeters: school.checkInRadiusMeters.toString(),
      });
    }
  }, [school]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      const radius = parseInt(formData.checkInRadiusMeters);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Please enter valid latitude and longitude values');
      }

      if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }

      if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      await updateSchool(schoolId, {
        name: formData.name,
        address: formData.address,
        location: {
          latitude: lat,
          longitude: lng,
        },
        checkInRadiusMeters: radius || DEFAULT_CHECK_IN_RADIUS_METERS,
      });

      router.push(`/schools/${schoolId}`);
    } catch (err) {
      console.error('Error updating school:', err);
      setSaveError(
        err instanceof Error ? err.message : 'Failed to update school. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit School</h1>
          <p className="text-gray-600">Update school information</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{saveError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              You can find coordinates by searching for the address on Google
              Maps
            </p>

            <div className="space-y-2">
              <Label htmlFor="radius">Check-in Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                value={formData.checkInRadiusMeters}
                onChange={(e) =>
                  setFormData({ ...formData, checkInRadiusMeters: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                Providers must be within this distance to check in.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
