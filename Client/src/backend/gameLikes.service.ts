import { useMutation, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';

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
      const response = await backendService.post(BackendRoute.GAME_LIKE.replace(':gameId', gameId));
      return response.data as LikeResponse;
    },
    onSuccess: (_, gameId) => {
      // Invalidate game queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAME_BY_ID, gameId] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
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
      const response = await backendService.delete(BackendRoute.GAME_UNLIKE.replace(':gameId', gameId));
      return response.data as LikeResponse;
    },
    onSuccess: (_, gameId) => {
      // Invalidate game queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAME_BY_ID, gameId] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
    },
  });
};
