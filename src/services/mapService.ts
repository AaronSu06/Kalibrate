import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import type { MapViewState, ServiceLocation } from '@/types';
import { CATEGORY_COLORS } from '@/types';

export const MAPBOX_STYLE_URL =
  'mapbox://styles/skruby/cmkelghk200bd01rxa9mrhtv1';

// Kingston area bounds - restrict map panning to the service area
export const KINGSTON_BOUNDS: [[number, number], [number, number]] = [
  [-76.65, 44.15], // Southwest corner
  [-76.35, 44.32], // Northeast corner
];

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

// Create map instance with 3D configuration and performance optimizations
export const createMap = (
  container: HTMLElement,
  initialView: MapViewState
): mapboxgl.Map => {
  const map = new mapboxgl.Map({
    container,
    style: MAPBOX_STYLE_URL,
    center: [initialView.longitude, initialView.latitude],
    zoom: initialView.zoom,
    pitch: initialView.pitch,
    bearing: initialView.bearing,
    attributionControl: false,
    antialias: false, // Disable antialiasing for less GPU memory
    // AGGRESSIVE memory optimizations
    maxBounds: KINGSTON_BOUNDS,
    minZoom: 13, // Higher min zoom = fewer tiles to cache
    maxZoom: 18, // Lower max zoom = fewer high-res tiles
    fadeDuration: 0,
    trackResize: false, // Disable resize tracking
    refreshExpiredTiles: false,
    maxTileCacheSize: 10, // Minimal tile cache (was 50)
    collectResourceTiming: false,
    crossSourceCollisions: false,
    preserveDrawingBuffer: false,
    renderWorldCopies: false,
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

  // Apply Kingston mask when map loads
  map.on('load', () => {
    applyKingstonMask(map).catch(err => {
      console.error('Failed to apply Kingston mask:', err);
    });
  });

  return map;
};

// Apply a mask to display only Kingston, with everything else blacked out
export const applyKingstonMask = async (map: mapboxgl.Map): Promise<void> => {
  try {
    console.log('Starting Kingston mask application...');
    
    // 1. Define the world-spanning polygon (the "Mask Base")
    const world = turf.polygon([[
      [-180, -90],
      [180, -90],
      [180, 90],
      [-180, 90],
      [-180, -90]
    ]]);

    // 2. Fetch the Kingston, Ontario boundary from OpenStreetMap (Nominatim)
    const response = await fetch(
      'https://nominatim.openstreetmap.org/search?city=kingston&state=ontario&country=canada&polygon_geojson=1&format=json',
      {
        headers: {
          'User-Agent': 'AccessKingston/1.0' // Nominatim requires a User-Agent
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.error('Could not fetch Kingston boundary from Nominatim');
      return;
    }

    console.log('Fetched Kingston boundary data:', data[0]);

    // Get the first result's geometry
    const kingstonGeometry = data[0].geojson;
    
    // Convert to Turf format - handle both Polygon and MultiPolygon
    let kingstonFeature: Feature<Polygon | MultiPolygon>;
    if (kingstonGeometry.type === 'Polygon') {
      kingstonFeature = turf.polygon(kingstonGeometry.coordinates);
    } else if (kingstonGeometry.type === 'MultiPolygon') {
      kingstonFeature = turf.multiPolygon(kingstonGeometry.coordinates);
    } else {
      console.error('Unexpected geometry type:', kingstonGeometry.type);
      return;
    }

    console.log('Kingston feature created:', kingstonFeature.geometry.type);

    // 3. Use Turf to "cut out" Kingston from the World
    // Create a polygon with a hole (world minus Kingston)
    const masked = turf.difference(turf.featureCollection([world, kingstonFeature]));

    if (!masked) {
      console.error('Failed to create mask difference - turf.difference returned null');
      return;
    }

    console.log('Mask created successfully, geometry type:', masked.geometry?.type);

    // Remove existing mask layers if they exist
    if (map.getLayer('kingston-outline')) {
      map.removeLayer('kingston-outline');
    }
    if (map.getLayer('kingston-mask-layer')) {
      map.removeLayer('kingston-mask-layer');
    }
    if (map.getSource('kingston-mask')) {
      map.removeSource('kingston-mask');
    }

    // 4. Add the result to the Mapbox Map
    map.addSource('kingston-mask', {
      type: 'geojson',
      data: masked
    });

    // Find the first symbol layer to insert the mask before labels
    const layers = map.getStyle()?.layers || [];
    let firstSymbolId: string | undefined;
    for (const layer of layers) {
      if (layer.type === 'symbol') {
        firstSymbolId = layer.id;
        break;
      }
    }

    // Add the dark mask layer - insert before labels
    map.addLayer({
      id: 'kingston-mask-layer',
      type: 'fill',
      source: 'kingston-mask',
      layout: {},
      paint: {
        'fill-color': '#000000', // Black
        'fill-opacity': 0.9     // Higher opacity for better masking
      }
    }, firstSymbolId);

    // Add a sharp white outline around Kingston (on the mask boundary)
    map.addLayer({
      id: 'kingston-outline',
      type: 'line',
      source: 'kingston-mask',
      paint: {
        'line-color': '#ffffff',
        'line-width': 2,
        'line-opacity': 0.8
      }
    }, firstSymbolId);

    console.log('Kingston mask applied successfully');
  } catch (error) {
    console.error('Error applying Kingston mask:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
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
    daycare: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>',
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

// Cache loaded icons to avoid reloading
let iconsLoaded = false;

// Load category icons into the map - optimized with caching
const loadCategoryIcons = async (map: mapboxgl.Map): Promise<void> => {
  // Skip if already loaded
  if (iconsLoaded) {
    // Verify icons still exist (in case map was recreated)
    if (map.hasImage('icon-hospitals')) return;
  }
  
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
    daycare: '#fcd34d',
  };

  // Load all icons in parallel for faster loading
  const loadPromises = Object.entries(categories).map(([category, color]) => {
    return new Promise<void>((resolve) => {
      if (map.hasImage(`icon-${category}`)) {
        resolve();
        return;
      }
      
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
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(); // Don't fail on icon errors
      };
      img.src = url;
    });
  });

  await Promise.all(loadPromises);
  iconsLoaded = true;
};

// Add service locations with glowing markers and labels
export const addServiceMarkers = async (
  map: mapboxgl.Map,
  services: ServiceLocation[],
  excludeIds: Set<string> = new Set()
): Promise<void> => {
  // Wait for map to be idle (fully loaded and rendered)
  if (!map.loaded()) {
    return new Promise((resolve) => {
      map.once('idle', () => {
        addServiceMarkers(map, services, excludeIds).then(resolve);
      });
    });
  }

  currentServices = services;

  // Load icons if not already loaded
  await loadCategoryIcons(map);

  // Remove existing marker layers and source (not labels)
  const markerLayersToRemove = [
    'service-markers-glow',
    'service-markers-core',
    'service-markers-icon',
    'service-markers-hit',
  ];
  markerLayersToRemove.forEach(layerId => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  if (map.getSource('services-markers')) {
    map.removeSource('services-markers');
  }

  // Filter out services that have building highlights (for markers only)
  const visibleServices = services.filter(s => !excludeIds.has(s.id));

  // Create GeoJSON for markers (filtered) - minimal properties to save memory
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
        category: service.category,
        color: CATEGORY_COLORS[service.category],
      },
    })),
  };

  // Add the markers source with clustering disabled for simplicity
  map.addSource('services-markers', {
    type: 'geojson',
    data: markersGeojson,
    tolerance: 0.5, // Simplify geometry for better performance
  });

  // Single colored circle layer (removed glow for memory savings)
  map.addLayer({
    id: 'service-markers-core',
    type: 'circle',
    source: 'services-markers',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        13, 6,
        16, 10,
        18, 14,
      ],
      'circle-color': ['get', 'color'],
      'circle-opacity': 1,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF',
    },
  });

  // Icon layer on top - interactive (smaller sizes)
  map.addLayer({
    id: 'service-markers-icon',
    type: 'symbol',
    source: 'services-markers',
    layout: {
      'icon-image': ['concat', 'icon-', ['get', 'category']],
      'icon-size': [
        'interpolate', ['linear'], ['zoom'],
        13, 0.4,
        16, 0.6,
        18, 0.8,
      ],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
    paint: {
      'icon-opacity': 1,
    },
  });

  // Hit detection layer - smaller radius
  map.addLayer({
    id: 'service-markers-hit',
    type: 'circle',
    source: 'services-markers',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        13, 10,
        16, 14,
        18, 18,
      ],
      'circle-color': 'rgba(0,0,0,0)',
      'circle-opacity': 0,
    },
  });
};

// Add labels separately - REMOVED separate source, reuse markers source
export const addServiceLabels = (
  map: mapboxgl.Map,
  services: ServiceLocation[]
): void => {
  // Wait for map to be loaded
  if (!map.loaded()) {
    map.once('idle', () => {
      addServiceLabels(map, services);
    });
    return;
  }

  // Remove existing labels layer only (source will be shared with markers)
  if (map.getLayer('service-labels')) {
    map.removeLayer('service-labels');
  }
  // Remove old separate source if it exists
  if (map.getSource('services-labels')) {
    map.removeSource('services-labels');
  }

  // Create a minimal labels-only source (only name needed)
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
      },
    })),
  };

  map.addSource('services-labels', {
    type: 'geojson',
    data: labelsGeojson,
    tolerance: 0.5,
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
        13, 9,
        15, 10,
        18, 12,
      ],
      'text-offset': [0, 2.0],  // Push text further down from icon
      'text-anchor': 'top',
      'text-max-width': 12,
      'text-allow-overlap': false,
      'text-optional': true,
      'text-ignore-placement': false,
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

// Fly to location - optimized for lower memory
export const flyToLocation = (
  map: mapboxgl.Map,
  coordinates: { latitude: number; longitude: number },
  zoom = 17 // Lower zoom = less memory
): void => {
  map.flyTo({
    center: [coordinates.longitude, coordinates.latitude],
    zoom,
    pitch: 45, // Lower pitch = less 3D memory
    bearing: map.getBearing(),
    essential: true,
    duration: 600, // Faster animation
    easing: (t) => t,
  });
};

// Enable 3D buildings layer - SIMPLIFIED for lower memory usage
export const enable3DBuildings = (map: mapboxgl.Map): void => {
  if (map.getLayer('3d-buildings')) {
    return;
  }

  // Use existing composite source if available (don't add new sources)
  const buildingSource = map.getSource('composite') ? 'composite' : null;
  
  // Skip 3D buildings if composite source not available (saves memory)
  if (!buildingSource) {
    console.log('Skipping 3D buildings - no composite source');
    return;
  }

  const style = map.getStyle();
  const labelLayerId = style?.layers?.find(layer => {
    const layout = layer.layout as { 'text-field'?: unknown } | undefined;
    return layer.type === 'symbol' && layout?.['text-field'];
  })?.id;

  // Add simplified 3D building extrusions (higher minzoom = fewer buildings rendered)
  map.addLayer(
    {
      id: '3d-buildings',
      source: buildingSource,
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 16, // Higher minzoom = less memory (was 15)
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          16,
          0,
          16.05,
          ['coalesce', ['get', 'height'], 8], // Lower default height
        ],
        'fill-extrusion-base': 0, // Simplified - no base offset
        'fill-extrusion-opacity': 0.6,
        'fill-extrusion-vertical-gradient': false, // Disable gradient for performance
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
