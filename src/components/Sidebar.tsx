import type { SidebarProps } from '@/types';
import { CategoryList } from './CategoryList';
import { getServiceCounts } from '@/data/services';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';
import kalibrateLogo from '@/public/kali.webp';

export const Sidebar = ({
  services,
  selectedCategories,
  onCategoryToggle,
  onVoiceAssistantOpen,
}: SidebarProps) => {
  const serviceCounts = getServiceCounts();

  return (
    <LiquidGlassCard
      square
      singleLayer
      className="w-full h-full border-white/10 bg-neutral-950/60 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    >
      <aside
        className="relative w-full h-full min-h-screen flex flex-col text-white"
        aria-label="Service categories and filters"
      >
        {/* Header */}
        <div className="relative px-6 py-5">
          <h1 className="text-base font-semibold tracking-tight text-white/90">
            Kalibrate
          </h1>
          <p className="text-xs text-white/45 mt-0.5">
            Kingston, ON
          </p>
        </div>

        {/* Voice Assistant Button */}
        <div className="relative px-6 py-2">
          <button
            onClick={onVoiceAssistantOpen}
            className="
              w-full flex items-center gap-2
              px-3 py-2 rounded-lg
              bg-white/[0.06] hover:bg-white/[0.1]
              text-white/75 text-xs font-medium
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

        {/* Categories */}
        <div className="relative flex-1 overflow-y-auto px-6 py-3">
          <h2 className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-3">
            Categories
          </h2>
          <CategoryList
            selectedCategories={selectedCategories}
            onToggle={onCategoryToggle}
            serviceCounts={serviceCounts}
          />
        </div>

        {/* Filter Summary */}
        <div className="relative px-6 py-3">
          <div className="text-[10px] text-white/45">
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
        <div className="mt-auto px-6 pb-4 pt-2">
          <div className="flex items-center justify-between text-[10px] text-white/45">
            <span>© 2026 Kalibrate</span>
            <img
              src={kalibrateLogo}
              alt="Kalibrate logo"
              className="h-5 w-auto object-contain"
              loading="lazy"
            />
          </div>
        </div>
      </aside>
    </LiquidGlassCard>
  );
};
