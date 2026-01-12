import type { ServiceLocation, ServiceCategory } from '@/types';

export const KINGSTON_SERVICES: ServiceLocation[] = [
  // Healthcare
  {
    id: 'kgh-1',
    name: 'Kingston General Hospital',
    category: 'healthcare',
    address: '76 Stuart St, Kingston, ON K7L 2V7',
    coordinates: {
      latitude: 44.2303,
      longitude: -76.4859,
    },
    description: 'Major hospital with emergency services',
    phone: '613-548-3232',
    website: 'https://kingstonhsc.ca',
    hours: '24/7',
    accessibilityFeatures: ['wheelchair_accessible', 'elevator', 'accessible_parking'],
  },
  {
    id: 'hotel-dieu-1',
    name: 'Hotel Dieu Hospital',
    category: 'healthcare',
    address: '166 Brock St, Kingston, ON K7L 5G2',
    coordinates: {
      latitude: 44.2341,
      longitude: -76.4812,
    },
    description: 'Community hospital with specialized care',
    phone: '613-544-3310',
    website: 'https://hoteldieu.com',
    hours: '24/7',
    accessibilityFeatures: ['wheelchair_accessible', 'elevator', 'automatic_doors'],
  },

  // Groceries
  {
    id: 'metro-princess-1',
    name: 'Metro - Princess Street',
    category: 'grocery',
    address: '1201 Princess St, Kingston, ON K7M 3E1',
    coordinates: {
      latitude: 44.2389,
      longitude: -76.5156,
    },
    description: 'Full-service grocery store',
    phone: '613-544-7529',
    hours: 'Mon-Sun 7am-10pm',
    accessibilityFeatures: ['wheelchair_accessible', 'accessible_parking', 'automatic_doors'],
  },
  {
    id: 'freshco-1',
    name: 'FreshCo Kingston Centre',
    category: 'grocery',
    address: '805 Gardiners Rd, Kingston, ON K7M 7E6',
    coordinates: {
      latitude: 44.2518,
      longitude: -76.5289,
    },
    description: 'Discount grocery store',
    phone: '613-384-4848',
    hours: 'Mon-Sun 8am-9pm',
    accessibilityFeatures: ['wheelchair_accessible', 'accessible_parking'],
  },

  // Banking
  {
    id: 'rbc-princess-1',
    name: 'RBC Royal Bank - Princess',
    category: 'banking',
    address: '150 Princess St, Kingston, ON K7L 1B1',
    coordinates: {
      latitude: 44.2313,
      longitude: -76.4803,
    },
    description: 'Full-service bank branch',
    phone: '613-549-9505',
    hours: 'Mon-Fri 9am-5pm',
    accessibilityFeatures: ['wheelchair_accessible', 'automatic_doors', 'hearing_loop'],
  },
  {
    id: 'td-bath-1',
    name: 'TD Canada Trust - Bath Road',
    category: 'banking',
    address: '990 Gardiners Rd, Kingston, ON K7P 2Y2',
    coordinates: {
      latitude: 44.2545,
      longitude: -76.5356,
    },
    description: 'Bank branch with extended hours',
    phone: '613-389-5850',
    hours: 'Mon-Fri 9am-6pm, Sat 9am-4pm',
    accessibilityFeatures: ['wheelchair_accessible', 'accessible_parking', 'automatic_doors'],
  },

  // Pharmacies
  {
    id: 'shoppers-1',
    name: "Shoppers Drug Mart - Princess",
    category: 'pharmacy',
    address: '262 Princess St, Kingston, ON K7L 1B5',
    coordinates: {
      latitude: 44.2313,
      longitude: -76.4863,
    },
    description: 'Pharmacy and wellness store',
    phone: '613-544-4114',
    hours: 'Mon-Sun 8am-10pm',
    accessibilityFeatures: ['wheelchair_accessible', 'automatic_doors'],
  },
];

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
