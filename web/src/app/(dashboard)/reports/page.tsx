'use client';

import { useState, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useProviders } from '@/hooks/useProviders';
import { useSchools } from '@/hooks/useSchools';
import { Session, COLLECTIONS, formatDuration } from '@dmdl/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export default function ReportsPage() {
  const { providers } = useProviders();
  const { schools } = useSchools();

  const [filterProvider, setFilterProvider] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const getProviderName = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.displayName || 'Unknown';
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find((s) => s.id === schoolId);
    return school?.name || 'Unknown';
  };

  const generateCSV = (sessions: Session[]): string => {
    const headers = [
      'Session ID',
      'Provider Name',
      'Provider Email',
      'School Name',
      'Check-in Date',
      'Check-in Time',
      'Check-out Date',
      'Check-out Time',
      'Duration (minutes)',
      'Duration (formatted)',
      'Status',
      'Notes',
    ];

    const rows = sessions.map((session) => {
      const checkInDate = new Date(session.checkInTime);
      const checkOutDate = session.checkOutTime
        ? new Date(session.checkOutTime)
        : null;

      const provider = providers.find((p) => p.id === session.userId);

      return [
        session.id,
        session.userDisplayName || getProviderName(session.userId),
        provider?.email || '',
        session.schoolName || getSchoolName(session.schoolId),
        checkInDate.toLocaleDateString('en-US'),
        checkInDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        checkOutDate?.toLocaleDateString('en-US') || '',
        checkOutDate?.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }) || '',
        session.durationMinutes?.toString() || '',
        session.durationMinutes
          ? formatDuration(session.durationMinutes)
          : '',
        session.status,
        session.notes || '',
      ];
    });

    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    return csvContent;
  };

  const handleExport = useCallback(async () => {
    if (!db) {
      setExportResult({
        success: false,
        message: 'Firebase is not configured',
      });
      return;
    }

    if (!startDate || !endDate) {
      setExportResult({
        success: false,
        message: 'Please select both start and end dates',
      });
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
      const constraints: any[] = [
        where('checkInTime', '>=', Timestamp.fromDate(new Date(startDate))),
        where(
          'checkInTime',
          '<=',
          Timestamp.fromDate(new Date(endDate + 'T23:59:59'))
        ),
        orderBy('checkInTime', 'desc'),
      ];

      if (filterProvider) {
        constraints.unshift(where('userId', '==', filterProvider));
      }

      if (filterSchool) {
        constraints.unshift(where('schoolId', '==', filterSchool));
      }

      const sessionsQuery = query(sessionsRef, ...constraints);
      const snapshot = await getDocs(sessionsQuery);

      const sessions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          checkInTime: data.checkInTime?.toDate() || new Date(),
          checkOutTime: data.checkOutTime?.toDate(),
        } as Session;
      });

      if (sessions.length === 0) {
        setExportResult({
          success: false,
          message: 'No sessions found for the selected criteria',
        });
        return;
      }

      const csvContent = generateCSV(sessions);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const fileName = `sessions-report-${startDate}-to-${endDate}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportResult({
        success: true,
        message: `Successfully exported ${sessions.length} sessions to ${fileName}`,
      });
    } catch (err) {
      console.error('Error exporting sessions:', err);
      setExportResult({
        success: false,
        message:
          err instanceof Error ? err.message : 'Failed to export sessions',
      });
    } finally {
      setIsExporting(false);
    }
  }, [startDate, endDate, filterProvider, filterSchool, providers, schools]);

  // Set default date range to current month
  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  const setLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  const setThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - dayOfWeek);
    const lastDay = new Date(now);
    lastDay.setDate(now.getDate() + (6 - dayOfWeek));
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">
          Export session data for reporting and compliance
        </p>
      </div>

      {/* Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={setThisWeek}>
              This Week
            </Button>
            <Button variant="outline" size="sm" onClick={setThisMonth}>
              This Month
            </Button>
            <Button variant="outline" size="sm" onClick={setLastMonth}>
              Last Month
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Provider (optional)</Label>
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
              <Label>School (optional)</Label>
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
          </div>

          {/* Export Result */}
          {exportResult && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg ${
                exportResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {exportResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <p
                className={`text-sm ${
                  exportResult.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {exportResult.message}
              </p>
            </div>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting || !startDate || !endDate}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export to CSV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Info */}
      <Card>
        <CardHeader>
          <CardTitle>Report Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            The exported CSV will contain the following columns:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Session ID
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Provider Name
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Provider Email
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              School Name
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Check-in Date & Time
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Check-out Date & Time
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Duration (minutes & formatted)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Session Status
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Session Notes
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
