import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as Location from 'expo-location';
import { GeoPoint, BACKGROUND_LOCATION_INTERVAL_MS } from '@dmdl/shared';

type LocationStatus = 'loading' | 'granted' | 'denied' | 'undetermined';

interface LocationContextType {
  location: GeoPoint | null;
  status: LocationStatus;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start watching location when permission is granted
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    if (status === 'granted') {
      startWatchingLocation().then((sub) => {
        subscription = sub;
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [status]);

  const checkPermissionStatus = async () => {
    try {
      const { status: foregroundStatus } =
        await Location.getForegroundPermissionsAsync();

      if (foregroundStatus === 'granted') {
        setStatus('granted');
        await getCurrentLocation();
      } else if (foregroundStatus === 'denied') {
        setStatus('denied');
      } else {
        setStatus('undetermined');
      }
    } catch (err) {
      console.error('Error checking permission:', err);
      setError('Failed to check location permission');
      setStatus('denied');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Request foreground permission first
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        setStatus('denied');
        setError('Location permission denied');
        return false;
      }

      // Request background permission for auto-checkout
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      // We can proceed even without background permission
      // (manual checkout will still work)
      if (backgroundStatus !== 'granted') {
        console.log('Background location not granted - auto-checkout disabled');
      }

      setStatus('granted');
      await getCurrentLocation();
      return true;
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to request location permission');
      setStatus('denied');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = async (): Promise<void> => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setAccuracy(loc.coords.accuracy);
      setError(null);
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Failed to get current location');
    }
  };

  const startWatchingLocation = async (): Promise<Location.LocationSubscription | null> => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: BACKGROUND_LOCATION_INTERVAL_MS,
          distanceInterval: 10, // meters
        },
        (loc) => {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          setAccuracy(loc.coords.accuracy);
        }
      );

      return subscription;
    } catch (err) {
      console.error('Error watching location:', err);
      setError('Failed to watch location');
      return null;
    }
  };

  const refreshLocation = useCallback(async () => {
    if (status === 'granted') {
      await getCurrentLocation();
    }
  }, [status]);

  return (
    <LocationContext.Provider
      value={{
        location,
        status,
        accuracy,
        isLoading,
        error,
        requestPermission,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
