/**
 * Geolocation and Geofencing Utilities for Haazri
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance in meters between two GPS coordinates using the Haversine formula
 */
export function calculateDistanceInMeters(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const lat1Rad = (coords1.latitude * Math.PI) / 180;
  const lat2Rad = (coords2.latitude * Math.PI) / 180;
  const deltaLat = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
  const deltaLon = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Check if the user is inside the office geofence radius
 */
export function isWithinGeofence(
  userCoords: Coordinates,
  officeCoords: Coordinates,
  radiusMeters: number = 200
): { inGeofence: boolean; distanceMeters: number } {
  const distanceMeters = calculateDistanceInMeters(userCoords, officeCoords);
  return {
    inGeofence: distanceMeters <= radiusMeters,
    distanceMeters,
  };
}

/**
 * Request high accuracy current position from browser
 */
export function getBrowserPosition(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn(`Geolocation error (${error.code}): ${error.message}`);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000,
      }
    );
  });
}
