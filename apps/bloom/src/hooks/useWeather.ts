/**
 * useWeather - Hook to fetch local weather for Bloom visualizations
 * 
 * Gets user's location via Geolocation API, then fetches weather data
 * from our API endpoint (which uses Open-Meteo, no API key needed).
 * 
 * The weather affects the blossom tree visualization:
 * - Rain: falling raindrops, drooping petals
 * - Wind: swaying branches, flying petals
 * - Clear: calm, gentle movement
 * - Snow: snowflakes, muted colors
 */

import { useState, useEffect, useCallback } from 'react';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  isDay: boolean;
  cloudCover: number;
  precipitation: number;
  condition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'windy' | 'foggy';
  intensity: 'light' | 'moderate' | 'heavy';
}

interface UseWeatherOptions {
  /** Refresh interval in milliseconds (default: 10 minutes) */
  refreshInterval?: number;
  /** Whether to auto-fetch on mount (default: true) */
  autoFetch?: boolean;
  /** Default coordinates if geolocation fails (Newcastle, NSW, Australia) */
  defaultCoordinates?: { lat: number; lon: number };
}

interface UseWeatherResult {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  locationName: string | null;
  refetch: () => Promise<void>;
  hasLocation: boolean;
}

// Default to Newcastle, NSW, Australia (home of Bloom)
const DEFAULT_COORDS = { lat: -32.9283, lon: 151.7817 };

export function useWeather(options: UseWeatherOptions = {}): UseWeatherResult {
  const {
    refreshInterval = 10 * 60 * 1000, // 10 minutes
    autoFetch = true,
    defaultCoordinates = DEFAULT_COORDS,
  } = options;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);

  // Get user's location
  const getLocation = useCallback(async (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported, using Newcastle weather');
        setLocationName('Newcastle');
        resolve(defaultCoordinates);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setCoords(newCoords);
          setHasLocation(true);
          resolve(newCoords);
        },
        (geoError) => {
          console.log('Geolocation error, using Newcastle weather:', geoError.message);
          setLocationName('Newcastle');
          resolve(defaultCoordinates);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  }, [defaultCoordinates]);

  // Fetch weather data
  const fetchWeather = useCallback(async (coordinates: { lat: number; lon: number }) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const url = `${apiBase}/weather?lat=${coordinates.lat}&lon=${coordinates.lon}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.weather) {
        setWeather(data.weather);
        setError(null);
        
        // Try to get location name from timezone
        if (data.timezone) {
          const parts = data.timezone.split('/');
          setLocationName(parts[parts.length - 1].replace(/_/g, ' '));
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch weather';
      setError(message);
      console.error('Weather fetch error:', message);
    }
  }, []);

  // Main fetch function
  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const coordinates = coords || await getLocation();
      await fetchWeather(coordinates);
    } finally {
      setIsLoading(false);
    }
  }, [coords, getLocation, fetchWeather]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch]); // Only run on mount, not when refetch changes

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      if (coords) {
        fetchWeather(coords);
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, coords, fetchWeather]);

  return {
    weather,
    isLoading,
    error,
    locationName,
    refetch,
    hasLocation,
  };
}

/**
 * Weather effects for the blossom tree
 * Returns animation parameters based on weather conditions
 */
export function getWeatherEffects(weather: WeatherData | null) {
  if (!weather) {
    return {
      windIntensity: 0.3,
      petalFallRate: 0.5,
      swayAmount: 1,
      particleType: 'pollen' as const,
      particleCount: 20,
      skyTint: undefined,
      brightness: 1,
    };
  }

  const baseWind = weather.windSpeed / 50; // Normalize to 0-1 range (50 km/h = max)
  const intensityMultiplier = weather.intensity === 'heavy' ? 1.5 : weather.intensity === 'moderate' ? 1 : 0.6;

  switch (weather.condition) {
    case 'rainy':
      return {
        windIntensity: Math.min(baseWind * 1.2, 1),
        petalFallRate: 0.8 * intensityMultiplier,
        swayAmount: 1.3,
        particleType: 'rain' as const,
        particleCount: Math.floor(40 * intensityMultiplier),
        skyTint: 'rgba(100, 120, 140, 0.2)',
        brightness: 0.7,
      };

    case 'stormy':
      return {
        windIntensity: Math.min(baseWind * 2, 1),
        petalFallRate: 1.2,
        swayAmount: 2,
        particleType: 'rain' as const,
        particleCount: Math.floor(60 * intensityMultiplier),
        skyTint: 'rgba(80, 90, 100, 0.3)',
        brightness: 0.5,
      };

    case 'snowy':
      return {
        windIntensity: Math.min(baseWind * 0.8, 0.6),
        petalFallRate: 0.3,
        swayAmount: 0.8,
        particleType: 'snow' as const,
        particleCount: Math.floor(50 * intensityMultiplier),
        skyTint: 'rgba(200, 210, 220, 0.15)',
        brightness: 0.9,
      };

    case 'windy':
      return {
        windIntensity: Math.min(baseWind * 1.5, 1),
        petalFallRate: 1.5,
        swayAmount: 2.5,
        particleType: 'pollen' as const,
        particleCount: 35,
        skyTint: undefined,
        brightness: 1,
      };

    case 'foggy':
      return {
        windIntensity: 0.1,
        petalFallRate: 0.2,
        swayAmount: 0.5,
        particleType: 'pollen' as const,
        particleCount: 10,
        skyTint: 'rgba(180, 180, 190, 0.3)',
        brightness: 0.75,
      };

    case 'cloudy':
      return {
        windIntensity: Math.min(baseWind, 0.5),
        petalFallRate: 0.4,
        swayAmount: 1,
        particleType: 'pollen' as const,
        particleCount: 15,
        skyTint: 'rgba(150, 160, 170, 0.1)',
        brightness: 0.85,
      };

    case 'clear':
    default:
      return {
        windIntensity: Math.min(baseWind, 0.4),
        petalFallRate: 0.5,
        swayAmount: 1,
        particleType: 'pollen' as const,
        particleCount: 20,
        skyTint: undefined,
        brightness: weather.isDay ? 1 : 0.6,
      };
  }
}
