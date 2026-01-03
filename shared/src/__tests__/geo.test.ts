import {
  calculateDistance,
  calculateDistanceBetweenPoints,
  isWithinRadius,
  isWithinSchoolRadius,
  generateGeohash,
  formatDistance,
} from '../utils/geo';
import { CHECK_IN_RADIUS_METERS } from '../constants';

describe('calculateDistance', () => {
  it('should return 0 for identical coordinates', () => {
    const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
    expect(distance).toBe(0);
  });

  it('should calculate distance between two known points', () => {
    // Empire State Building to Statue of Liberty: ~8.3km
    const empireLat = 40.7484;
    const empireLon = -73.9857;
    const statueLat = 40.6892;
    const statueLon = -74.0445;

    const distance = calculateDistance(empireLat, empireLon, statueLat, statueLon);
    // Allow 5% tolerance for Haversine approximation
    expect(distance).toBeGreaterThan(7900);
    expect(distance).toBeLessThan(8700);
  });

  it('should calculate short distances accurately', () => {
    // Two points ~100m apart
    const lat1 = 40.7128;
    const lon1 = -74.006;
    const lat2 = 40.7137; // ~100m north
    const lon2 = -74.006;

    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
  });

  it('should be symmetric (A to B equals B to A)', () => {
    const lat1 = 40.7128;
    const lon1 = -74.006;
    const lat2 = 40.7484;
    const lon2 = -73.9857;

    const distanceAB = calculateDistance(lat1, lon1, lat2, lon2);
    const distanceBA = calculateDistance(lat2, lon2, lat1, lon1);

    expect(distanceAB).toBeCloseTo(distanceBA, 10);
  });

  it('should handle coordinates near the equator', () => {
    // Two points on the equator ~111km apart (1 degree of longitude)
    const distance = calculateDistance(0, 0, 0, 1);
    expect(distance).toBeGreaterThan(110000);
    expect(distance).toBeLessThan(112000);
  });

  it('should handle coordinates near the poles', () => {
    // Near north pole - longitude differences have less effect
    const distance = calculateDistance(89, 0, 89, 90);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(200000); // Much smaller than at equator
  });

  it('should handle negative coordinates', () => {
    // Southern hemisphere
    const distance = calculateDistance(-33.8688, 151.2093, -33.9, 151.2);
    expect(distance).toBeGreaterThan(0);
  });

  it('should handle crossing the antimeridian', () => {
    // Points on either side of the 180th meridian
    const distance = calculateDistance(0, 179.9, 0, -179.9);
    // Should be ~22km, not ~40,000km going the wrong way
    expect(distance).toBeLessThan(30000);
  });
});

describe('calculateDistanceBetweenPoints', () => {
  it('should calculate distance using GeoPoint objects', () => {
    const point1 = { latitude: 40.7128, longitude: -74.006 };
    const point2 = { latitude: 40.7484, longitude: -73.9857 };

    const distance = calculateDistanceBetweenPoints(point1, point2);
    expect(distance).toBeGreaterThan(3500);
    expect(distance).toBeLessThan(4500);
  });

  it('should return 0 for identical points', () => {
    const point = { latitude: 40.7128, longitude: -74.006 };
    expect(calculateDistanceBetweenPoints(point, point)).toBe(0);
  });
});

describe('isWithinRadius', () => {
  it('should return true when distance is within radius', () => {
    expect(isWithinRadius(100, 150)).toBe(true);
    expect(isWithinRadius(149, 150)).toBe(true);
  });

  it('should return true when distance equals radius (boundary)', () => {
    expect(isWithinRadius(150, 150)).toBe(true);
  });

  it('should return false when distance exceeds radius', () => {
    expect(isWithinRadius(151, 150)).toBe(false);
    expect(isWithinRadius(200, 150)).toBe(false);
  });

  it('should use default CHECK_IN_RADIUS_METERS when radius not specified', () => {
    expect(isWithinRadius(CHECK_IN_RADIUS_METERS)).toBe(true);
    expect(isWithinRadius(CHECK_IN_RADIUS_METERS + 1)).toBe(false);
  });

  it('should handle zero distance', () => {
    expect(isWithinRadius(0)).toBe(true);
  });
});

describe('isWithinSchoolRadius', () => {
  const schoolLocation = { latitude: 40.7128, longitude: -74.006 };

  it('should return isWithin true when user is at school location', () => {
    const userLocation = { latitude: 40.7128, longitude: -74.006 };
    const result = isWithinSchoolRadius(userLocation, schoolLocation);

    expect(result.isWithin).toBe(true);
    expect(result.distanceMeters).toBe(0);
  });

  it('should return isWithin true when user is within default radius', () => {
    // ~100m away
    const userLocation = { latitude: 40.7137, longitude: -74.006 };
    const result = isWithinSchoolRadius(userLocation, schoolLocation);

    expect(result.isWithin).toBe(true);
    expect(result.distanceMeters).toBeLessThan(CHECK_IN_RADIUS_METERS);
  });

  it('should return isWithin false when user is outside default radius', () => {
    // ~500m away
    const userLocation = { latitude: 40.717, longitude: -74.006 };
    const result = isWithinSchoolRadius(userLocation, schoolLocation);

    expect(result.isWithin).toBe(false);
    expect(result.distanceMeters).toBeGreaterThan(CHECK_IN_RADIUS_METERS);
  });

  it('should respect custom radius parameter', () => {
    // ~300m away
    const userLocation = { latitude: 40.7155, longitude: -74.006 };

    const resultDefault = isWithinSchoolRadius(userLocation, schoolLocation);
    expect(resultDefault.isWithin).toBe(false);

    const resultCustom = isWithinSchoolRadius(userLocation, schoolLocation, 500);
    expect(resultCustom.isWithin).toBe(true);
  });

  it('should return rounded distance in meters', () => {
    const userLocation = { latitude: 40.7135, longitude: -74.0055 };
    const result = isWithinSchoolRadius(userLocation, schoolLocation);

    expect(Number.isInteger(result.distanceMeters)).toBe(true);
  });
});

describe('generateGeohash', () => {
  it('should generate a geohash of default precision (9)', () => {
    const hash = generateGeohash(40.7128, -74.006);
    expect(hash).toHaveLength(9);
  });

  it('should generate a geohash of specified precision', () => {
    const hash5 = generateGeohash(40.7128, -74.006, 5);
    expect(hash5).toHaveLength(5);

    const hash12 = generateGeohash(40.7128, -74.006, 12);
    expect(hash12).toHaveLength(12);
  });

  it('should use only valid base32 characters', () => {
    const hash = generateGeohash(40.7128, -74.006, 12);
    const validChars = /^[0-9bcdefghjkmnpqrstuvwxyz]+$/;
    expect(hash).toMatch(validChars);
  });

  it('should generate consistent hashes for same coordinates', () => {
    const hash1 = generateGeohash(40.7128, -74.006);
    const hash2 = generateGeohash(40.7128, -74.006);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different coordinates', () => {
    const hash1 = generateGeohash(40.7128, -74.006);
    const hash2 = generateGeohash(51.5074, -0.1278); // London
    expect(hash1).not.toBe(hash2);
  });

  it('should generate similar prefixes for nearby coordinates', () => {
    const hash1 = generateGeohash(40.7128, -74.006, 9);
    const hash2 = generateGeohash(40.7129, -74.0061, 9);

    // Nearby points should share prefix characters
    expect(hash1.substring(0, 6)).toBe(hash2.substring(0, 6));
  });

  it('should handle edge case coordinates', () => {
    expect(() => generateGeohash(0, 0)).not.toThrow();
    expect(() => generateGeohash(90, 180)).not.toThrow();
    expect(() => generateGeohash(-90, -180)).not.toThrow();
  });
});

describe('formatDistance', () => {
  it('should format distances under 1000m in meters', () => {
    expect(formatDistance(50)).toBe('50m');
    expect(formatDistance(150)).toBe('150m');
    expect(formatDistance(999)).toBe('999m');
  });

  it('should format distances of 1000m or more in kilometers', () => {
    expect(formatDistance(1000)).toBe('1.0km');
    expect(formatDistance(1500)).toBe('1.5km');
    expect(formatDistance(10000)).toBe('10.0km');
  });

  it('should round meter values', () => {
    expect(formatDistance(149.5)).toBe('150m');
    expect(formatDistance(149.4)).toBe('149m');
  });

  it('should format km with one decimal place', () => {
    expect(formatDistance(1234)).toBe('1.2km');
    expect(formatDistance(1256)).toBe('1.3km');
  });

  it('should handle zero distance', () => {
    expect(formatDistance(0)).toBe('0m');
  });

  it('should handle very large distances', () => {
    expect(formatDistance(100000)).toBe('100.0km');
  });
});
