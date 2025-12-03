import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

interface LikeResponse {
  success: boolean;
  message: string;
  data: {
    likeCount: number;
    userLikesCount: number;
    hasLiked: boolean;
  };
}

/**
 * Hook to like a game
 */
export const useLikeGame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      const response = await api.post<LikeResponse>(`/games/${gameId}/like`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate game queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['game'] });
    },
  });
};

/**
 * Hook to unlike a game
 */
export const useUnlikeGame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      const response = await api.delete<LikeResponse>(`/games/${gameId}/like`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate game queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['game'] });
    },
  });
};
