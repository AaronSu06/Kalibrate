import type { ServiceLocation } from '@/types';

type TravelProfile = 'driving' | 'walking';

interface DirectionsRoute {
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
}

interface DirectionsResponse {
  routes: DirectionsRoute[];
  code: string;
}

export const getRoute = async (
  profile: TravelProfile,
  from: ServiceLocation,
  to: ServiceLocation,
  signal?: AbortSignal
): Promise<DirectionsRoute> => {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error('Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in .env');
  }

  const coordinates = `${from.coordinates.longitude},${from.coordinates.latitude};${to.coordinates.longitude},${to.coordinates.latitude}`;
  const params = new URLSearchParams({
    alternatives: 'false',
    geometries: 'geojson',
    overview: 'full',
    steps: 'false',
    access_token: token,
  });
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?${params.toString()}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Mapbox directions failed: ${response.status}`);
  }
  const data = (await response.json()) as DirectionsResponse;
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('Mapbox directions returned no routes');
  }
  return data.routes[0];
};
