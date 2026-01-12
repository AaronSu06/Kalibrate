import { useEffect, useRef, useState } from 'react';
import type { MapProps } from '@/types';
import { KINGSTON_CENTER } from '@/types';
import {
  initializeMapbox,
  createMap,
  addMarker,
  flyToLocation,
} from '@/services/mapService';
import type * as mapboxgl from 'mapbox-gl';

export const Map = ({
  services,
  selectedService,
  onServiceSelect,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      initializeMapbox();
      map.current = createMap(mapContainer.current, KINGSTON_CENTER);

      map.current.on('load', () => {
        setIsLoading(false);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Failed to load map. Please check your Mapbox token.');
        setIsLoading(false);
      });

      // Cleanup
      return () => {
        markers.current.forEach(marker => marker.remove());
        map.current?.remove();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
      setIsLoading(false);
    }
  }, []);

  // Update markers when services change
  useEffect(() => {
    if (!map.current || isLoading) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for filtered services
    services.forEach(service => {
      const marker = addMarker(map.current!, service, onServiceSelect);
      markers.current.push(marker);
    });
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
        className="flex-1 flex items-center justify-center bg-gray-100"
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
    <div className="flex-1 relative">
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
