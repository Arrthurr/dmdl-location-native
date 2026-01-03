import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SchoolCard } from '@/components/SchoolCard';
import { School, GeoPoint } from '@dmdl/shared';

describe('SchoolCard', () => {
  const mockSchool: School = {
    id: 'school-1',
    name: 'Lincoln Elementary School',
    address: '123 Main St, New York, NY 10001',
    location: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    checkInRadiusMeters: 150,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('should render school name', () => {
    render(
      <SchoolCard school={mockSchool} userLocation={null} onPress={mockOnPress} />
    );

    expect(screen.getByText('Lincoln Elementary School')).toBeTruthy();
  });

  it('should render school address', () => {
    render(
      <SchoolCard school={mockSchool} userLocation={null} onPress={mockOnPress} />
    );

    expect(screen.getByText('123 Main St, New York, NY 10001')).toBeTruthy();
  });

  it('should show "Location unavailable" when no user location', () => {
    render(
      <SchoolCard school={mockSchool} userLocation={null} onPress={mockOnPress} />
    );

    expect(screen.getByText('Location unavailable')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    render(
      <SchoolCard school={mockSchool} userLocation={null} onPress={mockOnPress} />
    );

    const card = screen.getByText('Lincoln Elementary School');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  describe('with user location', () => {
    it('should show "In range" when user is within radius', () => {
      // User at same location as school (0m away)
      const userLocation: GeoPoint = {
        latitude: 40.7128,
        longitude: -74.006,
      };

      render(
        <SchoolCard
          school={mockSchool}
          userLocation={userLocation}
          onPress={mockOnPress}
        />
      );

      expect(screen.getByText('In range')).toBeTruthy();
    });

    it('should show distance when user is outside radius', () => {
      // User about 500m away
      const userLocation: GeoPoint = {
        latitude: 40.717,
        longitude: -74.006,
      };

      render(
        <SchoolCard
          school={mockSchool}
          userLocation={userLocation}
          onPress={mockOnPress}
        />
      );

      // Should show a distance measurement (not "In range")
      expect(screen.queryByText('In range')).toBeNull();
      // Should show distance in meters or km
      expect(
        screen.queryByText(/\d+m/) || screen.queryByText(/\d+\.\d+km/)
      ).toBeTruthy();
    });

    it('should show "In range" at exactly the boundary', () => {
      // User at approximately 100m away (within 150m radius)
      const userLocation: GeoPoint = {
        latitude: 40.7137, // ~100m north
        longitude: -74.006,
      };

      render(
        <SchoolCard
          school={mockSchool}
          userLocation={userLocation}
          onPress={mockOnPress}
        />
      );

      expect(screen.getByText('In range')).toBeTruthy();
    });
  });
});
