import { GeoPoint } from '../types';
import { CHECK_IN_RADIUS_METERS } from '../constants';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate distance between two GeoPoints
 */
export function calculateDistanceBetweenPoints(
  point1: GeoPoint,
  point2: GeoPoint
): number {
  return calculateDistance(
    point1.latitude,
    point1.longitude,
    point2.latitude,
    point2.longitude
  );
}

/**
 * Check if a point is within the check-in radius of another point
 */
export function isWithinRadius(
  distanceMeters: number,
  radiusMeters: number = CHECK_IN_RADIUS_METERS
): boolean {
  return distanceMeters <= radiusMeters;
}

/**
 * Check if a location is within the check-in radius of a school
 */
export function isWithinSchoolRadius(
  userLocation: GeoPoint,
  schoolLocation: GeoPoint,
  radiusMeters: number = CHECK_IN_RADIUS_METERS
): { isWithin: boolean; distanceMeters: number } {
  const distance = calculateDistanceBetweenPoints(userLocation, schoolLocation);
  return {
    isWithin: distance <= radiusMeters,
    distanceMeters: Math.round(distance),
  };
}

/**
 * Generate a geohash for a location (for efficient geo queries)
 * Uses a simple base32 encoding approach
 */
export function generateGeohash(
  latitude: number,
  longitude: number,
  precision: number = 9
): string {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let minLat = -90,
    maxLat = 90;
  let minLon = -180,
    maxLon = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isEven = true;

  while (hash.length < precision) {
    if (isEven) {
      const mid = (minLon + maxLon) / 2;
      if (longitude > mid) {
        ch |= 1 << (4 - bit);
        minLon = mid;
      } else {
        maxLon = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (latitude > mid) {
        ch |= 1 << (4 - bit);
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
