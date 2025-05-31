import { useState, useEffect } from 'react';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { useCreateSystemConfig, useSystemConfigByKey } from '../../../backend/configuration.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
      enabled: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
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
        enabled: false
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
        enabled: false
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
        enabled: checked
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

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await createConfig({
        key: 'authentication_settings',
        value: {
          settings: authSettings
        }
      });
      toast.success('Authentication settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save authentication settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 relative">
      {isLoadingConfig && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      )}
      <h1 className="text-3xl text-[#D946EF] mb-4">User Sign Up Configuration</h1>
      <div className="space-y-4">
        {/* Email Authentication Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Checkbox
              checked={authSettings.email.enabled}
              onCheckedChange={handleEmailAuth}
              id="email-auth"
              color="#D946EF"
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
                color="#D946EF"
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
                color="#D946EF"
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
              color="#D946EF"
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
                color="#D946EF"
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
                color="#D946EF"
              />
              <Label htmlFor="last-name-sms" className="ml-2 text-base">
                Last Name
              </Label>
            </div>
          </div>
        </div>

        {/* Both Section */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center">
            <Checkbox
              checked={authSettings.both.enabled}
              onCheckedChange={handleBoth}
              id="both"
              color="#D946EF"
            />
            <Label htmlFor="both" className="ml-2 text-lg font-medium text-black dark:text-white">
              Both
            </Label>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
