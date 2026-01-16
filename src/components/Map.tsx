import { useEffect, useRef, useState, memo, useCallback } from 'react';
import type { MapProps } from '@/types';
import { KINGSTON_CENTER } from '@/types';
import {
  initializeMapbox,
  createMap,
  addServiceMarkers,
  addServiceLabels,
  flyToLocation,
  enable3DBuildings,
} from '@/services/mapService';
import mapboxgl from 'mapbox-gl';

const BUILDING_HIGHLIGHT_ZOOM_THRESHOLD = 17;

// Loading screen component - optimized with will-change for GPU acceleration
const LoadingScreen = memo(({ progress }: { progress: number }) => (
  <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 will-change-transform">
    <div className="text-center">
      {/* Logo/Title */}
      <h1 className="text-4xl font-bold text-white mb-2 tracking-wider">Kalibrate</h1>
      <p className="text-neutral-400 text-sm mb-8">Accessible Services Navigator</p>
      
      {/* Loading bar - GPU accelerated */}
      <div className="w-64 h-1 bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 will-change-transform"
          style={{ 
            width: `${progress}%`,
            transform: 'translateZ(0)', // Force GPU layer
            transition: 'width 150ms ease-out'
          }}
        />
      </div>
      
      {/* Loading text */}
      <p className="text-neutral-500 text-xs mt-4">
        {progress < 30 ? 'Initializing map...' : 
         progress < 60 ? 'Loading Kingston area...' : 
         progress < 90 ? 'Rendering services...' : 'Almost ready...'}
      </p>
    </div>
  </div>
));

LoadingScreen.displayName = 'LoadingScreen';

const MapComponent = ({
  services,
  selectedService,
  onServiceSelect,
  resetViewSignal,
  travelFrom,
  travelTo,
  travelRoute,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const wasAboveThreshold = useRef<boolean>(false);
  const markersAdded = useRef<boolean>(false);
  const handlersSetup = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Memoize services to prevent unnecessary re-renders
  const servicesRef = useRef(services);
  servicesRef.current = services;
  
  // Memoize onServiceSelect callback
  const onServiceSelectRef = useRef(onServiceSelect);
  onServiceSelectRef.current = onServiceSelect;

  // Memoized click handler to prevent recreating on every render
  const handleMarkerClick = useCallback((e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    const serviceId = feature.properties?.id;
    const service = servicesRef.current.find(s => s.id === serviceId);
    if (service) {
      onServiceSelectRef.current(service);
    }
  }, []);

  // Handler to reset map view to default
  const handleResetView = useCallback(() => {
    if (map.current) {
      map.current.flyTo({
        center: [KINGSTON_CENTER.longitude, KINGSTON_CENTER.latitude],
        zoom: KINGSTON_CENTER.zoom,
        bearing: KINGSTON_CENTER.bearing,
        pitch: KINGSTON_CENTER.pitch,
        essential: true,
        duration: 800,
        easing: (t) => t,
      });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Use requestAnimationFrame for smoother progress updates
      requestAnimationFrame(() => setLoadingProgress(10));
      initializeMapbox();
      requestAnimationFrame(() => setLoadingProgress(20));
      
      map.current = createMap(mapContainer.current, KINGSTON_CENTER);
      requestAnimationFrame(() => setLoadingProgress(30));

      map.current.on('style.load', () => {
        if (map.current) {
          requestAnimationFrame(() => setLoadingProgress(50));
          enable3DBuildings(map.current);
          requestAnimationFrame(() => setLoadingProgress(60));
        }
      });

      // Only refresh building highlights when crossing the zoom threshold
      map.current.on('zoomend', () => {
        if (!map.current) return;
        const zoom = map.current.getZoom();
        const isAboveThreshold = zoom >= BUILDING_HIGHLIGHT_ZOOM_THRESHOLD;

        if (isAboveThreshold !== wasAboveThreshold.current) {
          wasAboveThreshold.current = isAboveThreshold;
        }
      });

      map.current.on('load', async () => {
        requestAnimationFrame(() => setLoadingProgress(70));
        
        if (map.current && servicesRef.current.length > 0 && !markersAdded.current) {
          try {
            wasAboveThreshold.current = map.current.getZoom() >= BUILDING_HIGHLIGHT_ZOOM_THRESHOLD;
            requestAnimationFrame(() => setLoadingProgress(80));
            
            // Add labels and markers in parallel for faster loading
            const [, markersResult] = await Promise.all([
              Promise.resolve(addServiceLabels(map.current, servicesRef.current)),
              addServiceMarkers(map.current, servicesRef.current)
            ]);
            
            markersAdded.current = true;
            requestAnimationFrame(() => setLoadingProgress(90));
          } catch (err) {
            console.error('Error adding service markers:', err);
          }
        }
        
        requestAnimationFrame(() => {
          setLoadingProgress(100);
          // Use requestAnimationFrame for smooth transition
          requestAnimationFrame(() => setIsLoading(false));
        });
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        // Only show error for critical failures (like auth errors)
        // Don't fail on non-critical errors like missing tiles
        const errorStatus = (e.error as { status?: number })?.status;
        if (errorStatus === 401 || errorStatus === 403) {
          setError('Failed to load map. Please check your Mapbox token.');
          setIsLoading(false);
        }
      });

      // Cleanup
      return () => {
        map.current?.remove();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
      setIsLoading(false);
    }
  }, []);

  // Update service markers when services change (only after initial load)
  useEffect(() => {
    if (!map.current || isLoading || services.length === 0 || !markersAdded.current) return;

    // Only update if map is loaded
    if (!map.current.loaded()) {
      const onIdle = () => {
        if (map.current && services.length > 0) {
          addServiceLabels(map.current, services);
          addServiceMarkers(map.current, services);
        }
      };
      map.current.once('idle', onIdle);
      return () => {
        map.current?.off('idle', onIdle);
      };
    }

    // Map is ready, update markers
    const updateMarkers = async () => {
      try {
        addServiceLabels(map.current!, services);
        await addServiceMarkers(map.current!, services);
      } catch (err) {
        console.error('Error updating service markers:', err);
      }
    };
    updateMarkers();
  }, [services, isLoading]);

  // Add click handlers for service markers - optimized with refs
  useEffect(() => {
    if (!map.current || isLoading || handlersSetup.current) return;

    const handleMouseEnter = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    };

    const handleMouseLeave = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    };

    // Add click handlers for marker layers
    const markerLayers = ['service-markers-hit', 'service-markers-core', 'service-markers-icon', 'service-labels'];
    
    const setupHandlers = () => {
      if (handlersSetup.current) return;
      
      markerLayers.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.on('click', layerId, handleMarkerClick);
          map.current.on('mouseenter', layerId, handleMouseEnter);
          map.current.on('mouseleave', layerId, handleMouseLeave);
        }
      });
      handlersSetup.current = true;
    };

    // Setup handlers once map is idle (layers should exist)
    if (map.current.loaded()) {
      // Use requestAnimationFrame instead of setTimeout for better performance
      requestAnimationFrame(setupHandlers);
    } else {
      map.current.once('idle', () => {
        requestAnimationFrame(setupHandlers);
      });
    }

    return () => {
      markerLayers.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.off('click', layerId, handleMarkerClick);
          map.current.off('mouseenter', layerId, handleMouseEnter);
          map.current.off('mouseleave', layerId, handleMouseLeave);
        }
      });
      handlersSetup.current = false;
    };
  }, [isLoading, handleMarkerClick]);

  // Fly to selected service
  useEffect(() => {
    if (selectedService && map.current) {
      flyToLocation(map.current, selectedService.coordinates);
    }
  }, [selectedService]);

  // Show travel estimate line on the map
  useEffect(() => {
    if (!map.current) return;

    const updateRoute = () => {
      if (!map.current) return;
      const mapInstance = map.current;
      const fallbackCoordinates =
        travelFrom && travelTo
          ? [
              [travelFrom.coordinates.longitude, travelFrom.coordinates.latitude],
              [travelTo.coordinates.longitude, travelTo.coordinates.latitude],
            ]
          : null;
      const lineCoordinates =
        travelRoute?.coordinates && travelRoute.coordinates.length > 1
          ? travelRoute.coordinates
          : fallbackCoordinates;
      const hasRoute = Boolean(lineCoordinates && lineCoordinates.length > 1);

      if (!hasRoute) {
        if (mapInstance.getLayer('travel-route-line')) {
          mapInstance.removeLayer('travel-route-line');
        }
        if (mapInstance.getLayer('travel-route-points')) {
          mapInstance.removeLayer('travel-route-points');
        }
        if (mapInstance.getSource('travel-route')) {
          mapInstance.removeSource('travel-route');
        }
        return;
      }

      const routeGeojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: lineCoordinates,
            },
            properties: {},
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [travelFrom!.coordinates.longitude, travelFrom!.coordinates.latitude],
            },
            properties: { role: 'from' },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [travelTo!.coordinates.longitude, travelTo!.coordinates.latitude],
            },
            properties: { role: 'to' },
          },
        ],
      };

      if (mapInstance.getSource('travel-route')) {
        const source = mapInstance.getSource('travel-route') as mapboxgl.GeoJSONSource;
        source.setData(routeGeojson);
      } else {
        mapInstance.addSource('travel-route', {
          type: 'geojson',
          data: routeGeojson,
        });
        mapInstance.addLayer({
          id: 'travel-route-line',
          type: 'line',
          source: 'travel-route',
          filter: ['==', '$type', 'LineString'],
          paint: {
            'line-color': '#38bdf8',
            'line-width': 3,
            'line-opacity': 0.9,
          },
        });
        mapInstance.addLayer({
          id: 'travel-route-points',
          type: 'circle',
          source: 'travel-route',
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 6,
            'circle-color': [
              'match',
              ['get', 'role'],
              'from',
              '#22c55e',
              'to',
              '#f97316',
              '#38bdf8',
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      }

      const bounds = new mapboxgl.LngLatBounds();
      lineCoordinates.forEach((coordinate) =>
        bounds.extend(coordinate as [number, number])
      );
      mapInstance.fitBounds(bounds, { padding: 120, duration: 800 });
    };

    if (map.current.loaded()) {
      updateRoute();
    } else {
      map.current.once('load', updateRoute);
    }
  }, [travelFrom, travelTo, travelRoute]);

  // Reset map view when requested by parent
  useEffect(() => {
    if (!resetViewSignal) return;
    handleResetView();
  }, [resetViewSignal, handleResetView]);

  if (error) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-black"
        role="alert"
      >
        <div className="text-center p-8">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-white mb-2">
            Map Error
          </h2>
          <p className="text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black">
      {/* Loading screen with progress */}
      {isLoading && <LoadingScreen progress={loadingProgress} />}
      
      <div
        ref={mapContainer}
        className={`w-full h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        role="region"
        aria-label="Interactive map of Kingston services"
      />
    </div>
  );
};

export const Map = memo(MapComponent);
