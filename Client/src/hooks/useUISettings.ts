import { useSystemConfigByKey } from '../backend/configuration.service';

interface UISettings {
  showSearchBar: boolean;
}

const defaultUISettings: UISettings = {
  showSearchBar: true
};

export const useUISettings = () => {
  const { data: uiConfigData, isLoading, error } = useSystemConfigByKey('ui_settings');

  const uiSettings: UISettings = {
    ...defaultUISettings,
    ...(uiConfigData?.value || {})
  };

  return {
    uiSettings,
    isLoading,
    error
  };
};
