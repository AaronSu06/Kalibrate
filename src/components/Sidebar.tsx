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
      className="w-full lg:w-[30%] bg-gray-50 border-r border-gray-200 flex flex-col"
      aria-label="Service categories and filters"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          AccessKingston
        </h1>
        <p className="text-sm text-gray-600">
          Find accessible services in Kingston, Ontario
        </p>
      </div>

      {/* Voice Assistant Button */}
      <div className="p-4 bg-white border-b border-gray-200">
        <button
          onClick={onVoiceAssistantOpen}
          className="
            w-full flex items-center justify-center space-x-3
            px-6 py-4 bg-primary-600 hover:bg-primary-700
            text-white font-medium rounded-lg
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            shadow-md hover:shadow-lg
          "
          aria-label="Open voice assistant"
        >
          <svg
            className="w-6 h-6"
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
          <span>Voice Assistant</span>
        </button>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Service Categories
        </h2>
        <CategoryList
          selectedCategories={selectedCategories}
          onToggle={onCategoryToggle}
          serviceCounts={serviceCounts}
        />
      </div>

      {/* Filter Summary */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-sm text-gray-600">
          Showing{' '}
          <span className="font-semibold text-gray-900">{services.length}</span>{' '}
          locations
          {selectedCategories.length > 0 && (
            <span>
              {' '}
              in {selectedCategories.length}{' '}
              {selectedCategories.length === 1 ? 'category' : 'categories'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
