import { useState, useMemo, useCallback } from 'react';
import type { ServiceLocation, ServiceCategory, FilterState } from '@/types';

export const useServiceFilter = (allServices: ServiceLocation[]) => {
  const [filterState, setFilterState] = useState<FilterState>({
    selectedCategories: [],
    searchQuery: '',
  });

  const toggleCategory = useCallback((category: ServiceCategory) => {
    setFilterState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category],
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFilterState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({ selectedCategories: [], searchQuery: '' });
  }, []);

  const filteredServices = useMemo(() => {
    return allServices.filter(service => {
      // Category filter
      if (
        filterState.selectedCategories.length > 0 &&
        !filterState.selectedCategories.includes(service.category)
      ) {
        return false;
      }

      // Search query filter
      if (filterState.searchQuery) {
        const query = filterState.searchQuery.toLowerCase();
        return (
          service.name.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.address.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allServices, filterState]);

  return {
    filterState,
    filteredServices,
    toggleCategory,
    setSearchQuery,
    clearFilters,
  };
};
