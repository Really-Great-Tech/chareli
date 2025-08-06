import { useState, useEffect } from 'react';
import { fetchUserCountryCode } from '../utils/geolocation';

export interface UseUserCountryReturn {
  countryCode: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to detect user's country based on IP address
 * Returns country code, loading state, and error handling
 */
export function useUserCountry(): UseUserCountryReturn {
  const [countryCode, setCountryCode] = useState<string>('us'); // Default to US
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const detectCountry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const detectedCountry = await fetchUserCountryCode();
      setCountryCode(detectedCountry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect country';
      setError(errorMessage);
      console.error('Country detection error:', err);
      
      // Keep default country (US) on error
      setCountryCode('us');
    } finally {
      setIsLoading(false);
    }
  };

  // Detect country on hook initialization
  useEffect(() => {
    detectCountry();
  }, []);

  // Provide refetch function for manual retry
  const refetch = async () => {
    await detectCountry();
  };

  return {
    countryCode,
    isLoading,
    error,
    refetch,
  };
}
