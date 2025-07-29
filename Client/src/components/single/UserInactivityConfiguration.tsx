import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Label } from '../ui/label';
import { useSystemConfigByKey } from '../../backend/configuration.service';
import { Loader2, ChevronDown } from 'lucide-react';

interface UserInactivityConfigurationRef {
  getSettings: () => { inactivityDays: number };
}

interface UserInactivityConfigurationProps {
  disabled?: boolean;
}

const UserInactivityConfiguration = forwardRef<UserInactivityConfigurationRef, UserInactivityConfigurationProps>(
  ({ disabled = false }, ref) => {
    const [inactivityDays, setInactivityDays] = useState(14);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const { data: inactivityConfigData, isLoading: isLoadingConfig } = useSystemConfigByKey('user_inactivity_settings');

    // Load initial configuration
    useEffect(() => {
      if (inactivityConfigData?.value) {
        setInactivityDays(inactivityConfigData.value.inactivityDays ?? 14);
      }
    }, [inactivityConfigData]);

    // Expose settings to parent component
    useImperativeHandle(ref, () => ({
      getSettings: () => ({ inactivityDays })
    }));

    const dayOptions = [
      { value: 7, label: '7 days' },
      { value: 14, label: '14 days' },
      { value: 21, label: '21 days' },
      { value: 30, label: '30 days' },
      { value: 60, label: '60 days' },
      { value: 90, label: '90 days' }
    ];

    const handleSelectDays = (days: number) => {
      setInactivityDays(days);
      setIsDropdownOpen(false);
    };

    const selectedOption = dayOptions.find(option => option.value === inactivityDays);

    return (
      <div>
          <h2 className="text-lg sm:text-xl font-worksans text-[#D946EF] mb-4">
            User inactivity timer
          </h2>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 relative">
          {isLoadingConfig && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-black dark:text-white">
                Timer (in days)
              </Label>
            </div>
            
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <button
                type="button"
                onClick={() => !disabled && !isLoadingConfig && setIsDropdownOpen(!isDropdownOpen)}
                disabled={disabled || isLoadingConfig}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-left text-sm text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:border-[#D946EF] focus:border-[#D946EF] focus:outline-none"
              >
                <span>{selectedOption?.label || `${inactivityDays} days`}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {dayOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectDays(option.value)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg ${
                        inactivityDays === option.value 
                          ? 'bg-[#D946EF] text-white hover:bg-[#C026D3]' 
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

UserInactivityConfiguration.displayName = 'UserInactivityConfiguration';

export default UserInactivityConfiguration;
export type { UserInactivityConfigurationRef };
