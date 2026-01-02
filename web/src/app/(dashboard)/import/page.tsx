'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, DEFAULT_CHECK_IN_RADIUS_METERS } from '@dmdl/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  School,
  Building2,
} from 'lucide-react';

type ImportType = 'schools' | 'providers';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>('schools');
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter((line) => line.trim());
    return lines.map((line) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setPreviewData(parsed.slice(0, 6)); // Preview first 6 rows (header + 5 data rows)
    } catch (err) {
      console.error('Error parsing file:', err);
      setPreviewData([]);
    }
  };

  const importSchools = async (rows: string[][]): Promise<ImportResult> => {
    if (!db) throw new Error('Firebase is not configured');

    const result: ImportResult = { success: 0, failed: 0, errors: [] };
    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    const nameIndex = headers.findIndex((h) => h.includes('name'));
    const addressIndex = headers.findIndex((h) => h.includes('address'));
    const latIndex = headers.findIndex(
      (h) => h.includes('lat') || h.includes('latitude')
    );
    const lngIndex = headers.findIndex(
      (h) => h.includes('lon') || h.includes('lng') || h.includes('longitude')
    );
    const radiusIndex = headers.findIndex(
      (h) => h.includes('radius') || h.includes('checkin')
    );

    if (nameIndex === -1) {
      result.errors.push('Required column "name" not found');
      return result;
    }

    const schoolsRef = collection(db, COLLECTIONS.SCHOOLS);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const name = row[nameIndex]?.trim();
        if (!name) {
          result.errors.push(`Row ${i + 2}: Missing school name`);
          result.failed++;
          continue;
        }

        const address = addressIndex >= 0 ? row[addressIndex]?.trim() || '' : '';
        const lat = latIndex >= 0 ? parseFloat(row[latIndex]) : 0;
        const lng = lngIndex >= 0 ? parseFloat(row[lngIndex]) : 0;
        const radius =
          radiusIndex >= 0
            ? parseInt(row[radiusIndex]) || DEFAULT_CHECK_IN_RADIUS_METERS
            : DEFAULT_CHECK_IN_RADIUS_METERS;

        await addDoc(schoolsRef, {
          name,
          address,
          location: new GeoPoint(lat || 0, lng || 0),
          checkInRadiusMeters: radius,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        result.success++;
      } catch (err) {
        result.errors.push(
          `Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        result.failed++;
      }
    }

    return result;
  };

  const handleImport = async () => {
    if (!file || !db) return;

    setIsImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        setResult({
          success: 0,
          failed: 0,
          errors: ['CSV file must have at least a header row and one data row'],
        });
        return;
      }

      let importResult: ImportResult;

      if (importType === 'schools') {
        importResult = await importSchools(rows);
      } else {
        // Provider import would require more logic (matching with Entra ID users)
        importResult = {
          success: 0,
          failed: 0,
          errors: [
            'Provider import is not yet implemented. Providers are created automatically when they sign in with Microsoft.',
          ],
        };
      }

      setResult(importResult);
    } catch (err) {
      console.error('Error importing:', err);
      setResult({
        success: 0,
        failed: 0,
        errors: [err instanceof Error ? err.message : 'Import failed'],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    let csvContent = '';
    let fileName = '';

    if (importType === 'schools') {
      csvContent =
        'name,address,latitude,longitude,radius\n"Example School","123 Main St, City, State 12345",37.7749,-122.4194,150';
      fileName = 'schools-template.csv';
    } else {
      csvContent =
        'email,displayName,role\njohn.doe@example.com,"John Doe",provider';
      fileName = 'providers-template.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
        <p className="text-gray-600 mt-1">
          Import schools and providers from CSV files
        </p>
      </div>

      {/* Import Type Selection */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            setImportType('schools');
            setFile(null);
            setPreviewData([]);
            setResult(null);
          }}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
            importType === 'schools'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Building2
            className={`h-6 w-6 ${
              importType === 'schools' ? 'text-blue-600' : 'text-gray-400'
            }`}
          />
          <div className="text-left">
            <p
              className={`font-medium ${
                importType === 'schools' ? 'text-blue-900' : 'text-gray-900'
              }`}
            >
              Schools
            </p>
            <p className="text-sm text-gray-500">
              Import school locations
            </p>
          </div>
        </button>
        <button
          onClick={() => {
            setImportType('providers');
            setFile(null);
            setPreviewData([]);
            setResult(null);
          }}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
            importType === 'providers'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <School
            className={`h-6 w-6 ${
              importType === 'providers' ? 'text-blue-600' : 'text-gray-400'
            }`}
          />
          <div className="text-left">
            <p
              className={`font-medium ${
                importType === 'providers' ? 'text-blue-900' : 'text-gray-900'
              }`}
            >
              Providers
            </p>
            <p className="text-sm text-gray-500">
              Import provider data
            </p>
          </div>
        </button>
      </div>

      {/* Import Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import {importType === 'schools' ? 'Schools' : 'Providers'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">CSV Template</p>
              <p className="text-sm text-gray-500">
                Download a template to see the required format
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label
              htmlFor="file-upload"
              className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            >
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="font-medium text-gray-900">
                {file ? file.name : 'Click to upload a CSV file'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : 'or drag and drop'}
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-gray-900">Preview</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {previewData[0].map((header, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left font-medium text-gray-700 border"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(1).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 border text-gray-600">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500">
                Showing first {Math.min(5, previewData.length - 1)} rows
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.errors.length > 0 && result.success === 0
                  ? 'bg-red-50 border border-red-200'
                  : result.errors.length > 0
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {result.success > 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <p className="font-medium">
                  {result.success} imported successfully
                  {result.failed > 0 && `, ${result.failed} failed`}
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-gray-700">Errors:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import {importType === 'schools' ? 'Schools' : 'Providers'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Format Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            {importType === 'schools' ? 'Schools' : 'Providers'} CSV Format
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importType === 'schools' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Required and optional columns for school import:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                    Required
                  </span>
                  <span className="font-mono">name</span> - School name
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    Optional
                  </span>
                  <span className="font-mono">address</span> - Full address
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    Optional
                  </span>
                  <span className="font-mono">latitude</span> - Location
                  latitude
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    Optional
                  </span>
                  <span className="font-mono">longitude</span> - Location
                  longitude
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    Optional
                  </span>
                  <span className="font-mono">radius</span> - Check-in radius in
                  meters (default: 150)
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    Provider accounts are created automatically when users sign
                    in with Microsoft. Manual import is not yet supported.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
