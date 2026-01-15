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
    <div className="space-y-0.5" role="group" aria-label="Service categories">
      {categories.map(category => {
        const info = CATEGORY_INFO[category];
        const isSelected = selectedCategories.includes(category);
        const count = serviceCounts[category] || 0;

        return (
          <button
            key={category}
            onClick={() => onToggle(category)}
            className={`
              w-full flex items-center justify-between px-2 py-2
              transition-all duration-150 border-l-2
              ${
                isSelected
                  ? 'bg-neutral-900 border-neutral-400 text-white'
                  : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
              }
              focus:outline-none focus:ring-1 focus:ring-neutral-700
            `}
            aria-pressed={isSelected}
            aria-label={`${info.label}, ${count} locations ${isSelected ? 'selected' : ''}`}
          >
            <div className={`text-xs ${isSelected ? 'font-medium' : 'font-normal'}`}>
              {info.label}
            </div>
            <div className={`text-[10px] ${isSelected ? 'text-neutral-500' : 'text-neutral-600'}`}>
              {count}
            </div>
          </button>
        );
      })}
    </div>
  );
};
