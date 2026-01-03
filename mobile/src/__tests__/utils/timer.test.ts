// Test the elapsed time calculation logic used in SessionTimer

describe('SessionTimer elapsed calculation', () => {
  const calculateElapsed = (startTime: Date, now: number = Date.now()) => {
    const start = startTime.getTime();
    const diff = Math.floor((now - start) / 1000);

    return {
      hours: Math.floor(diff / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
    };
  };

  it('should calculate 0 elapsed for same time', () => {
    const now = Date.now();
    const startTime = new Date(now);
    const elapsed = calculateElapsed(startTime, now);

    expect(elapsed).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  it('should calculate seconds correctly', () => {
    const now = Date.now();
    const startTime = new Date(now - 45000); // 45 seconds ago
    const elapsed = calculateElapsed(startTime, now);

    expect(elapsed).toEqual({ hours: 0, minutes: 0, seconds: 45 });
  });

  it('should calculate minutes correctly', () => {
    const now = Date.now();
    const startTime = new Date(now - 5 * 60 * 1000); // 5 minutes ago
    const elapsed = calculateElapsed(startTime, now);

    expect(elapsed).toEqual({ hours: 0, minutes: 5, seconds: 0 });
  });

  it('should calculate hours correctly', () => {
    const now = Date.now();
    const startTime = new Date(now - 2 * 60 * 60 * 1000); // 2 hours ago
    const elapsed = calculateElapsed(startTime, now);

    expect(elapsed).toEqual({ hours: 2, minutes: 0, seconds: 0 });
  });

  it('should calculate combined time correctly', () => {
    const now = Date.now();
    // 1 hour, 30 minutes, 45 seconds ago
    const startTime = new Date(now - (1 * 3600 + 30 * 60 + 45) * 1000);
    const elapsed = calculateElapsed(startTime, now);

    expect(elapsed).toEqual({ hours: 1, minutes: 30, seconds: 45 });
  });

  it('should handle long sessions (12+ hours)', () => {
    const now = Date.now();
    const startTime = new Date(now - 12.5 * 60 * 60 * 1000); // 12.5 hours ago
    const elapsed = calculateElapsed(startTime, now);

    expect(elapsed.hours).toBe(12);
    expect(elapsed.minutes).toBe(30);
    expect(elapsed.seconds).toBe(0);
  });
});

describe('formatNumber (pad with zeros)', () => {
  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  it('should pad single digits with leading zero', () => {
    expect(formatNumber(0)).toBe('00');
    expect(formatNumber(5)).toBe('05');
    expect(formatNumber(9)).toBe('09');
  });

  it('should not pad double digits', () => {
    expect(formatNumber(10)).toBe('10');
    expect(formatNumber(59)).toBe('59');
  });

  it('should handle numbers over 99', () => {
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(999)).toBe('999');
  });
});
