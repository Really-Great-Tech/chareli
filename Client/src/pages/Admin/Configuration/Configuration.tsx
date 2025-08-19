import { useState, useEffect, useRef } from 'react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { useCreateSystemConfig, useSystemConfigByKey } from '../../../backend/configuration.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { BackendRoute } from '../../../backend/constants';
import SearchBarConfiguration, { type SearchBarConfigurationRef } from '../../../components/single/SearchBarConfiguration';
import DynamicPopupConfiguration from '../../../components/single/DynamicPopupConfiguration';
import UserInactivityConfiguration, { type UserInactivityConfigurationRef } from '../../../components/single/UserInactivityConfiguration';
import PopularGamesConfiguration, { type PopularGamesConfigurationRef } from '../../../components/single/PopularGamesConfiguration';

interface AuthMethodSettings {
  enabled: boolean;
  firstName: boolean;
  lastName: boolean;
}

interface AuthSettings {
  email: AuthMethodSettings;
  sms: AuthMethodSettings;
  both: {
    enabled: boolean;
    otpDeliveryMethod: 'email' | 'sms' | 'none';
  };
}

export default function Configuration() {
  const [authSettings, setAuthSettings] = useState<AuthSettings>({
    email: {
      enabled: true,
      firstName: false,
      lastName: false
    },
    sms: {
      enabled: false,
      firstName: false,
      lastName: false
    },
    both: {
      enabled: false,
      otpDeliveryMethod: 'none'
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchBarConfigRef = useRef<SearchBarConfigurationRef>(null);
  const userInactivityConfigRef = useRef<UserInactivityConfigurationRef>(null);
  const popularGamesConfigRef = useRef<PopularGamesConfigurationRef>(null);
  const queryClient = useQueryClient();
  const { mutateAsync: createConfig } = useCreateSystemConfig();
  const { data: configData, isLoading: isLoadingConfig } = useSystemConfigByKey('authentication_settings');

  // Load initial configuration
  useEffect(() => {
    if (configData?.value?.settings) {
      setAuthSettings(configData.value.settings);
    }
  }, [configData]);

  const handleEmailAuth = (checked: boolean) => {
    setAuthSettings({
      email: {
        enabled: checked,
        firstName: false,
        lastName: false
      },
      sms: {
        enabled: false,
        firstName: false,
        lastName: false
      },
      both: {
        enabled: false,
        otpDeliveryMethod: 'none'
      }
    });
  };

  const handleSmsAuth = (checked: boolean) => {
    setAuthSettings({
      email: {
        enabled: false,
        firstName: false,
        lastName: false
      },
      sms: {
        enabled: checked,
        firstName: false,
        lastName: false
      },
      both: {
        enabled: false,
        otpDeliveryMethod: 'none'
      }
    });
  };

  const handleBoth = (checked: boolean) => {
    setAuthSettings({
      email: {
        enabled: false,
        firstName: false,
        lastName: false
      },
      sms: {
        enabled: false,
        firstName: false,
        lastName: false
      },
      both: {
        enabled: checked,
        otpDeliveryMethod: 'none'
      }
    });
  };

  const handleEmailFirstName = (checked: boolean) => {
    setAuthSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        firstName: checked
      }
    }));
  };

  const handleEmailLastName = (checked: boolean) => {
    setAuthSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        lastName: checked
      }
    }));
  };

  const handleSmsFirstName = (checked: boolean) => {
    setAuthSettings(prev => ({
      ...prev,
      sms: {
        ...prev.sms,
        firstName: checked
      }
    }));
  };

  const handleSmsLastName = (checked: boolean) => {
    setAuthSettings(prev => ({
      ...prev,
      sms: {
        ...prev.sms,
        lastName: checked
      }
    }));
  };

  const handleOtpDeliveryMethod = (method: 'email' | 'sms' | 'none') => {
    setAuthSettings(prev => ({
      ...prev,
      both: {
        ...prev.both,
        otpDeliveryMethod: method
      }
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Save authentication settings
      await createConfig({
        key: 'authentication_settings',
        value: {
          settings: authSettings
        }
      });

      // Save UI settings
      if (searchBarConfigRef.current) {
        const uiSettings = searchBarConfigRef.current.getSettings();
        await createConfig({
          key: 'ui_settings',
          value: uiSettings,
          description: 'UI visibility settings for the application'
        });
      }

      // Save user inactivity settings
      if (userInactivityConfigRef.current) {
        const inactivitySettings = userInactivityConfigRef.current.getSettings();
        await createConfig({
          key: 'user_inactivity_settings',
          value: inactivitySettings,
          description: 'User inactivity timer configuration'
        });
      }

      // Save popular games settings
      if (popularGamesConfigRef.current) {
        const popularGamesSettings = popularGamesConfigRef.current.getSettings();
        await createConfig({
          key: 'popular_games_settings',
          value: popularGamesSettings,
          description: 'Popular games configuration for homepage'
        });
        
        // Invalidate games queries to refresh popular section
        queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
      }

      toast.success('Configuration saved successfully!');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 relative">
      {isLoadingConfig && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      )}
      
      <SearchBarConfiguration ref={searchBarConfigRef} disabled={isSubmitting} />
      
      <h1 className="text-lg sm:text-xl font-worksans text-[#DC8B18] mb-4">User Sign Up Configuration</h1>
      <div className="space-y-4">
        {/* Email Authentication Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Checkbox
              checked={authSettings.email.enabled}
              onCheckedChange={handleEmailAuth}
              id="email-auth"
              color="#DC8B18"
              disabled={authSettings.both.enabled}
            />
            <Label htmlFor="email-auth" className="ml-2 text-lg font-medium text-black dark:text-white">
              Email Authentication
            </Label>
          </div>
          <div className="ml-6 space-y-2">
            <div className="flex items-center">
              <Checkbox
                checked={authSettings.email.firstName}
                onCheckedChange={handleEmailFirstName}
                id="first-name-email"
                disabled={!authSettings.email.enabled || authSettings.both.enabled}
                color="#DC8B18"
              />
              <Label htmlFor="first-name-email" className="ml-2 text-base">
                First Name
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={authSettings.email.lastName}
                onCheckedChange={handleEmailLastName}
                id="last-name-email"
                disabled={!authSettings.email.enabled || authSettings.both.enabled}
                color="#DC8B18"
              />
              <Label htmlFor="last-name-email" className="ml-2 text-base">
                Last Name
              </Label>
            </div>
          </div>
        </div>

        {/* SMS Authentication Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Checkbox
              checked={authSettings.sms.enabled}
              onCheckedChange={handleSmsAuth}
              id="sms-auth"
              color="#DC8B18"
              disabled={authSettings.both.enabled}
            />
            <Label htmlFor="sms-auth" className="ml-2 text-lg font-medium text-black dark:text-white">
              SMS Authentication
            </Label>
          </div>
          <div className="ml-6 space-y-2">
            <div className="flex items-center">
              <Checkbox
                checked={authSettings.sms.firstName}
                onCheckedChange={handleSmsFirstName}
                id="first-name-sms"
                disabled={!authSettings.sms.enabled || authSettings.both.enabled}
                color="#DC8B18"
              />
              <Label htmlFor="first-name-sms" className="ml-2 text-base">
                First Name
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={authSettings.sms.lastName}
                onCheckedChange={handleSmsLastName}
                id="last-name-sms"
                disabled={!authSettings.sms.enabled || authSettings.both.enabled}
                color="#DC8B18"
              />
              <Label htmlFor="last-name-sms" className="ml-2 text-base">
                Last Name
              </Label>
            </div>
          </div>
        </div>

        {/* Both Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Checkbox
              checked={authSettings.both.enabled}
              onCheckedChange={handleBoth}
              id="both"
              color="#DC8B18"
            />
            <Label htmlFor="both" className="ml-2 text-lg font-medium text-black dark:text-white">
              Both
            </Label>
          </div>
          
          {/* OTP Delivery Method Selection */}
          {authSettings.both.enabled && (
            <div className="ml-6 mt-4">
              <Label className="text-base font-medium text-black dark:text-white mb-3 block">
                OTP Delivery Method:
              </Label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="otp-email"
                    name="otpDeliveryMethod"
                    value="email"
                    checked={authSettings.both.otpDeliveryMethod === 'email'}
                    onChange={() => handleOtpDeliveryMethod('email')}
                    className="w-4 h-4 text-[#DC8B18] bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Label htmlFor="otp-email" className="ml-2 text-base">
                    Email
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="otp-sms"
                    name="otpDeliveryMethod"
                    value="sms"
                    checked={authSettings.both.otpDeliveryMethod === 'sms'}
                    onChange={() => handleOtpDeliveryMethod('sms')}
                    className="w-4 h-4 text-[#DC8B18] bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Label htmlFor="otp-sms" className="ml-2 text-base">
                    SMS
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="otp-none"
                    name="otpDeliveryMethod"
                    value="none"
                    checked={authSettings.both.otpDeliveryMethod === 'none'}
                    onChange={() => handleOtpDeliveryMethod('none')}
                    className="w-4 h-4 text-[#DC8B18] bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Label htmlFor="otp-none" className="ml-2 text-base">
                    None (No OTP required)
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <DynamicPopupConfiguration />
      <UserInactivityConfiguration ref={userInactivityConfigRef} disabled={isSubmitting} />
      <PopularGamesConfiguration ref={popularGamesConfigRef} disabled={isSubmitting} />
      
      <div className="flex justify-end mt-6 mb-4 px-2">
        <button
          className="bg-[#DC8B18] text-white px-6 py-3 rounded-lg hover:bg-[#C17600] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer font-medium text-sm sm:text-base min-w-[140px] justify-center shadow-lg"
          onClick={handleSave}
          disabled={isSubmitting || isLoadingConfig}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </button>
      </div>
    </div>
  );
}
