import type { ServiceLocation, ServiceCategory } from '@/types';
import { loadAllServicesSync } from '@/services/geoJsonLoader';

// Lazy load services only when first accessed
let cachedServices: ServiceLocation[] | null = null;

export const getKingstonServices = (): ServiceLocation[] => {
  if (!cachedServices) {
    cachedServices = loadAllServicesSync();
  }
  return cachedServices;
};

export const KINGSTON_SERVICES: ServiceLocation[] = getKingstonServices();

// Utility function to get services by category
export const getServicesByCategory = (category: ServiceCategory): ServiceLocation[] => {
  return KINGSTON_SERVICES.filter(service => service.category === category);
};

// Utility function to count services by category (cached)
let cachedCounts: Record<ServiceCategory, number> | null = null;

export const getServiceCounts = (): Record<ServiceCategory, number> => {
  if (!cachedCounts) {
    cachedCounts = getKingstonServices().reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {} as Record<ServiceCategory, number>);
  }
  return cachedCounts;
};

// Get all unique categories
export const getAllCategories = (): ServiceCategory[] => {
  return Array.from(new Set(KINGSTON_SERVICES.map(s => s.category)));
};
