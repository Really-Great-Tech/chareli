// Phase 0 optimization: No longer fetching UI settings from API
// Using environment variable defaults to eliminate unnecessary database query

interface UISettings {
  showSearchBar: boolean;
}

const defaultUISettings: UISettings = {
  showSearchBar: import.meta.env.VITE_SHOW_SEARCH_BAR !== 'false', // Default to true unless explicitly disabled
};

export const useUISettings = () => {
  // Phase 0 optimization: Use defaults instead of fetching from API
  // This eliminates 1 unnecessary database query per guest user
  return {
    uiSettings: defaultUISettings,
    isLoading: false,
    error: null,
  };
};
