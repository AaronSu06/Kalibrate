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

// Create map instance with 3D configuration
export const createMap = (
  container: HTMLElement,
  initialView: MapViewState
): mapboxgl.Map => {
  const map = new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [initialView.longitude, initialView.latitude],
    zoom: initialView.zoom,
    pitch: 60, // Tilt the map to see 3D buildings (0-85 degrees)
    bearing: 0, // Rotation of the map (0-360 degrees)
    attributionControl: true,
    antialias: true, // Smooth edges for 3D objects
  });

  // Add navigation controls (zoom, rotate, pitch)
  map.addControl(
    new mapboxgl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true,
    }),
    'top-right'
  );

  return map;
};

// Add service locations as a GeoJSON layer (part of the map, not DOM elements)
export const addServiceMarkers = (
  map: mapboxgl.Map,
  services: ServiceLocation[]
): void => {
  // Create GeoJSON from services
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: services.map(service => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [service.coordinates.longitude, service.coordinates.latitude],
      },
      properties: {
        id: service.id,
        name: service.name,
        category: service.category,
        address: service.address,
        description: service.description,
        color: getCategoryColor(service.category),
      },
    })),
  };

  // Add source
  if (map.getSource('services')) {
    (map.getSource('services') as mapboxgl.GeoJSONSource).setData(geojson);
  } else {
    map.addSource('services', {
      type: 'geojson',
      data: geojson,
    });
  }

  // Add circle layer for the markers (rendered as part of the map)
  if (!map.getLayer('service-circles')) {
    map.addLayer({
      id: 'service-circles',
      type: 'circle',
      source: 'services',
      paint: {
        'circle-radius': 15,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9,
      },
    });
  }

  // Add labels for service names
  if (!map.getLayer('service-labels')) {
    map.addLayer({
      id: 'service-labels',
      type: 'symbol',
      source: 'services',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 2],
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    });
  }
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

// Fly to location with close zoom and 3D view
export const flyToLocation = (
  map: mapboxgl.Map,
  coordinates: { latitude: number; longitude: number },
  zoom = 18 // Much closer zoom to see the building clearly
): void => {
  map.flyTo({
    center: [coordinates.longitude, coordinates.latitude],
    zoom,
    pitch: 60, // Maintain 3D tilt
    bearing: map.getBearing(), // Keep current rotation
    essential: true,
    duration: 2000, // Smooth 2-second animation
  });
};

// Enable 3D buildings layer
export const enable3DBuildings = (map: mapboxgl.Map): void => {
  // Wait for the style to load before adding 3D buildings
  if (!map.getLayer('building')) {
    console.warn('Building layer not found in map style');
    return;
  }

  // Add 3D building extrusions
  map.addLayer(
    {
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',
        // Use an expression to get the height property from the building data
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height'],
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height'],
        ],
        'fill-extrusion-opacity': 0.6,
      },
    },
    // Insert the layer beneath any symbol layer for proper layering
    'waterway-label'
  );
};

// Add terrain (optional - for elevated landscapes)
export const enableTerrain = (map: mapboxgl.Map): void => {
  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14,
  });

  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
};
