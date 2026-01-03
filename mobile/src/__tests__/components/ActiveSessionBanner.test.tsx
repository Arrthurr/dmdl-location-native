import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActiveSessionBanner } from '@/components/ActiveSessionBanner';
import { Session } from '@dmdl/shared';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (path: string) => mockPush(path),
  },
}));

describe('ActiveSessionBanner', () => {
  const mockSession: Session = {
    id: 'session-1',
    userId: 'user-1',
    userRole: 'provider',
    userDisplayName: 'John Doe',
    schoolId: 'school-1',
    schoolName: 'Lincoln Elementary',
    scheduleId: 'schedule-1',
    checkInTime: new Date(),
    checkInLocation: { latitude: 40.7128, longitude: -74.006 },
    checkInDistanceMeters: 50,
    status: 'active',
    deviceInfo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  it('should render school name', () => {
    render(<ActiveSessionBanner session={mockSession} />);

    expect(screen.getByText('Lincoln Elementary')).toBeTruthy();
  });

  it('should render "Currently checked in at" label', () => {
    render(<ActiveSessionBanner session={mockSession} />);

    expect(screen.getByText('Currently checked in at')).toBeTruthy();
  });

  it('should display elapsed time for recent session', () => {
    const recentSession = {
      ...mockSession,
      checkInTime: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    };

    render(<ActiveSessionBanner session={recentSession} />);

    // Should show "5m" for 5 minutes
    expect(screen.getByText('5m')).toBeTruthy();
  });

  it('should display elapsed time for longer session', () => {
    const longerSession = {
      ...mockSession,
      checkInTime: new Date(Date.now() - 90 * 60000), // 90 minutes ago
    };

    render(<ActiveSessionBanner session={longerSession} />);

    // Should show "1h 30m"
    expect(screen.getByText('1h 30m')).toBeTruthy();
  });

  it('should navigate to school page when pressed', () => {
    render(<ActiveSessionBanner session={mockSession} />);

    const banner = screen.getByText('Lincoln Elementary');
    fireEvent.press(banner);

    expect(mockPush).toHaveBeenCalledWith('/school/school-1');
  });

  it('should show 0m for just-started session', () => {
    render(<ActiveSessionBanner session={mockSession} />);

    expect(screen.getByText('0m')).toBeTruthy();
  });
});
