// Core data types
export interface ServiceLocation {
  id: string;
  name: string;
  category: ServiceCategory;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description: string;
  phone?: string;
  website?: string;
  hours?: string;
  accessibilityFeatures?: AccessibilityFeature[];
  details?: Record<string, unknown>;
}

export type ServiceCategory =
  | 'hospitals'
  | 'clinics'
  | 'grocery'
  | 'transportation'
  | 'religious'
  | 'gardens'
  | 'entertainment'
  | 'education'
  | 'government'
  | 'emergency'
  | 'housing'
  | 'fitness'
  | 'banks'
  | 'libraries'
  | 'daycare';

// Category colors for map visualization (bright neon colors)
export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  hospitals: '#FF3366',
  clinics: '#BF00FF',
  grocery: '#39FF14',
  transportation: '#FFFF00',
  religious: '#E6E6FA',
  gardens: '#32CD32',
  entertainment: '#FF69B4',
  education: '#00BFFF',
  government: '#FFB347',
  emergency: '#FF4500',
  housing: '#FF8C00',
  fitness: '#00FF7F',
  banks: '#00CED1',
  libraries: '#9370DB',
  daycare: '#FFB6C1',
};

export type AccessibilityFeature =
  | 'wheelchair_accessible'
  | 'hearing_loop'
  | 'braille_signage'
  | 'accessible_parking'
  | 'elevator'
  | 'automatic_doors';

// Map types
export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export const KINGSTON_CENTER: MapViewState = {
  latitude: 44.228878,
  longitude: -76.483577,
  zoom: 16.59,
  pitch: 78.47,
  bearing: -16.40,
};

// Chatbot types
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  actions?: ChatAction[];
}

export interface ChatAction {
  id: string;
  label: string;
  kind: 'show_on_map' | 'show_details';
  serviceId: string;
}

export interface VoiceInputState {
  isRecording: boolean;
  isProcessing: boolean;
  error?: string;
}

// Filter types
export interface FilterState {
  selectedCategories: ServiceCategory[];
  searchQuery: string;
}

// Component prop types
export interface MapProps {
  services: ServiceLocation[];
  selectedService?: ServiceLocation;
  onServiceSelect: (service: ServiceLocation) => void;
  filterState: FilterState;
  resetViewSignal?: number;
  travelFrom?: ServiceLocation | null;
  travelTo?: ServiceLocation | null;
  travelRoute?: GeoJSON.LineString | null;
}

export interface SidebarProps {
  services: ServiceLocation[];
  allServices: ServiceLocation[];
  selectedCategories: ServiceCategory[];
  onCategoryToggle: (category: ServiceCategory) => void;
  onVoiceAssistantOpen: () => void;
  selectedService?: ServiceLocation;
  onServiceClose: () => void;
  onServiceSelect?: (service: ServiceLocation) => void;
  travelFrom?: ServiceLocation | null;
  travelTo?: ServiceLocation | null;
  onTravelChange?: (from: ServiceLocation | null, to: ServiceLocation | null) => void;
  travelEstimate?: TravelEstimate | null;
  travelLoading?: boolean;
  travelError?: string | null;
}

export interface TravelEstimate {
  distanceKm: number;
  walkingMinutes: number;
  drivingMinutes: number;
}

export interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceLocation[];
  sidebarWidth: number;
  onServiceSelect?: (serviceId: string) => void;
}

export interface CategoryListProps {
  selectedCategories: ServiceCategory[];
  onToggle: (category: ServiceCategory) => void;
  serviceCounts: Record<ServiceCategory, number>;
}

// Utility types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}
