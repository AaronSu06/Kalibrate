import { useState } from 'react';
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

  const { filterState, filteredServices, toggleCategory } =
    useServiceFilter(KINGSTON_SERVICES);

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar - 30% width on desktop, full width on mobile */}
      <ErrorBoundary fallbackTitle="Sidebar Error">
        <Sidebar
          services={filteredServices}
          selectedCategories={filterState.selectedCategories}
          onCategoryToggle={toggleCategory}
          onVoiceAssistantOpen={() => setIsChatbotOpen(true)}
        />
      </ErrorBoundary>

      {/* Map - 70% width on desktop, full width on mobile */}
      <ErrorBoundary fallbackTitle="Map Error">
        <Map
          services={filteredServices}
          selectedService={selectedService}
          onServiceSelect={setSelectedService}
          filterState={filterState}
        />
      </ErrorBoundary>

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        services={filteredServices}
      />
    </div>
  );
}

export default App;
