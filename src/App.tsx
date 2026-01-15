import { useState, useRef } from 'react';
import { Map } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { ChatbotModal } from './components/ChatbotModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { KINGSTON_SERVICES } from './data/services';
import { useServiceFilter } from './hooks/useServiceFilter';
import type { ServiceLocation } from './types';

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<
    ServiceLocation | undefined
  >();
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { filterState, filteredServices, toggleCategory } =
    useServiceFilter(KINGSTON_SERVICES);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    // Min 240px, Max 480px
    if (newWidth >= 240 && newWidth <= 480) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  return (
    <div 
      ref={containerRef}
      className="h-screen relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Map - Full screen background */}
      <div className="absolute inset-0">
        <ErrorBoundary fallbackTitle="Map Error">
          <Map
            services={filteredServices}
            selectedService={selectedService}
            onServiceSelect={setSelectedService}
            filterState={filterState}
          />
        </ErrorBoundary>
      </div>

      {/* Sidebar with glass effect - Overlays the map */}
      <div 
        className="absolute top-0 left-0 h-full z-10 flex-shrink-0"
        style={{ 
          width: `${sidebarWidth}px`,
        }}
      >
        <ErrorBoundary fallbackTitle="Sidebar Error">
          <Sidebar
            services={filteredServices}
            selectedCategories={filterState.selectedCategories}
            onCategoryToggle={toggleCategory}
            onVoiceAssistantOpen={() => setIsChatbotOpen(true)}
          />
        </ErrorBoundary>
        
        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full bg-neutral-800 hover:bg-neutral-600 cursor-col-resize transition-colors group z-20"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-16 bg-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        services={filteredServices}
        sidebarWidth={sidebarWidth}
      />
    </div>
  );
}

export default App;
