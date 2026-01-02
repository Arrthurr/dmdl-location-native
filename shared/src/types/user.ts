export type UserRole = 'provider' | 'administrator';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  entraId: string;
  photoUrl?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  role: UserRole;
  entraId: string;
  photoUrl?: string;
  phoneNumber?: string;
}

export interface UpdateUserInput {
  displayName?: string;
  role?: UserRole;
  photoUrl?: string;
  phoneNumber?: string;
  isActive?: boolean;
}
