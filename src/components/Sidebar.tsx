import { memo, useState, useMemo } from 'react';
import type { SidebarProps, ServiceLocation } from '@/types';
import { CategoryList } from './CategoryList';
import { ServiceDetail } from './ServiceDetail';
import { getServiceCounts, KINGSTON_SERVICES } from '@/data/services';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';
import kalibrateLogo from '@/public/kali.webp';

// Search result item component
const SearchResultItem = memo(({ 
  service, 
  onSelect 
}: { 
  service: ServiceLocation; 
  onSelect: (service: ServiceLocation) => void;
}) => (
  <button
    onClick={() => onSelect(service)}
    className="w-full text-left px-3 py-2 rounded-md hover:bg-white/[0.06] transition-colors"
  >
    <div className="text-sm text-white/90 truncate">{service.name}</div>
    <div className="text-xs text-white/45 truncate">{service.address}</div>
  </button>
));

SearchResultItem.displayName = 'SearchResultItem';

const SidebarComponent = ({
  services,
  allServices,
  selectedCategories,
  onCategoryToggle,
  onVoiceAssistantOpen,
  selectedService,
  onServiceClose,
  onServiceSelect,
  travelFrom,
  travelTo,
  onTravelChange,
  travelEstimate,
  travelLoading,
  travelError,
}: SidebarProps) => {
  const serviceCounts = getServiceCounts();
  const [searchQuery, setSearchQuery] = useState('');
  const [travelFromQuery, setTravelFromQuery] = useState(travelFrom?.name ?? '');
  const [travelToQuery, setTravelToQuery] = useState(travelTo?.name ?? '');

  // Improved search with relevance scoring
  const getSearchResults = (queryText: string) => {
    if (!queryText.trim()) return [];
    const query = queryText.toLowerCase().trim();
    const queryWords = query.split(/\s+/);

    return KINGSTON_SERVICES
      .map(service => {
        const name = service.name.toLowerCase();
        const address = service.address.toLowerCase();
        const description = service.description?.toLowerCase() || '';
        const category = service.category.toLowerCase();

        let score = 0;

        // Exact name match (highest priority)
        if (name === query) score += 100;
        // Name starts with query
        else if (name.startsWith(query)) score += 50;
        // Name contains query as a word
        else if (name.includes(` ${query}`) || name.includes(`${query} `)) score += 40;
        // Name contains query
        else if (name.includes(query)) score += 30;

        // Check each query word
        for (const word of queryWords) {
          if (word.length < 2) continue;
          // Word match in name
          if (name.split(/\s+/).some(w => w.startsWith(word))) score += 20;
          // Word match in address
          if (address.split(/\s+/).some(w => w.startsWith(word))) score += 10;
          // Category match
          if (category.includes(word)) score += 15;
          // Description match
          if (description.includes(word)) score += 5;
        }

        // Address contains full query
        if (address.includes(query)) score += 8;

        return { service, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.service);
  };

  const searchResults = useMemo(() => getSearchResults(searchQuery), [searchQuery]);
  const travelFromResults = useMemo(() => getSearchResults(travelFromQuery), [travelFromQuery]);
  const travelToResults = useMemo(() => getSearchResults(travelToQuery), [travelToQuery]);
  const showTravelFromResults =
    travelFromQuery.trim().length > 0 &&
    travelFromResults.length > 0 &&
    travelFromQuery !== travelFrom?.name;
  const showTravelToResults =
    travelToQuery.trim().length > 0 &&
    travelToResults.length > 0 &&
    travelToQuery !== travelTo?.name;

  const formatMinutes = (minutes: number) => {
    if (minutes < 1) return '<1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    let hours = Math.floor(minutes / 60);
    let mins = Math.round(minutes % 60);
    if (mins === 60) {
      hours += 1;
      mins = 0;
    }
    return `${hours} hr ${mins} min`;
  };

  const handleSearchSelect = (service: ServiceLocation) => {
    setSearchQuery('');
    onServiceSelect?.(service);
  };

  const handleTravelFromSelect = (service: ServiceLocation) => {
    setTravelFromQuery(service.name);
    onTravelChange?.(service, travelTo ?? null);
  };

  const handleTravelToSelect = (service: ServiceLocation) => {
    setTravelToQuery(service.name);
    onTravelChange?.(travelFrom ?? null, service);
  };

  const handleSwapTravel = () => {
    if (!onTravelChange) return;
    onTravelChange(travelTo ?? null, travelFrom ?? null);
    setTravelFromQuery(travelTo?.name ?? '');
    setTravelToQuery(travelFrom?.name ?? '');
  };

  return (
    <LiquidGlassCard
      square
      singleLayer
      className="w-full h-full border-white/10 bg-neutral-950/60 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    >
      <aside
        className="relative w-full h-full flex flex-col text-white overflow-hidden"
        aria-label="Service categories and filters"
      >
        {selectedService ? (
          <ServiceDetail
            service={selectedService}
            allServices={allServices}
            onBack={onServiceClose}
          />
        ) : (
          <>
            {/* Header - Fixed */}
            <div className="relative px-6 py-5 flex-shrink-0">
              <h1 className="text-xl font-semibold tracking-tight text-white/90">
                Kalibrate
              </h1>
              <p className="text-base text-white/45 mt-0.5">
                Kingston, ON
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative px-6 pb-2 flex-shrink-0">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services..."
                  className="
                    w-full pl-10 pr-3 py-2 rounded-lg
                    bg-white/[0.06] hover:bg-white/[0.08]
                    text-white/90 text-sm placeholder-white/40
                    border border-transparent
                    focus:outline-none focus:border-white/20 focus:bg-white/[0.08]
                    transition-all duration-150
                  "
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-6 right-6 top-full mt-1 z-20 bg-neutral-900/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  {searchResults.map(service => (
                    <SearchResultItem
                      key={service.id}
                      service={service}
                      onSelect={handleSearchSelect}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Travel Estimate Search */}
            <div className="relative px-6 pb-2 flex-shrink-0">
              <div className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">
                Travel estimate
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={travelFromQuery}
                    onChange={(e) => setTravelFromQuery(e.target.value)}
                    placeholder="From..."
                    className="
                      w-full pl-3 pr-10 py-2 rounded-lg
                      bg-white/[0.06] hover:bg-white/[0.08]
                      text-white/90 text-sm placeholder-white/40
                      border border-transparent
                      focus:outline-none focus:border-white/20 focus:bg-white/[0.08]
                      transition-all duration-150
                    "
                  />
                  {travelFromQuery && (
                    <button
                      onClick={() => {
                        setTravelFromQuery('');
                        onTravelChange?.(null, travelTo ?? null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                      aria-label="Clear origin"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {showTravelFromResults && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-neutral-900/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                      {travelFromResults.map(service => (
                        <SearchResultItem
                          key={service.id}
                          service={service}
                          onSelect={handleTravelFromSelect}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={travelToQuery}
                    onChange={(e) => setTravelToQuery(e.target.value)}
                    placeholder="To..."
                    className="
                      w-full pl-3 pr-10 py-2 rounded-lg
                      bg-white/[0.06] hover:bg-white/[0.08]
                      text-white/90 text-sm placeholder-white/40
                      border border-transparent
                      focus:outline-none focus:border-white/20 focus:bg-white/[0.08]
                      transition-all duration-150
                    "
                  />
                  {travelToQuery && (
                    <button
                      onClick={() => {
                        setTravelToQuery('');
                        onTravelChange?.(travelFrom ?? null, null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                      aria-label="Clear destination"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {showTravelToResults && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-neutral-900/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                      {travelToResults.map(service => (
                        <SearchResultItem
                          key={service.id}
                          service={service}
                          onSelect={handleTravelToSelect}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-white/45">
                  <span>Mapbox road estimates</span>
                  <button
                    onClick={handleSwapTravel}
                    className="text-white/60 hover:text-white/90 transition-colors"
                    type="button"
                  >
                    Swap
                  </button>
                </div>

                {travelLoading && (
                  <div className="bg-white/[0.03] rounded-lg px-3 py-2 text-xs text-white/60">
                    Loading route...
                  </div>
                )}
                {travelError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-200">
                    {travelError}
                  </div>
                )}
                {travelEstimate && !travelLoading && !travelError && (
                  <div className="bg-white/[0.03] rounded-lg px-3 py-2 text-xs text-white/70">
                    <div className="flex items-center justify-between">
                      <span>{travelEstimate.distanceKm.toFixed(1)} km</span>
                      <span>Walk: {formatMinutes(travelEstimate.walkingMinutes)}</span>
                      <span>Drive: {formatMinutes(travelEstimate.drivingMinutes)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Voice Assistant Button - Fixed */}
            <div className="relative px-6 py-2 flex-shrink-0">
              <button
                onClick={onVoiceAssistantOpen}
                className="
                  w-full flex items-center gap-2
                  px-3 py-2 rounded-lg
                  bg-white/[0.06] hover:bg-white/[0.1]
                  text-white/75 text-base font-medium
                  transition-all duration-150
                  focus:outline-none focus:ring-1 focus:ring-white/25
                  shadow-[0_6px_16px_rgba(0,0,0,0.2)]
                  backdrop-blur-lg
                "
                aria-label="Open voice assistant"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <span>Assistant</span>
              </button>
            </div>

            {/* Categories - Scrollable */}
            <div className="relative flex-1 overflow-y-auto px-6 py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 min-h-0">
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">
                Categories
              </h2>
              <CategoryList
                selectedCategories={selectedCategories}
                onToggle={onCategoryToggle}
                serviceCounts={serviceCounts}
              />
            </div>

            {/* Footer Container - Fixed at bottom */}
            <div className="flex-shrink-0 mt-auto">
              {/* Filter Summary */}
              <div className="relative px-6 py-3 border-t border-white/5">
                <div className="text-xs text-white/45">
                  <span className="text-white/80 font-medium">
                    {services.length} entries
                  </span>
                  {selectedCategories.length > 0 && (
                    <span>
                      {' '}
                      · {selectedCategories.length} active
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-4 pt-2">
                <div className="flex items-center justify-between text-xs text-white/45">
                  <span>© 2026 Kalibrate</span>
                  <img
                    src={kalibrateLogo}
                    alt="Kalibrate logo"
                    className="h-5 w-auto object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </LiquidGlassCard>
  );
};

export const Sidebar = memo(SidebarComponent);
