import { useMutation, useQuery } from '@tanstack/react-query';
import { backendService } from './api.service';



// Generate game access token
export const generateGameAccessToken = async (
  gameId: string,
  request: any = {}
): Promise<any> => {
  const response = await backendService.post(
    `/api/r2-test/generate-access-token/${gameId}`,
    request
  ) as any;
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to generate access token');
  }
  
  return response.data;
};

// Hook to generate game access token
export const useGenerateGameAccessToken = () => {
  return useMutation({
    mutationFn: ({ gameId, request }: { gameId: string; request?: any }) =>
      generateGameAccessToken(gameId, request),
    onError: (error) => {
      console.error('Failed to generate game access token:', error);
    },
  });
};

// Quick test endpoint
export const quickTestGame = async (gameId: string) => {
  const response = await backendService.get(
    `/api/r2-test/quick-test/${gameId}`
  ) as any;
  
  if (!response.success) {
    throw new Error(response.message || 'Quick test failed');
  }
  
  return response.data;
};

// Hook for quick test
export const useQuickTestGame = (gameId: string) => {
  return useQuery({
    queryKey: ['quickTestGame', gameId],
    queryFn: () => quickTestGame(gameId),
    enabled: !!gameId,
  });
};

// Check R2 configuration
export const checkR2Configuration = async () => {
  const response = await backendService.get('/r2-test/configuration') as any;
  
  if (!response.success) {
    throw new Error(response.message || 'Configuration check failed');
  }
  
  return response.data;
};

// Hook for configuration check
export const useR2Configuration = () => {
  return useQuery({
    queryKey: ['r2Configuration'],
    queryFn: checkR2Configuration,
  });
};
