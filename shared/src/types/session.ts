import { GeoPoint } from './school';
import { UserRole } from './user';

export type SessionStatus = 'active' | 'completed' | 'auto_completed' | 'cancelled';

export type DevicePlatform = 'ios' | 'android' | 'web';

export interface DeviceInfo {
  platform: DevicePlatform;
  deviceId?: string;
  appVersion?: string;
}

export interface Session {
  id: string;
  userId: string;
  userRole: UserRole;
  userDisplayName: string;
  schoolId: string;
  schoolName: string;
  scheduleId?: string;
  checkInTime: Date;
  checkInLocation: GeoPoint;
  checkInDistanceMeters: number;
  checkOutTime?: Date;
  checkOutLocation?: GeoPoint;
  checkOutDistanceMeters?: number;
  status: SessionStatus;
  durationMinutes?: number;
  notes?: string;
  notesUpdatedAt?: Date;
  deviceInfo?: DeviceInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckInInput {
  schoolId: string;
  location: GeoPoint;
  deviceInfo?: DeviceInfo;
}

export interface CheckOutInput {
  sessionId: string;
  location: GeoPoint;
}

export interface UpdateSessionNotesInput {
  sessionId: string;
  notes: string;
}

export interface LocationCheck {
  id: string;
  sessionId: string;
  userId: string;
  location: GeoPoint;
  distanceFromSchoolMeters: number;
  timestamp: Date;
  isWithinRadius: boolean;
}

export interface SessionFilters {
  startDate?: Date;
  endDate?: Date;
  providerIds?: string[];
  schoolIds?: string[];
  status?: SessionStatus[];
}
