import { memo } from 'react';
import type { ServiceCategory } from '@/types';

interface QuickCategory {
  id: ServiceCategory;
  label: string;
  icon: React.ReactNode;
}

const QUICK_CATEGORIES: QuickCategory[] = [
  {
    id: 'grocery',
    label: 'Groceries',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
    ),
  },
  {
    id: 'hospitals',
    label: 'Hospitals',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
      </svg>
    ),
  },
  {
    id: 'banks',
    label: 'Banks',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v2h20V7l-10-5zm-8 7v6h4v-6H4zm6 0v6h4v-6h-4zm6 0v6h4v-6h-4zM2 20h20v2H2v-2z"/>
      </svg>
    ),
  },
  {
    id: 'entertainment',
    label: 'Arts & Entertainment',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
      </svg>
    ),
  },
  {
    id: 'libraries',
    label: 'Libraries',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
      </svg>
    ),
  },
  {
    id: 'fitness',
    label: 'Fitness',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
      </svg>
    ),
  },
];

interface FloatingCategoryBarProps {
  selectedCategories: ServiceCategory[];
  onCategoryToggle: (category: ServiceCategory) => void;
  sidebarWidth: number;
}

const FloatingCategoryBar = memo(({
  selectedCategories,
  onCategoryToggle,
  sidebarWidth,
}: FloatingCategoryBarProps) => {
  return (
    <div 
      className="absolute top-4 z-20 flex items-center gap-3 overflow-x-auto scrollbar-hide"
      style={{ left: `${sidebarWidth + 16}px`, right: '70px' }}
    >
      {QUICK_CATEGORIES.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        return (
          <button
            key={category.id}
            onClick={() => onCategoryToggle(category.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              whitespace-nowrap transition-all duration-200
              backdrop-blur-xl
              border shadow-lg
              ${isSelected 
                ? 'bg-white/25 text-white border-white/40' 
                : 'bg-neutral-900/70 text-white/70 border-white/15 hover:text-white hover:bg-neutral-800/80'
              }
            `}
          >
            {category.icon}
            <span>{category.label}</span>
          </button>
        );
      })}
    </div>
  );
});

FloatingCategoryBar.displayName = 'FloatingCategoryBar';

export { FloatingCategoryBar };
