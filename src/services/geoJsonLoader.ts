import type { ServiceLocation, ServiceCategory } from '@/types';

// Import the new categorized services data
import KingstonServices from '@/data/kingston_services.json';

interface RawService {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: string;
  details: Record<string, unknown>;
}

type KingstonServicesData = Record<string, RawService[]>;

function parseServices(data: KingstonServicesData): ServiceLocation[] {
  const services: ServiceLocation[] = [];

  for (const [category, items] of Object.entries(data)) {
    for (const item of items) {
      const [longitude, latitude] = item.coordinates;

      services.push({
        id: item.id,
        name: item.name || 'Unknown Location',
        category: category as ServiceCategory,
        address: item.address || '',
        coordinates: { latitude, longitude },
        description: item.type || '',
        details: item.details && Object.keys(item.details).length > 0 ? item.details : undefined,
      });
    }
  }

  return services;
}

export function loadAllServicesSync(): ServiceLocation[] {
  return parseServices(KingstonServices as unknown as KingstonServicesData);
}
