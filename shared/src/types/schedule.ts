import { GeoPoint } from './school';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ScheduleSlot {
  id: string;
  providerId: string;
  schoolId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM" 24-hour format
  endTime: string;   // "HH:MM" 24-hour format
  effectiveFrom: Date;
  effectiveUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  // Denormalized fields for display
  providerName?: string;
  schoolName?: string;
}

export interface CreateScheduleSlotInput {
  providerId: string;
  schoolId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  effectiveFrom: Date;
  effectiveUntil?: Date;
}

export interface UpdateScheduleSlotInput {
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  isActive?: boolean;
}

export interface ProviderAssignment {
  id: string;
  providerId: string;
  schoolId: string;
  schoolName: string;
  schoolAddress: string;
  schoolLocation: GeoPoint;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssignmentInput {
  providerId: string;
  schoolId: string;
}
