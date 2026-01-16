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

// Store service locations and highlighted service IDs
let currentServices: ServiceLocation[] = [];
let highlightedServiceIds: Set<string> = new Set();

// Add service locations with glowing markers and labels
export const addServiceMarkers = (
  map: mapboxgl.Map,
  services: ServiceLocation[],
  excludeIds: Set<string> = new Set()
): void => {
  currentServices = services;

  // Remove existing marker layers and source (not labels)
  const markerLayersToRemove = [
    'service-markers-glow',
    'service-markers-core',
  ];
  markerLayersToRemove.forEach(layerId => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  if (map.getSource('services-markers')) {
    map.removeSource('services-markers');
  }

  // Filter out services that have building highlights (for markers only)
  const visibleServices = services.filter(s => !excludeIds.has(s.id));

  // Create GeoJSON for markers (filtered)
  const markersGeojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: visibleServices.map(service => ({
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

  // Add the markers source
  map.addSource('services-markers', {
    type: 'geojson',
    data: markersGeojson,
  });

  // Massive outer glow with screen blend to override darkness
  map.addLayer({
    id: 'service-markers-glow',
    type: 'circle',
    source: 'services-markers',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 12,
        15, 18,
        18, 24,
      ],
      'circle-color': '#FFFFFF',  // Pure white glow
      'circle-opacity': 0.8,
      'circle-blur': 0.3,
    },
  });

  // Large bright core
  map.addLayer({
    id: 'service-markers-core',
    type: 'circle',
    source: 'services-markers',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 6,
        15, 9,
        18, 12,
      ],
      'circle-color': [
        'match',
        ['get', 'category'],
        'healthcare', '#FF0000',      // Pure red
        'grocery', '#00FF00',          // Pure green  
        'banking', '#00FFFF',          // Pure cyan
        'pharmacy', '#FF00FF',         // Pure magenta
        'transportation', '#FFFF00',   // Pure yellow
        'community', '#00FFFF',        // Pure cyan
        'recreation', '#FF1493',       // Deep pink
        '#00FF00' // default pure green
      ],
      'circle-opacity': 1,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-opacity': 1,
    },
  });

  // Large bright core
  map.addLayer({
    id: 'service-markers-core',
    type: 'circle',
    source: 'services-markers',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 6,
        15, 9,
        18, 12,
      ],
      'circle-color': [
        'match',
        ['get', 'category'],
        'healthcare', '#f87171',      // Tailwind red-400
        'grocery', '#4ade80',          // Tailwind green-400  
        'banking', '#60a5fa',          // Tailwind blue-400
        'pharmacy', '#c084fc',         // Tailwind purple-400
        'transportation', '#fbbf24',   // Tailwind amber-400
        'community', '#22d3ee',        // Tailwind cyan-400
        'recreation', '#f472b6',       // Tailwind pink-400
        '#4ade80' // default green-400
      ],
      'circle-opacity': 1,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-opacity': 1,
    },
  });
};

// Add labels separately (always shows all services)
export const addServiceLabels = (
  map: mapboxgl.Map,
  services: ServiceLocation[]
): void => {
  // Remove existing labels
  if (map.getLayer('service-labels')) {
    map.removeLayer('service-labels');
  }
  if (map.getSource('services-labels')) {
    map.removeSource('services-labels');
  }

  // Create GeoJSON for all services (labels always visible)
  const labelsGeojson: GeoJSON.FeatureCollection = {
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
      },
    })),
  };

  map.addSource('services-labels', {
    type: 'geojson',
    data: labelsGeojson,
  });

  // Text labels (always visible for all services)
  map.addLayer({
    id: 'service-labels',
    type: 'symbol',
    source: 'services-labels',
    minzoom: 13, // Only show labels at zoom 13+
    layout: {
      'text-field': ['get', 'name'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        13, 8,
        15, 10,
        18, 12,
      ],
      'text-offset': [0, 1.5],
      'text-anchor': 'top',
      'text-max-width': 10,
      'text-allow-overlap': false,
      'text-optional': true, // Allow text to be hidden if it doesn't fit
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(0, 0, 0, 0.9)',
      'text-halo-width': 2,
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

  // Add mapbox-streets source if composite doesn't exist
  // This provides building footprint data
  if (!map.getSource('composite') && !map.getSource('mapbox-streets')) {
    map.addSource('mapbox-streets', {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    });
  }

  const buildingSource = map.getSource('composite') ? 'composite' : 'mapbox-streets';

  const style = map.getStyle();
  const labelLayerId = style?.layers?.find(layer => {
    const layout = layer.layout as { 'text-field'?: unknown } | undefined;
    return layer.type === 'symbol' && layout?.['text-field'];
  })?.id;

  // Add 3D building extrusions
  map.addLayer(
    {
      id: '3d-buildings',
      source: buildingSource,
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

  console.log('3D buildings layer added using source:', buildingSource);
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
  // Query a small area first for precision
  const preciseFeatures = map.queryRenderedFeatures(
    [
      [point.x - 5, point.y - 5],
      [point.x + 5, point.y + 5],
    ],
    { layers: ['3d-buildings'] }
  );

  // If found with precise query, use that
  if (preciseFeatures.length > 0) {
    return preciseFeatures[0];
  }

  // Fall back to slightly larger area if nothing found
  const features = map.queryRenderedFeatures(
    [
      [point.x - 15, point.y - 15],
      [point.x + 15, point.y + 15],
    ],
    { layers: ['3d-buildings'] }
  );
  return features.length > 0 ? features[0] : null;
};

// Highlight buildings at service locations with neon glow effect
export const highlightServiceBuildings = (
  map: mapboxgl.Map,
  services: ServiceLocation[]
): void => {
  // Remove existing highlight layers
  const layersToRemove = [
    'highlighted-buildings',
    'highlighted-buildings-glow',
    'highlighted-buildings-glow-outer',
  ];
  layersToRemove.forEach(layerId => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  if (map.getSource('highlighted-buildings-source')) {
    map.removeSource('highlighted-buildings-source');
  }

  // Clear highlighted IDs and refresh markers if below threshold
  const zoom = map.getZoom();
  if (zoom < 17) {
    // Below threshold - clear highlights and show all markers
    if (highlightedServiceIds.size > 0) {
      highlightedServiceIds.clear();
      addServiceMarkers(map, services, highlightedServiceIds);
    }
    console.log('Zoom level too low for precise building highlights:', zoom);
    return;
  }

  // Ensure 3D buildings layer exists before querying
  if (!map.getLayer('3d-buildings')) {
    console.log('3d-buildings layer not found, adding it now...');
    enable3DBuildings(map);

    // If still doesn't exist after trying to add, return
    if (!map.getLayer('3d-buildings')) {
      console.log('Could not add 3d-buildings layer');
      return;
    }
  }

  // Query buildings at each service location and collect their geometries
  const buildingFeatures: GeoJSON.Feature[] = [];
  const processedIds = new Set<string | number>();
  const newHighlightedIds = new Set<string>();

  for (const service of services) {
    const building = queryBuildingAtPoint(
      map,
      service.coordinates.longitude,
      service.coordinates.latitude
    );

    if (building && building.geometry &&
        (building.geometry.type === 'Polygon' || building.geometry.type === 'MultiPolygon')) {
      // Avoid duplicates
      const id = building.id ?? `${service.coordinates.longitude}-${service.coordinates.latitude}`;
      if (processedIds.has(id)) continue;
      processedIds.add(id);

      // Track this service as highlighted
      newHighlightedIds.add(service.id);

      buildingFeatures.push({
        type: 'Feature',
        geometry: building.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        properties: {
          color: CATEGORY_COLORS[service.category],
          height: building.properties?.height ?? 20,
          min_height: building.properties?.min_height ?? 0,
        },
      });
    }
  }

  console.log('Found', buildingFeatures.length, 'buildings to highlight');

  // Update highlighted IDs and refresh markers to hide those with buildings
  highlightedServiceIds = newHighlightedIds;
  addServiceMarkers(map, services, highlightedServiceIds);

  if (buildingFeatures.length === 0) return;

  // Add source with building footprints
  map.addSource('highlighted-buildings-source', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: buildingFeatures,
    },
  });

  // Outer glow layer (2D fill at ground level)
  map.addLayer({
    id: 'highlighted-buildings-glow-outer',
    type: 'fill',
    source: 'highlighted-buildings-source',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.4,
    },
  });

  // Inner glow - slightly extruded with high opacity
  map.addLayer({
    id: 'highlighted-buildings-glow',
    type: 'fill-extrusion',
    source: 'highlighted-buildings-source',
    paint: {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['+', ['get', 'height'], 8],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.6,
    },
  });

  // Main highlighted building - bright neon color
  map.addLayer({
    id: 'highlighted-buildings',
    type: 'fill-extrusion',
    source: 'highlighted-buildings-source',
    paint: {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 1,
    },
  });

  console.log('Building highlights added successfully');
};

// Re-query and update building highlights when map moves
export const refreshBuildingHighlights = (map: mapboxgl.Map): void => {
  if (currentServices.length === 0) return;
  highlightServiceBuildings(map, currentServices);
};
