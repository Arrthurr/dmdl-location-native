import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { SessionTimer } from '@/components/SessionTimer';

describe('SessionTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render session in progress label', () => {
    const startTime = new Date();
    render(<SessionTimer startTime={startTime} schoolName="Test School" />);

    expect(screen.getByText('Session in progress')).toBeTruthy();
  });

  it('should render school name', () => {
    const startTime = new Date();
    render(<SessionTimer startTime={startTime} schoolName="Lincoln Elementary" />);

    expect(screen.getByText('Lincoln Elementary')).toBeTruthy();
  });

  it('should display initial time as 00:00:00', () => {
    const startTime = new Date();
    render(<SessionTimer startTime={startTime} schoolName="Test School" />);

    // All three values should be "00" at start - use getAllByText
    const zeroElements = screen.getAllByText('00');
    expect(zeroElements.length).toBe(3); // hours, minutes, seconds
  });

  it('should display time unit labels', () => {
    const startTime = new Date();
    render(<SessionTimer startTime={startTime} schoolName="Test School" />);

    expect(screen.getByText('hours')).toBeTruthy();
    expect(screen.getByText('min')).toBeTruthy();
    expect(screen.getByText('sec')).toBeTruthy();
  });

  it('should update time after interval', () => {
    const startTime = new Date(Date.now() - 65000); // 65 seconds ago
    render(<SessionTimer startTime={startTime} schoolName="Test School" />);

    // Should show 01 for minutes and 05 for seconds
    expect(screen.getByText('01')).toBeTruthy();
    expect(screen.getByText('05')).toBeTruthy();
  });

  it('should display hours for longer sessions', () => {
    // 2 hours, 30 minutes, 15 seconds ago
    const elapsed = 2 * 3600 + 30 * 60 + 15;
    const startTime = new Date(Date.now() - elapsed * 1000);

    render(<SessionTimer startTime={startTime} schoolName="Test School" />);

    expect(screen.getByText('02')).toBeTruthy(); // hours
    expect(screen.getByText('30')).toBeTruthy(); // minutes
    expect(screen.getByText('15')).toBeTruthy(); // seconds
  });

  it('should increment timer when time passes', async () => {
    const startTime = new Date();
    render(<SessionTimer startTime={startTime} schoolName="Test School" />);

    // Advance timers by 5 seconds
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    // Should now show 05 seconds
    expect(screen.getByText('05')).toBeTruthy();
  });
});
