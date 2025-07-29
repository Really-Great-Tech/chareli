import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { backendService } from '../backend/api.service';
import { BackendRoute } from '../backend/constants';

interface UseDebouncedGameByPositionOptions {
  delay?: number;
  silent?: boolean;
}

export const useDebouncedGameByPosition = (
  position: number | null,
  options: UseDebouncedGameByPositionOptions = {}
) => {
  const { delay = 300, silent = true } = options;
  const [debouncedPosition, setDebouncedPosition] = useState<number | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Debounce the position input
  useEffect(() => {
    if (position === null || position <= 0) {
      setDebouncedPosition(null);
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedPosition(position);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [position, delay]);

  // Query for the game at the debounced position
  const query = useQuery<any>({
    queryKey: [BackendRoute.GAME_BY_POSITION, debouncedPosition],
    queryFn: async () => {
      if (!debouncedPosition || debouncedPosition <= 0) {
        return null;
      }

      try {
        const response = await backendService.get(
          BackendRoute.GAME_BY_POSITION.replace(':position', debouncedPosition.toString())
        );
        return response.data;
      } catch (error: any) {
        // If silent mode is enabled, don't show toast for 404 errors
        if (silent && error?.response?.status === 404) {
          // Return null for 404s in silent mode instead of throwing
          return null;
        }
        // Re-throw other errors so they get handled normally
        throw error;
      }
    },
    enabled: !!debouncedPosition && debouncedPosition > 0,
    retry: false, // Don't retry 404s
  });

  return {
    data: query.data,
    isLoading: query.isLoading || isDebouncing,
    isError: query.isError,
    error: query.error,
    isDebouncing,
    debouncedPosition,
  };
};
