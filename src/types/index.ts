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
  | 'community';

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
}

export const KINGSTON_CENTER: MapViewState = {
  latitude: 44.2312,
  longitude: -76.4860,
  zoom: 13,
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
