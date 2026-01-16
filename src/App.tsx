import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { Map } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { ChatbotModal } from './components/ChatbotModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingCategoryBar } from './components/FloatingCategoryBar';
import { KINGSTON_SERVICES } from './data/services';
import { useServiceFilter } from './hooks/useServiceFilter';
import type { ServiceLocation } from './types';
import type { TravelEstimate } from './types';
import { getRoute } from './services/directionsService';

// Memoize ErrorBoundary wrappers to prevent unnecessary rerenders
const MemoizedMap = memo(Map);
const MemoizedSidebar = memo(Sidebar);

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<
    ServiceLocation | undefined
  >();
  const [travelFrom, setTravelFrom] = useState<ServiceLocation | null>(null);
  const [travelTo, setTravelTo] = useState<ServiceLocation | null>(null);
  const [travelRoute, setTravelRoute] = useState<GeoJSON.LineString | null>(null);
  const [travelEstimate, setTravelEstimate] = useState<TravelEstimate | null>(null);
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelError, setTravelError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const [resetViewSignal, setResetViewSignal] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { filterState, filteredServices, toggleCategory } =
    useServiceFilter(KINGSTON_SERVICES);

  // Memoize the sidebar style to prevent object recreation
  const sidebarStyle = useMemo(() => ({ width: `${sidebarWidth}px` }), [sidebarWidth]);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    // Min 300px, Max 560px
    if (newWidth >= 300 && newWidth <= 560) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleChatbotOpen = useCallback(() => {
    setIsChatbotOpen(true);
  }, []);

  const handleChatbotClose = useCallback(() => {
    setIsChatbotOpen(false);
  }, []);

  const handleServiceClose = useCallback(() => {
    setSelectedService(undefined);
  }, []);

  // Memoize the service select handler
  const handleServiceSelect = useCallback((service: ServiceLocation) => {
    setSelectedService(service);
  }, []);

  const handleResetView = useCallback(() => {
    setResetViewSignal((value) => value + 1);
  }, []);

  const handleTravelChange = useCallback(
    (from: ServiceLocation | null, to: ServiceLocation | null) => {
      setTravelFrom(from);
      setTravelTo(to);
    },
    []
  );

  useEffect(() => {
    if (!travelFrom || !travelTo) {
      setTravelRoute(null);
      setTravelEstimate(null);
      setTravelError(null);
      setTravelLoading(false);
      return;
    }

    const controller = new AbortController();
    const loadRoutes = async () => {
      setTravelLoading(true);
      setTravelError(null);
      try {
        const [drivingRoute, walkingRoute] = await Promise.all([
          getRoute('driving', travelFrom, travelTo, controller.signal),
          getRoute('walking', travelFrom, travelTo, controller.signal),
        ]);

        const distanceKm =
          (drivingRoute?.distance ?? walkingRoute?.distance ?? 0) / 1000;
        setTravelEstimate({
          distanceKm,
          drivingMinutes: drivingRoute.duration / 60,
          walkingMinutes: walkingRoute.duration / 60,
        });
        setTravelRoute(drivingRoute.geometry ?? walkingRoute.geometry ?? null);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setTravelError(err instanceof Error ? err.message : 'Failed to load directions');
        setTravelEstimate(null);
        setTravelRoute(null);
      } finally {
        setTravelLoading(false);
      }
    };

    loadRoutes();
    return () => {
      controller.abort();
    };
  }, [travelFrom, travelTo]);
  return (
    <div 
      ref={containerRef}
      className={`h-screen relative overflow-hidden ${isResizing ? 'select-none' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Map - Full screen background */}
      <div className="absolute inset-0">
        <ErrorBoundary fallbackTitle="Map Error">
          <MemoizedMap
            services={filteredServices}
            selectedService={selectedService}
            onServiceSelect={handleServiceSelect}
            filterState={filterState}
            resetViewSignal={resetViewSignal}
            travelFrom={travelFrom}
            travelTo={travelTo}
            travelRoute={travelRoute}
          />
        </ErrorBoundary>
      </div>

      {/* Floating Category Bar - Quick filters above map */}
      <FloatingCategoryBar
        selectedCategories={filterState.selectedCategories}
        onCategoryToggle={toggleCategory}
        sidebarWidth={sidebarWidth}
        onResetView={handleResetView}
      />

      {/* Sidebar with glass effect - Overlays the map */}
      <div 
        className="absolute top-0 left-0 h-full z-10 flex-shrink-0"
        style={sidebarStyle}
      >
        <ErrorBoundary fallbackTitle="Sidebar Error">
          <MemoizedSidebar
            services={filteredServices}
            allServices={KINGSTON_SERVICES}
            selectedCategories={filterState.selectedCategories}
            onCategoryToggle={toggleCategory}
            onVoiceAssistantOpen={handleChatbotOpen}
            selectedService={selectedService}
            onServiceClose={handleServiceClose}
            onServiceSelect={handleServiceSelect}
            travelFrom={travelFrom}
            travelTo={travelTo}
            onTravelChange={handleTravelChange}
            travelEstimate={travelEstimate}
            travelLoading={travelLoading}
            travelError={travelError}
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
        onClose={handleChatbotClose}
        services={filteredServices}
        sidebarWidth={sidebarWidth}
      />
    </div>
  );
}

export default App;
