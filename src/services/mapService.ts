import mapboxgl from 'mapbox-gl';
import type { ServiceLocation, MapViewState } from '@/types';

// Initialize Mapbox
export const initializeMapbox = (): void => {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in .env'
    );
  }
  mapboxgl.accessToken = token;
};

// Create map instance
export const createMap = (
  container: HTMLElement,
  initialView: MapViewState
): mapboxgl.Map => {
  return new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [initialView.longitude, initialView.latitude],
    zoom: initialView.zoom,
    attributionControl: true,
  });
};

// Add marker to map
export const addMarker = (
  map: mapboxgl.Map,
  service: ServiceLocation,
  onClick: (service: ServiceLocation) => void
): mapboxgl.Marker => {
  const el = document.createElement('div');
  el.className = 'service-marker';
  el.style.width = '30px';
  el.style.height = '30px';
  el.style.borderRadius = '50%';
  el.style.cursor = 'pointer';
  el.style.backgroundColor = getCategoryColor(service.category);
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `${service.name} - ${service.category}`);
  el.setAttribute('tabindex', '0');

  const marker = new mapboxgl.Marker(el)
    .setLngLat([service.coordinates.longitude, service.coordinates.latitude])
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${service.name}</h3>
          <p style="font-size: 12px; color: #666;">${service.category}</p>
          <p style="font-size: 12px; margin-top: 4px;">${service.address}</p>
        </div>
      `)
    )
    .addTo(map);

  el.addEventListener('click', () => onClick(service));
  el.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick(service);
    }
  });

  return marker;
};

// Get color for category
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    healthcare: '#ef4444', // red
    grocery: '#22c55e', // green
    banking: '#3b82f6', // blue
    pharmacy: '#a855f7', // purple
    transportation: '#f59e0b', // amber
    community: '#06b6d4', // cyan
  };
  return colors[category] || '#6b7280';
};

// Fly to location
export const flyToLocation = (
  map: mapboxgl.Map,
  coordinates: { latitude: number; longitude: number },
  zoom = 15
): void => {
  map.flyTo({
    center: [coordinates.longitude, coordinates.latitude],
    zoom,
    essential: true,
  });
};
