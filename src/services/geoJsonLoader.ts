import type { ServiceLocation } from '@/types';
import { mapFoodTypeToCategory, mapPOITypeToCategory } from './categoryMapping';

// Import GeoJSON files (stored as .json for Vite compatibility)
import FoodData from '@/data/Food.json';
import POIData from '@/data/PointsOfinterest.json';

interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
    properties: Record<string, unknown>;
  }>;
}

function generateId(prefix: string, objectId: number): string {
  return `${prefix}-${objectId}`;
}

function parseFoodFeatures(data: GeoJSONCollection): ServiceLocation[] {
  const services: ServiceLocation[] = [];

  for (const feature of data.features) {
    const props = feature.properties;
    const userType = props.USER_Type as string | undefined;
    const category = mapFoodTypeToCategory(userType);

    if (!category) continue; // Skip unmapped types

    const [longitude, latitude] = feature.geometry.coordinates;

    services.push({
      id: generateId('food', props.OBJECTID as number),
      name:
        (props.USER_Community_Food_Resource_Na as string) ||
        'Unknown Food Resource',
      category,
      address: (props.USER_Address as string) || '',
      coordinates: { latitude, longitude },
      description: `${userType} - ${(props.USER_Affordability as string) || 'Contact for pricing'}`,
      website: props.USER_More_information as string | undefined,
    });
  }

  return services;
}

function parsePOIFeatures(data: GeoJSONCollection): ServiceLocation[] {
  const services: ServiceLocation[] = [];

  for (const feature of data.features) {
    const props = feature.properties;
    const poiTypeDesc = props.POI_TYPE_DESC as string | undefined;
    const category = mapPOITypeToCategory(poiTypeDesc);

    if (!category) continue; // Skip unmapped types

    const [longitude, latitude] = feature.geometry.coordinates;

    services.push({
      id: generateId('poi', props.OBJECTID as number),
      name:
        (props.POI_NAME as string) ||
        (props.MAP_LABEL as string) ||
        'Unknown Location',
      category,
      address: (props.ADDRESS as string) || '',
      coordinates: { latitude, longitude },
      description: (props.SUB_DESCRIPTION as string) || poiTypeDesc || '',
      website: props.URL as string | undefined,
    });
  }

  return services;
}

export function loadAllServicesSync(): ServiceLocation[] {
  const foodServices = parseFoodFeatures(FoodData as unknown as GeoJSONCollection);
  const poiServices = parsePOIFeatures(POIData as unknown as GeoJSONCollection);
  return [...foodServices, ...poiServices];
}
