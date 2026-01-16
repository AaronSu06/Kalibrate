import { useEffect, useRef, useState, memo } from 'react';
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

const MapComponent = ({
  services,
  selectedService,
  onServiceSelect,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const wasAboveThreshold = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      initializeMapbox();
      map.current = createMap(mapContainer.current, KINGSTON_CENTER);

      map.current.on('style.load', () => {
        if (map.current) {
          enable3DBuildings(map.current);
        }
      });

      // Only refresh building highlights when crossing the zoom threshold
      map.current.on('zoomend', () => {
        if (!map.current) return;
        const zoom = map.current.getZoom();
        const isAboveThreshold = zoom >= BUILDING_HIGHLIGHT_ZOOM_THRESHOLD;

        // Only refresh if we crossed the threshold
        if (isAboveThreshold !== wasAboveThreshold.current) {
          wasAboveThreshold.current = isAboveThreshold;
          // highlightServiceBuildings(map.current, services);
        }
      });

      map.current.on('load', () => {
        setIsLoading(false);
        // Add service markers, labels, and building highlights on initial load
        if (map.current && services.length > 0) {
          try {
            // Initialize threshold state
            wasAboveThreshold.current = map.current.getZoom() >= BUILDING_HIGHLIGHT_ZOOM_THRESHOLD;
            addServiceLabels(map.current, services); // Labels always visible
            addServiceMarkers(map.current, services); // Markers can be hidden
            // highlightServiceBuildings(map.current, services);
          } catch (err) {
            console.error('Error adding service markers:', err);
          }
        }
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

  // Update service markers when services change (debounced for performance)
  useEffect(() => {
    if (!map.current || isLoading || services.length === 0) return;

    // Use requestAnimationFrame to batch updates
    const animationFrameId = requestAnimationFrame(() => {
      if (!map.current) return;
      
      try {
        // Update labels and markers with new service data
        addServiceLabels(map.current, services); // Labels always show all
        addServiceMarkers(map.current, services); // Markers can be filtered
        // highlightServiceBuildings(map.current, services);
      } catch (err) {
        console.error('Error updating service markers:', err);
      }
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [services, isLoading]);

  // Add click handlers for service markers
  useEffect(() => {
    if (!map.current || isLoading) return;

    const handleClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const serviceId = feature.properties?.id;

      // Find the service by ID
      const service = services.find(s => s.id === serviceId);
      if (service) {
        onServiceSelect(service);
      }
    };

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

    // Add click handlers for markers
    const markerLayers = ['service-markers-core', 'service-labels'];
    markerLayers.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.on('click', layerId, handleClick);
        map.current.on('mouseenter', layerId, handleMouseEnter);
        map.current.on('mouseleave', layerId, handleMouseLeave);
      }
    });

    return () => {
      if (map.current) {
        markerLayers.forEach(layerId => {
          map.current?.off('click', layerId, handleClick);
          map.current?.off('mouseenter', layerId, handleMouseEnter);
          map.current?.off('mouseleave', layerId, handleMouseLeave);
        });
      }
    };
  }, [services, isLoading, onServiceSelect]);

  // Fly to selected service
  useEffect(() => {
    if (selectedService && map.current) {
      flyToLocation(map.current, selectedService.coordinates);
    }
  }, [selectedService]);

  if (error) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-gray-100"
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Map Error
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-white z-10"
          role="status"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
            <span className="sr-only">Loading map</span>
          </div>
        </div>
      )}
      <div
        ref={mapContainer}
        className="w-full h-full"
        role="region"
        aria-label="Interactive map of Kingston services"
      />
    </div>
  );
};

export const Map = memo(MapComponent);
