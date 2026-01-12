import type { CategoryListProps, ServiceCategory } from '@/types';

const CATEGORY_INFO: Record<
  ServiceCategory,
  { label: string; icon: string; color: string }
> = {
  healthcare: { label: 'Healthcare', icon: '🏥', color: 'bg-red-500' },
  grocery: { label: 'Groceries', icon: '🛒', color: 'bg-green-500' },
  banking: { label: 'Banking', icon: '🏦', color: 'bg-blue-500' },
  pharmacy: { label: 'Pharmacies', icon: '💊', color: 'bg-purple-500' },
  transportation: { label: 'Transportation', icon: '🚌', color: 'bg-amber-500' },
  community: { label: 'Community', icon: '🏛️', color: 'bg-cyan-500' },
};

export const CategoryList = ({
  selectedCategories,
  onToggle,
  serviceCounts,
}: CategoryListProps) => {
  const categories = Object.keys(CATEGORY_INFO) as ServiceCategory[];

  return (
    <div className="space-y-2" role="group" aria-label="Service categories">
      {categories.map(category => {
        const info = CATEGORY_INFO[category];
        const isSelected = selectedCategories.includes(category);
        const count = serviceCounts[category] || 0;

        return (
          <button
            key={category}
            onClick={() => onToggle(category)}
            className={`
              w-full flex items-center justify-between p-3 rounded-lg
              transition-all duration-200
              ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            `}
            aria-pressed={isSelected}
            aria-label={`${info.label}, ${count} locations ${isSelected ? 'selected' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl" aria-hidden="true">
                {info.icon}
              </span>
              <div className="text-left">
                <div className="font-medium">{info.label}</div>
                <div
                  className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}
                >
                  {count} {count === 1 ? 'location' : 'locations'}
                </div>
              </div>
            </div>
            {isSelected && (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};
