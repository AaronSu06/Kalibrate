import type { SidebarProps } from '@/types';
import { CategoryList } from './CategoryList';
import { getServiceCounts } from '@/data/services';

export const Sidebar = ({
  services,
  selectedCategories,
  onCategoryToggle,
  onVoiceAssistantOpen,
}: SidebarProps) => {
  const serviceCounts = getServiceCounts();

  return (
    <aside
      className="w-full h-full bg-neutral-950/90 backdrop-blur-xl border-r border-neutral-800 flex flex-col shadow-2xl"
      aria-label="Service categories and filters"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-800 bg-neutral-900/50">
        <h1 className="text-base font-semibold text-white tracking-tight">
          AccessKingston
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Kingston, ON
        </p>
      </div>

      {/* Voice Assistant Button */}
      <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-900/50">
        <button
          onClick={onVoiceAssistantOpen}
          className="
            w-full flex items-center gap-2
            px-3 py-2 bg-neutral-800 hover:bg-neutral-700
            text-neutral-100 text-xs font-medium
            transition-all duration-150
            focus:outline-none focus:ring-1 focus:ring-neutral-600
            shadow-lg
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
          <span>Voice</span>
        </button>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-transparent to-neutral-950/50">
        <h2 className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
          Categories
        </h2>
        <CategoryList
          selectedCategories={selectedCategories}
          onToggle={onCategoryToggle}
          serviceCounts={serviceCounts}
        />
      </div>

      {/* Filter Summary */}
      <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900/50">
        <div className="text-[10px] text-neutral-400">
          <span className="text-neutral-300 font-medium">{services.length}</span>
          {selectedCategories.length > 0 && (
            <span>
              {' '}
              · {selectedCategories.length} active
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
