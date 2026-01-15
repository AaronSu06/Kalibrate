import type { ServiceLocation, ServiceCategory } from '@/types';
import { loadAllServicesSync } from '@/services/geoJsonLoader';

// Load services from GeoJSON files at module initialization
export const KINGSTON_SERVICES: ServiceLocation[] = loadAllServicesSync();

// Utility function to get services by category
export const getServicesByCategory = (category: ServiceCategory): ServiceLocation[] => {
  return KINGSTON_SERVICES.filter(service => service.category === category);
};

// Utility function to count services by category
export const getServiceCounts = (): Record<ServiceCategory, number> => {
  return KINGSTON_SERVICES.reduce((acc, service) => {
    acc[service.category] = (acc[service.category] || 0) + 1;
    return acc;
  }, {} as Record<ServiceCategory, number>);
};

// Get all unique categories
export const getAllCategories = (): ServiceCategory[] => {
  return Array.from(new Set(KINGSTON_SERVICES.map(s => s.category)));
};
