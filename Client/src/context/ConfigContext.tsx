import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useGetSignUpConfig, type SignUpConfig, defaultConfig } from '../backend/config.service';

interface ConfigContextType {
  signUpConfig: SignUpConfig;
  isLoading: boolean;
  error: Error | null;
}

const ConfigContext = createContext<ConfigContextType>({
  signUpConfig: defaultConfig,
  isLoading: false,
  error: null
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { data: signUpConfig = defaultConfig, isLoading, error, refetch } = useGetSignUpConfig();

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <ConfigContext.Provider value={{ 
      signUpConfig, 
      isLoading, 
      error: error as Error | null 
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfig() {
  return useContext(ConfigContext);
}
