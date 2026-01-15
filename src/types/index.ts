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
}

export type ServiceCategory =
  | 'healthcare'
  | 'grocery'
  | 'banking'
  | 'pharmacy'
  | 'transportation'
  | 'community'
  | 'recreation';

// Category colors for map visualization (bright neon colors)
export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  healthcare: '#FF3366',
  grocery: '#39FF14',
  banking: '#00BFFF',
  pharmacy: '#BF00FF',
  transportation: '#FFFF00',
  community: '#00FFFF',
  recreation: '#FF69B4',
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
  latitude: 44.231416,
  longitude: -76.483071,
  zoom: 15.39,
  pitch: 69,
  bearing: 0,
};

// Chatbot types
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
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
}

export interface SidebarProps {
  services: ServiceLocation[];
  selectedCategories: ServiceCategory[];
  onCategoryToggle: (category: ServiceCategory) => void;
  onVoiceAssistantOpen: () => void;
}

export interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceLocation[];
  sidebarWidth: number;
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
