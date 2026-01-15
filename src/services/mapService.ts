import mapboxgl from 'mapbox-gl';
import type { MapViewState, ServiceLocation } from '@/types';
import { CATEGORY_COLORS } from '@/types';

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

// Store service locations
let currentServices: ServiceLocation[] = [];

// Add service locations as markers on the map
export const addServiceMarkers = (
  map: mapboxgl.Map,
  services: ServiceLocation[]
): void => {
  currentServices = services;

  // Remove existing layers and source
  if (map.getLayer('service-labels')) {
    map.removeLayer('service-labels');
  }
  if (map.getLayer('service-circles')) {
    map.removeLayer('service-circles');
  }
  if (map.getLayer('service-circles-glow')) {
    map.removeLayer('service-circles-glow');
  }
  if (map.getLayer('service-circles-glow-outer')) {
    map.removeLayer('service-circles-glow-outer');
  }
  if (map.getLayer('service-circles-glow-outer2')) {
    map.removeLayer('service-circles-glow-outer2');
  }
  if (map.getSource('services')) {
    map.removeSource('services');
  }

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
        color: CATEGORY_COLORS[service.category],
      },
    })),
  };

  // Add the GeoJSON source
  map.addSource('services', {
    type: 'geojson',
    data: geojson,
  });

  // Add main circle markers layer (minimal dots that scale with zoom)
  map.addLayer({
    id: 'service-circles',
    type: 'circle',
    source: 'services',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        9, 3,
        12, 4,
        15, 5.5,
        18, 7.5,
      ],
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.95,
      'circle-blur': 0,
    },
  });

  // Add text labels layer (visible at higher zoom)
  map.addLayer({
    id: 'service-labels',
    type: 'symbol',
    source: 'services',
    minzoom: 15,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 11,
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
      'text-max-width': 10,
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#333333',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  });
};

// Get current services for external use
export const getCurrentServices = (): ServiceLocation[] => currentServices;

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

  // Add 3D building extrusions with default gray color
  // Colors will be updated by highlightServiceBuildings
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
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['coalesce', ['get', 'height'], 10],
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
        'fill-extrusion-opacity': 0.7,
        'fill-extrusion-vertical-gradient': true,
      },
    },
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

// Query building at a specific coordinate and return its geometry
const queryBuildingAtPoint = (
  map: mapboxgl.Map,
  lng: number,
  lat: number
): mapboxgl.MapboxGeoJSONFeature | null => {
  const point = map.project([lng, lat]);
  const features = map.queryRenderedFeatures(
    [
      [point.x - 10, point.y - 10],
      [point.x + 10, point.y + 10],
    ],
    { layers: ['3d-buildings'] }
  );
  return features.length > 0 ? features[0] : null;
};

// Highlight buildings at service locations by extracting their footprints
export const highlightServiceBuildings = (
  map: mapboxgl.Map,
  services: ServiceLocation[]
): void => {
  // Remove existing highlight layer
  if (map.getLayer('highlighted-buildings')) {
    map.removeLayer('highlighted-buildings');
  }
  if (map.getSource('highlighted-buildings-source')) {
    map.removeSource('highlighted-buildings-source');
  }

  if (!map.getLayer('3d-buildings')) return;

  // Query buildings at each service location and collect their geometries
  const buildingFeatures: GeoJSON.Feature[] = [];
  const processedIds = new Set<string | number>();

  for (const service of services) {
    const building = queryBuildingAtPoint(
      map,
      service.coordinates.longitude,
      service.coordinates.latitude
    );

    if (building && building.geometry && building.geometry.type === 'Polygon') {
      // Avoid duplicates
      const id = building.id ?? `${service.coordinates.longitude}-${service.coordinates.latitude}`;
      if (processedIds.has(id)) continue;
      processedIds.add(id);

      buildingFeatures.push({
        type: 'Feature',
        geometry: building.geometry as GeoJSON.Polygon,
        properties: {
          color: CATEGORY_COLORS[service.category],
          height: building.properties?.height ?? 15,
          min_height: building.properties?.min_height ?? 0,
        },
      });
    }
  }

  if (buildingFeatures.length === 0) return;

  // Add source with building footprints
  map.addSource('highlighted-buildings-source', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: buildingFeatures,
    },
  });

  // Add highlighted buildings layer on top of regular buildings
  map.addLayer({
    id: 'highlighted-buildings',
    type: 'fill-extrusion',
    source: 'highlighted-buildings-source',
    paint: {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.9,
    },
  });
};

// Re-query and update building highlights when map moves
export const refreshBuildingHighlights = (map: mapboxgl.Map): void => {
  if (currentServices.length === 0) return;
  highlightServiceBuildings(map, currentServices);
};
