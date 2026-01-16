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
import type * as mapboxgl from 'mapbox-gl';

const BUILDING_HIGHLIGHT_ZOOM_THRESHOLD = 17;

// Loading screen component - optimized with will-change for GPU acceleration
const LoadingScreen = memo(({ progress }: { progress: number }) => (
  <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 will-change-transform">
    <div className="text-center">
      {/* Logo/Title */}
      <h1 className="text-4xl font-bold text-white mb-2 tracking-wider">Kalibrate</h1>
      <p className="text-neutral-400 text-sm mb-8">Kingston Service Locator</p>
      
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
