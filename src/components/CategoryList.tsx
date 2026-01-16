import { memo } from 'react';
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
  recreation: { label: 'Recreation', icon: '🏞️', color: 'bg-pink-500' },
};

const CategoryListComponent = ({
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
              w-full flex items-center justify-between px-2 py-2 rounded-md
              transition-all duration-150 border-l-2
              ${
                isSelected
                  ? 'bg-white/[0.08] border-white/50 text-white'
                  : 'bg-transparent border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white/80'
              }
              focus:outline-none
            `}
            aria-pressed={isSelected}
            aria-label={`${info.label}, ${count} locations ${isSelected ? 'selected' : ''}`}
          >
            <div className={`text-lg ${isSelected ? 'font-medium' : 'font-normal'}`}>
              {info.label}
            </div>
            <div className={`text-base ${isSelected ? 'text-white/70' : 'text-white/45'}`}>
              {count}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export const CategoryList = memo(CategoryListComponent);
