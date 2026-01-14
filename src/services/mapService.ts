import mapboxgl from 'mapbox-gl';
import type { MapViewState } from '@/types';

export const MAPBOX_STYLE_URL =
  'mapbox://styles/skruby/cmkelghk200bd01rxa9mrhtv1';

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
    style: MAPBOX_STYLE_URL,
    center: [initialView.longitude, initialView.latitude],
    zoom: initialView.zoom,
    pitch: initialView.pitch, // Tilt the map to see 3D buildings (0-85 degrees)
    bearing: initialView.bearing, // Rotation of the map (0-360 degrees)
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
export const addServiceMarkers = (map: mapboxgl.Map): void => {
  if (map.getLayer('service-labels')) {
    map.removeLayer('service-labels');
  }

  if (map.getLayer('service-circles')) {
    map.removeLayer('service-circles');
  }

  if (map.getSource('services')) {
    map.removeSource('services');
  }
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
  if (map.getLayer('3d-buildings')) {
    return;
  }

  const style = map.getStyle();
  const styleSources = style?.sources ?? {};
  if (!('composite' in styleSources)) {
    console.warn('Composite source not found in map style');
    return;
  }

  const labelLayerId = style?.layers?.find(layer => {
    const layout = layer.layout as { 'text-field'?: unknown } | undefined;
    return layer.type === 'symbol' && layout?.['text-field'];
  })?.id;

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
        'fill-extrusion-vertical-gradient': true,
      },
    },
    // Insert the layer beneath any symbol layer for proper layering
    labelLayerId
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
