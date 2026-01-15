import type { ServiceCategory } from '@/types';

// Map Food.geojson USER_Type values to categories
const FOOD_TYPE_MAPPING: Record<string, ServiceCategory> = {
  // Grocery-related
  'Low-cost Grocery Store': 'grocery',
  'Cultural Food Store': 'grocery',
  'Farm Stand': 'grocery',
  'Farmers Market': 'grocery',
  'Fresh Food Market Pop-Ups': 'grocery',

  // Community-related (food programs, gardens, etc.)
  'Community Café': 'community',
  'Community Food Programs': 'community',
  'Community Food  Programs': 'community', // Note: data has double space
  'Community Food Programs ': 'community', // Note: trailing space
  'Community Gardens': 'community',
  'Community Garden??s - Municipal Land': 'community', // Note: encoding issue in data
  'Community Gardens - Municipal Land': 'community',
  'Community Orchards and Food Forests': 'community',
  'Community Orchards and Food Forests - Municipal Land': 'community',
  'Meal Provider Program': 'community',
};

// Map PointsOfinterest.geojson POI_TYPE_DESC values to categories
const POI_TYPE_MAPPING: Record<string, ServiceCategory> = {
  // Healthcare
  Hospital: 'healthcare',
  'Health Centre': 'healthcare',
  'Ambulance Station': 'healthcare',
  'Long Term Care': 'healthcare',
  'Retirement Residence': 'healthcare',

  // Transportation
  'Bus Transfer Station': 'transportation',
  'Train Station': 'transportation',
  'Ferry Dock': 'transportation',
  'Ferry Terminal': 'transportation',
  Airport: 'transportation',
  'Airport Facility': 'transportation',
  'Park and Ride': 'transportation',

  // Community services
  'Community Centre': 'community',
  'Community Service': 'community',
  'Community Garden': 'community',
  Library: 'community',
  'Seniors Centre': 'community',
  'Settlement Services': 'community',
  'Social Services': 'community',
  'Childcare Facility': 'community',
  'Childcare Facility (Private)': 'community',
  'Childcare Programs': 'community',
  'Place of Worship': 'community',
  'Post Office': 'community',
  'Military Family Resource Centre': 'community',

  // Recreation
  Park: 'recreation',
  Parkette: 'recreation',
  'Open Space': 'recreation',
  Arena: 'recreation',
  'Aquatics Centre - Private': 'recreation',
  'Outdoor Aquatics Centre - Public': 'recreation',
  'Swimming Pool - Public': 'recreation',
  Beach: 'recreation',
  'Golf Course': 'recreation',
  'Driving Range': 'recreation',
  'Soccer Field': 'recreation',
  'Soccer Fields': 'recreation',
  'Soccer/Football Field': 'recreation',
  'Mini Soccer Field': 'recreation',
  'Baseball Field': 'recreation',
  'Basketball Court': 'recreation',
  'Tennis Court': 'recreation',
  'Pickleball Court': 'recreation',
  'Multi Courts': 'recreation',
  'Multi Use Court': 'recreation',
  'Multi-Use Court': 'recreation',
  'Sports Field': 'recreation',
  'Athletic Centre': 'recreation',
  'Recreation Centre': 'recreation',
  'Recreation Facility': 'recreation',
  'Private Recreation Facility': 'recreation',
  'Running Track': 'recreation',
  'Track & Field': 'recreation',
  Playground: 'recreation',
  'Play Structure': 'recreation',
  'Playground Structure': 'recreation',
  'Playground Swingset': 'recreation',
  Swingset: 'recreation',
  Climber: 'recreation',
  Slide: 'recreation',
  'Teeter Toter': 'recreation',
  'Splash Pad': 'recreation',
  'Water Park': 'recreation',
  'Off-Leash Dog Park': 'recreation',
  'Outdoor Rink (Community)': 'recreation',
  'Outdoor Rink (Staffed)': 'recreation',
  'Outdoor Rink (Unstaffed)': 'recreation',
  'Outdoor Rink (Community)(Not 2021)': 'recreation',
  'Lawn Bowling': 'recreation',
  'Beach Volleyball Court': 'recreation',
  Shuffleboard: 'recreation',
  Marina: 'recreation',
  'Boat Ramp': 'recreation',
  'Trail Access': 'recreation',
  'Trail Access & Parking': 'recreation',
  'Trail/Pathway': 'recreation',
  'Trailhead & Parking': 'recreation',
  Museum: 'recreation',
  Gallery: 'recreation',
  Theatre: 'recreation',
  'Performing Arts Centre': 'recreation',
  'Historic Site': 'recreation',
  'Heritage Site': 'recreation',
  'Batting Cage': 'recreation',
};

export function mapFoodTypeToCategory(
  userType: string | null | undefined
): ServiceCategory | null {
  if (!userType) return null;
  return FOOD_TYPE_MAPPING[userType.trim()] ?? null;
}

export function mapPOITypeToCategory(
  poiTypeDesc: string | null | undefined
): ServiceCategory | null {
  if (!poiTypeDesc) return null;
  return POI_TYPE_MAPPING[poiTypeDesc] ?? null;
}
