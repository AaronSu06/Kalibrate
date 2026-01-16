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

// Create SVG icon for each category
const createCategoryIcon = (category: string, color: string): string => {
  const iconMap: Record<string, string> = {
    hospitals: '<path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10h5v2h-5v5h-2v-5H5v-2h5V7h2v5z"/>',
    clinics: '<path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10h5v2h-5v5h-2v-5H5v-2h5V7h2v5z"/>',
    grocery: '<path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>',
    transportation: '<path d="M12 2c-4.42 0-8 .5-8 4v10c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4zM7.5 16c-.83 0-1.5-.67-1.5-1.5S6.67 13 7.5 13s1.5.67 1.5 1.5S8.33 16 7.5 16zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM6 10V6h12v4H6z"/>',
    religious: '<path d="M14 2h-4v9H2v2h8v9h4v-9h8v-2h-8z"/>',
    gardens: '<path d="M14 2h-4v7H5v2h5v11h4V11h5V9h-5z"/><circle cx="12" cy="20" r="2"/>',
    entertainment: '<path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>',
    education: '<path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>',
    government: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z"/>',
    emergency: '<path d="M20.79 9.23l-2-3.46a.993.993 0 00-.86-.5h-4L12 2 10.07 5.27h-4c-.36 0-.69.19-.86.5l-2 3.46a1 1 0 000 1L5.21 13.5a.99.99 0 00.86.5h4L12 17.27l1.93-3.27h4c.36 0 .69-.19.86-.5l2-3.46a1 1 0 000-1zM12 13.5l-2.5-4.5L12 5l2.5 4.5L12 13.5z"/>',
    housing: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
    fitness: '<path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>',
    banks: '<path d="M12 2L2 7v2h20V7l-10-5zm-8 7v6h4v-6H4zm6 0v6h4v-6h-4zm6 0v6h4v-6h-4zM2 20h20v2H2v-2z"/>',
    libraries: '<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>',
  };

  const iconPath = iconMap[category] || iconMap['entertainment'];
  
  return `<svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#000000" stroke-width="0.5">
      ${iconPath}
    </g>
  </svg>`;
};

// Load category icons into the map
const loadCategoryIcons = async (map: mapboxgl.Map): Promise<void> => {
  const categories = {
    hospitals: '#f87171',
    clinics: '#c084fc',
    grocery: '#4ade80',
    transportation: '#fbbf24',
    religious: '#e0e7ff',
    gardens: '#86efac',
    entertainment: '#f472b6',
    education: '#60a5fa',
    government: '#fb923c',
    emergency: '#f87171',
    housing: '#fb923c',
    fitness: '#4ade80',
    banks: '#22d3ee',
    libraries: '#a78bfa',
  };

  const loadPromises = Object.entries(categories).map(([category, color]) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image(32, 32);
      const svgString = createCategoryIcon(category, color);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        if (!map.hasImage(`icon-${category}`)) {
          map.addImage(`icon-${category}`, img);
        }
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  });

  await Promise.all(loadPromises);
};

// Add service locations with glowing markers and labels
export const addServiceMarkers = async (
  map: mapboxgl.Map,
  services: ServiceLocation[],
  excludeIds: Set<string> = new Set()
): Promise<void> => {
  currentServices = services;

  // Load icons if not already loaded
  await loadCategoryIcons(map);

  // Remove existing marker layers and source (not labels)
  const markerLayersToRemove = [
    'service-markers-glow',
    'service-markers-core',
    'service-markers-icon',
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

  // White glow background
  map.addLayer({
    id: 'service-markers-glow',
    type: 'circle',
    source: 'services-markers',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        10, 14,
        15, 20,
        18, 26,
      ],
      'circle-color': '#FFFFFF',
      'circle-opacity': 0.6,
      'circle-blur': 0.4,
    },
  });

  // Icon layer
  map.addLayer({
    id: 'service-markers-icon',
    type: 'symbol',
    source: 'services-markers',
    layout: {
      'icon-image': ['concat', 'icon-', ['get', 'category']],
      'icon-size': [
        'interpolate', ['linear'], ['zoom'],
        10, 0.5,
        15, 0.7,
        18, 0.9,
      ],
      'icon-allow-overlap': true,
      'icon-ignore-placement': false,
    },
    paint: {
      'icon-opacity': 1,
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
    minzoom: 11, // Show labels at zoom 11+
    layout: {
      'text-field': ['get', 'name'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        11, 9,
        13, 10,
        15, 11,
        18, 13,
      ],
      'text-offset': [0, 1.5],
      'text-anchor': 'top',
      'text-max-width': 12,
      'text-allow-overlap': false,
      'text-optional': true, // Allow text to be hidden if it doesn't fit
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(0, 0, 0, 0.95)',
      'text-halo-width': 2.5,
      'text-halo-blur': 0.5,
    },
  });
};

// Get current services for external use
export const getCurrentServices = (): ServiceLocation[] => currentServices;

// Fly to location with close zoom and 3D view
export const flyToLocation = (
  map: mapboxgl.Map,
  coordinates: { latitude: number; longitude: number },
  zoom = 19 // Very close zoom to see the building clearly
): void => {
  map.flyTo({
    center: [coordinates.longitude, coordinates.latitude],
    zoom,
    pitch: 65, // Steeper 3D tilt for better building view
    bearing: map.getBearing(), // Keep current rotation
    essential: true,
    duration: 1500, // Smooth 1.5-second animation
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
