export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface School {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  location: GeoPoint;
  geohash?: string;
  checkInRadiusMeters: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateSchoolInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  location: GeoPoint;
  checkInRadiusMeters?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface UpdateSchoolInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  location?: GeoPoint;
  checkInRadiusMeters?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  isActive?: boolean;
}
