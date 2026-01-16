import { memo } from 'react';
import type { CategoryListProps, ServiceCategory } from '@/types';

const CATEGORY_INFO: Record<
  ServiceCategory,
  { label: string; icon: string; color: string }
> = {
  hospitals: { label: 'Hospitals', icon: '🏥', color: 'bg-red-500' },
  clinics: { label: 'Clinics', icon: '🩺', color: 'bg-purple-500' },
  grocery: { label: 'Groceries', icon: '🛒', color: 'bg-green-500' },
  transportation: { label: 'Transportation', icon: '🚌', color: 'bg-amber-500' },
  religious: { label: 'Places of Worship', icon: '⛪', color: 'bg-indigo-300' },
  gardens: { label: 'Parks & Gardens', icon: '🌳', color: 'bg-lime-500' },
  entertainment: { label: 'Arts & Entertainment', icon: '🎭', color: 'bg-pink-500' },
  education: { label: 'Education', icon: '🎓', color: 'bg-blue-500' },
  government: { label: 'Government', icon: '🏢', color: 'bg-orange-500' },
  emergency: { label: 'Emergency Services', icon: '🚒', color: 'bg-red-600' },
  housing: { label: 'Accommodations', icon: '🏨', color: 'bg-orange-400' },
  fitness: { label: 'Fitness & Recreation', icon: '🏋️', color: 'bg-emerald-500' },
  banks: { label: 'Banks & ATMs', icon: '🏦', color: 'bg-cyan-500' },
  libraries: { label: 'Libraries', icon: '📚', color: 'bg-purple-400' },
  daycare: { label: 'Daycare', icon: '👶', color: 'bg-pink-300' },
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
