/**
 * Weather API - Fetches local weather for the Bloom visualization
 * 
 * Uses Open-Meteo API (free, no API key required) to get weather conditions
 * that affect how the blossom tree is rendered (rain, wind, sun, etc.)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  isDay: boolean;
  cloudCover: number;
  precipitation: number;
  // Derived conditions for the tree
  condition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'windy' | 'foggy';
  intensity: 'light' | 'moderate' | 'heavy';
}

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs#weathervariables
function interpretWeatherCode(code: number): { condition: WeatherData['condition']; intensity: WeatherData['intensity'] } {
  // Clear
  if (code === 0) return { condition: 'clear', intensity: 'light' };
  
  // Mainly clear, partly cloudy
  if (code >= 1 && code <= 2) return { condition: 'clear', intensity: 'light' };
  
  // Overcast
  if (code === 3) return { condition: 'cloudy', intensity: 'moderate' };
  
  // Fog
  if (code >= 45 && code <= 48) return { condition: 'foggy', intensity: 'moderate' };
  
  // Drizzle
  if (code >= 51 && code <= 55) {
    if (code === 51) return { condition: 'rainy', intensity: 'light' };
    if (code === 53) return { condition: 'rainy', intensity: 'moderate' };
    return { condition: 'rainy', intensity: 'heavy' };
  }
  
  // Freezing drizzle
  if (code >= 56 && code <= 57) return { condition: 'rainy', intensity: 'light' };
  
  // Rain
  if (code >= 61 && code <= 65) {
    if (code === 61) return { condition: 'rainy', intensity: 'light' };
    if (code === 63) return { condition: 'rainy', intensity: 'moderate' };
    return { condition: 'rainy', intensity: 'heavy' };
  }
  
  // Freezing rain
  if (code >= 66 && code <= 67) return { condition: 'rainy', intensity: 'moderate' };
  
  // Snow
  if (code >= 71 && code <= 77) {
    if (code === 71 || code === 77) return { condition: 'snowy', intensity: 'light' };
    if (code === 73) return { condition: 'snowy', intensity: 'moderate' };
    return { condition: 'snowy', intensity: 'heavy' };
  }
  
  // Rain showers
  if (code >= 80 && code <= 82) {
    if (code === 80) return { condition: 'rainy', intensity: 'light' };
    if (code === 81) return { condition: 'rainy', intensity: 'moderate' };
    return { condition: 'rainy', intensity: 'heavy' };
  }
  
  // Snow showers
  if (code >= 85 && code <= 86) {
    if (code === 85) return { condition: 'snowy', intensity: 'light' };
    return { condition: 'snowy', intensity: 'heavy' };
  }
  
  // Thunderstorm
  if (code >= 95 && code <= 99) {
    if (code === 95) return { condition: 'stormy', intensity: 'moderate' };
    return { condition: 'stormy', intensity: 'heavy' };
  }
  
  return { condition: 'clear', intensity: 'light' };
}

async function weatherHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'public, max-age=600', // Cache for 10 minutes
  };

  if (req.method === 'OPTIONS') {
    return { status: 204, headers };
  }

  try {
    const lat = req.query.get('lat');
    const lon = req.query.get('lon');

    if (!lat || !lon) {
      return {
        status: 400,
        headers,
        jsonBody: {
          error: 'Missing required parameters: lat and lon',
        },
      };
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        status: 400,
        headers,
        jsonBody: {
          error: 'Invalid coordinates: lat and lon must be numbers',
        },
      };
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return {
        status: 400,
        headers,
        jsonBody: {
          error: 'Coordinates out of range',
        },
      };
    }

    // Fetch weather from Open-Meteo (free, no API key needed)
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', latitude.toString());
    weatherUrl.searchParams.set('longitude', longitude.toString());
    weatherUrl.searchParams.set('current', [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(','));
    weatherUrl.searchParams.set('timezone', 'auto');

    context.log(`Fetching weather for coordinates: ${latitude}, ${longitude}`);

    const response = await fetch(weatherUrl.toString());
    
    if (!response.ok) {
      context.error(`Open-Meteo API error: ${response.status}`);
      return {
        status: 502,
        headers,
        jsonBody: {
          error: 'Failed to fetch weather data',
        },
      };
    }

    const data = await response.json() as {
      current: {
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        is_day: number;
        precipitation: number;
        weather_code: number;
        cloud_cover: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
      };
      timezone: string;
    };

    const { condition, intensity } = interpretWeatherCode(data.current.weather_code);

    // Check if it's particularly windy (override condition if wind is strong)
    let finalCondition = condition;
    if (data.current.wind_speed_10m > 40 && condition === 'clear') {
      finalCondition = 'windy';
    }

    const weatherData: WeatherData = {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection: data.current.wind_direction_10m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      cloudCover: data.current.cloud_cover,
      precipitation: data.current.precipitation,
      condition: finalCondition,
      intensity,
    };

    context.log(`Weather fetched: ${weatherData.temperature}°C, ${weatherData.condition}`);

    return {
      status: 200,
      headers,
      jsonBody: {
        success: true,
        weather: weatherData,
        timezone: data.timezone,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    context.error('Weather fetch error:', error);
    return {
      status: 500,
      headers,
      jsonBody: {
        error: 'Internal server error',
      },
    };
  }
}

app.http('weather', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'weather',
  handler: weatherHandler,
});
