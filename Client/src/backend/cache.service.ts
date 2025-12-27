import { backendService } from './api.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface CacheStats {
  enabled: boolean;
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memoryUsed: string;
  evictions: number;
}

export interface CacheStatsResponse {
  success: boolean;
  data: CacheStats;
}

export interface CacheClearResponse {
  success: boolean;
  message: string;
}

/**
 * Hook to fetch cache statistics
 * Auto-refreshes every 30 seconds
 */
export const useCacheStats = () => {
  return useQuery<CacheStatsResponse>({
    queryKey: ['cache', 'stats'],
    queryFn: async () => {
      const response = (await backendService.get(
        '/api/admin/cache/stats'
      )) as unknown as CacheStatsResponse;
      return response;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 2,
  });
};

/**
 * Hook to clear all cache
 * This is a dangerous operation and should be confirmed
 */
export const useClearAllCache = () => {
  const queryClient = useQueryClient();

  return useMutation<CacheClearResponse>({
    mutationFn: async () => {
      const response = (await backendService.post(
        '/api/admin/cache/clear'
      )) as unknown as CacheClearResponse;
      return response;
    },
    onSuccess: () => {
      // Invalidate cache stats to refresh the dashboard
      queryClient.invalidateQueries({ queryKey: ['cache', 'stats'] });
    },
  });
};

/**
 * Hook to clear games cache
 */
export const useClearGamesCache = () => {
  const queryClient = useQueryClient();

  return useMutation<CacheClearResponse>({
    mutationFn: async () => {
      const response = (await backendService.post(
        '/api/admin/cache/clear/games'
      )) as unknown as CacheClearResponse;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cache', 'stats'] });
    },
  });
};

/**
 * Hook to clear categories cache
 */
export const useClearCategoriesCache = () => {
  const queryClient = useQueryClient();

  return useMutation<CacheClearResponse>({
    mutationFn: async () => {
      const response = (await backendService.post(
        '/api/admin/cache/clear/categories'
      )) as unknown as CacheClearResponse;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cache', 'stats'] });
    },
  });
};

/**
 * Hook to regenerate JSON CDN files
 * Triggers background regeneration of all static JSON files
 */
export const useRegenerateJsonCdn = () => {
  return useMutation<CacheClearResponse>({
    mutationFn: async () => {
      const response = (await backendService.post(
        '/api/admin/cdn/regenerate'
      )) as unknown as CacheClearResponse;
      return response;
    },
  });
};
