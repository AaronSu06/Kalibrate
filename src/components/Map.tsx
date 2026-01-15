import { useEffect, useRef, useState } from 'react';
import type { MapProps } from '@/types';
import { KINGSTON_CENTER } from '@/types';
import {
  initializeMapbox,
  createMap,
  addServiceMarkers,
  flyToLocation,
  enable3DBuildings,
  highlightServiceBuildings,
  refreshBuildingHighlights,
} from '@/services/mapService';
import type * as mapboxgl from 'mapbox-gl';

export const Map = ({
  services,
  selectedService,
  onServiceSelect,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
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

      // Refresh building highlights when map stops moving
      // (buildings can only be queried when rendered in viewport)
      map.current.on('idle', () => {
        if (map.current) {
          refreshBuildingHighlights(map.current);
        }
      });

      map.current.on('load', () => {
        setIsLoading(false);
        // Add service markers and building highlights on initial load
        if (map.current && services.length > 0) {
          try {
            addServiceMarkers(map.current, services);
            highlightServiceBuildings(map.current, services);
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

  // Update service markers when services change
  useEffect(() => {
    if (!map.current || isLoading || services.length === 0) return;

    try {
      // Update the GeoJSON source with new service data
      addServiceMarkers(map.current, services);
      highlightServiceBuildings(map.current, services);
    } catch (err) {
      console.error('Error updating service markers:', err);
    }
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

    // Wait for layer to exist before adding handlers
    if (map.current.getLayer('service-circles')) {
      map.current.on('click', 'service-circles', handleClick);
      map.current.on('mouseenter', 'service-circles', handleMouseEnter);
      map.current.on('mouseleave', 'service-circles', handleMouseLeave);
    }

    return () => {
      if (map.current) {
        map.current.off('click', 'service-circles', handleClick);
        map.current.off('mouseenter', 'service-circles', handleMouseEnter);
        map.current.off('mouseleave', 'service-circles', handleMouseLeave);
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
