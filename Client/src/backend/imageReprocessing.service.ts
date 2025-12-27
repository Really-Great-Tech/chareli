import { backendService } from './api.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface ReprocessingStatus {
  isRunning: boolean;
  paused: boolean;
  processed: number;
  total: number;
  failed: number;
  startedAt?: string;
  errors: ReprocessingError[];
}

export interface ReprocessingError {
  fileId: string;
  s3Key: string;
  error: string;
  timestamp: string;
}

export interface ReprocessingStatusResponse {
  success: boolean;
  data: ReprocessingStatus;
}

export interface ReprocessingActionResponse {
  success: boolean;
  message: string;
}

/**
 * Hook to fetch reprocessing status
 * Auto-refreshes every 2 seconds when running
 */
export const useReprocessingStatus = () => {
  return useQuery<ReprocessingStatusResponse>({
    queryKey: ['image-reprocessing', 'status'],
    queryFn: async () => {
      const response = (await backendService.get(
        '/api/admin/image-reprocessing/status'
      )) as unknown as ReprocessingStatusResponse;
      return response;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      // Refetch every 2 seconds if running, 10 seconds otherwise
      return data?.data.isRunning && !data?.data.paused ? 2000 : 10000;
    },
    retry: 2,
  });
};

/**
 * Hook to start image reprocessing
 */
export const useStartReprocessing = () => {
  const queryClient = useQueryClient();

  return useMutation<ReprocessingActionResponse, unknown, { batchSize?: number }>({
    mutationFn: async ({ batchSize = 10 }) => {
      const response = (await backendService.post(
        '/api/admin/image-reprocessing/start',
        { batchSize }
      )) as unknown as ReprocessingActionResponse;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-reprocessing', 'status'] });
    },
  });
};

/**
 * Hook to pause image reprocessing
 */
export const usePauseReprocessing = () => {
  const queryClient = useQueryClient();

  return useMutation<ReprocessingActionResponse>({
    mutationFn: async () => {
      const response = (await backendService.post(
        '/api/admin/image-reprocessing/pause'
      )) as unknown as ReprocessingActionResponse;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-reprocessing', 'status'] });
    },
  });
};

/**
 * Hook to resume image reprocessing
 */
export const useResumeReprocessing = () => {
  const queryClient = useQueryClient();

  return useMutation<ReprocessingActionResponse>({
    mutationFn: async () => {
      const response = (await backendService.post(
        '/api/admin/image-reprocessing/resume'
      )) as unknown as ReprocessingActionResponse;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-reprocessing', 'status'] });
    },
  });
};

/**
 * Hook to reset reprocessing status
 */
export const useResetReprocessing = () => {
  const queryClient = useQueryClient();

  return useMutation<ReprocessingActionResponse>({
    mutationFn: async () => {
      const response = (await backendService.delete(
        '/api/admin/image-reprocessing/reset'
      )) as unknown as ReprocessingActionResponse;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-reprocessing', 'status'] });
    },
  });
};
