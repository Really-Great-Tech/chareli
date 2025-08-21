import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useSystemConfigByKey } from '../../backend/configuration.service';
import { Loader2 } from 'lucide-react';

interface SearchBarConfigurationRef {
  getSettings: () => { showSearchBar: boolean };
}

interface SearchBarConfigurationProps {
  disabled?: boolean;
}

const SearchBarConfiguration = forwardRef<SearchBarConfigurationRef, SearchBarConfigurationProps>(
  ({ disabled = false }, ref) => {
    const [showSearchBar, setShowSearchBar] = useState(true);
    
    const { data: uiConfigData, isLoading: isLoadingConfig } = useSystemConfigByKey('ui_settings');

    // Load initial configuration
    useEffect(() => {
      if (uiConfigData?.value) {
        setShowSearchBar(uiConfigData.value.showSearchBar ?? true);
      }
    }, [uiConfigData]);

    // Expose settings to parent component
    useImperativeHandle(ref, () => ({
      getSettings: () => ({ showSearchBar })
    }));

    const handleToggleSearchBar = (checked: boolean) => {
      setShowSearchBar(checked);
    };

    return (
      <div>
        <h2 className="text-lg sm:text-xl font-worksans text-[#6A7282] dark:text-white mb-4">
            Search Bar Configuration
          </h2>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 relative">
          {isLoadingConfig && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-[#6A7282]" />
            </div>
          )}
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={showSearchBar}
              onCheckedChange={handleToggleSearchBar}
              id="show-search-bar"
              color="#6A7282"
              disabled={disabled || isLoadingConfig}
            />
            <Label 
              htmlFor="show-search-bar" 
              className="text-base font-medium text-black dark:text-white cursor-pointer"
            >
              Show Search Bar
            </Label>
          </div>
        </div>
      </div>
    );
  }
);

SearchBarConfiguration.displayName = 'SearchBarConfiguration';

export default SearchBarConfiguration;
export type { SearchBarConfigurationRef };
