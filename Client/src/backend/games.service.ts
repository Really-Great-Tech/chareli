import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';
import type {
  GameData,
  GameResponse,
  GameStatus,
  PaginatedResponse,
} from './types';

export const useGames = (params?: {
  categoryId?: string;
  status?: GameStatus;
  filter?: 'popular' | 'recommended' | 'recently_added';
  search?: string;
  limit?: number;
}) => {
  return useQuery<PaginatedResponse<GameResponse>>({
    queryKey: [BackendRoute.GAMES, params],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.GAMES, { params });
      return response.data as PaginatedResponse<GameResponse>;
    },
  });
};

export const useGameById = (id: string) => {
  return useQuery<GameData>({
    queryKey: [BackendRoute.GAMES, id],
    queryFn: async () => {
      const response = await backendService.get(
        BackendRoute.GAME_BY_ID.replace(':id', id)
      );
      console.log('Game API Response:', response);
      return response.data;
    },
    enabled: !!id, // Only run the query if an ID string is actually present
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    staleTime: 1000 * 60, // Consider data fresh for 1 minute to reduce API calls on back/forward navigation
  });
};

export const useCreateGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      backendService.post(BackendRoute.GAMES, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS],
      });
    },
  });
};

export const useUpdateGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      backendService.put(BackendRoute.GAME_BY_ID.replace(':id', id), data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES, id] });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAME_ANALYTICS, id],
      });
    },
  });
};

export const useToggleGameStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gameId,
      currentStatus,
    }: {
      gameId: string;
      currentStatus: string;
    }) => {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const formData = new FormData();
      formData.append('status', newStatus);

      const response = await backendService.put(
        BackendRoute.GAME_BY_ID.replace(':id', gameId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (_, { gameId }) => {
      // Invalidate all games queries (this will update Home and Categories pages)
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES, gameId] });
      // Invalidate admin queries
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAME_ANALYTICS, gameId],
      });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.CATEGORIES] });
    },
  });
};

export const useDeleteGame = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      backendService.delete(BackendRoute.GAME_BY_ID.replace(':id', id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS],
      });
    },
  });
};

// ============================================================================
// POSITION MANAGEMENT HOOKS
// ============================================================================

export const useGameByPosition = (position: number) => {
  return useQuery<any>({
    queryKey: [BackendRoute.GAME_BY_POSITION, position],
    queryFn: async () => {
      const response = await backendService.get(
        BackendRoute.GAME_BY_POSITION.replace(':position', position.toString())
      );
      return response.data;
    },
    enabled: !!position && position > 0,
  });
};

export const useUpdateGamePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, position }: { id: string; position: number }) => {
      const formData = new FormData();
      formData.append('position', position.toString());
      return backendService.put(
        BackendRoute.GAME_BY_ID.replace(':id', id),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES, id] });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.GAME_BY_POSITION],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS],
      });
    },
  });
};

// ============================================================================
// POSITION HISTORY HOOKS
// ============================================================================

export const useGamePositionHistory = (
  gameId: string,
  params?: { page?: number; limit?: number }
) => {
  return useQuery<any>({
    queryKey: [BackendRoute.GAME_POSITION_HISTORY_BY_GAME, gameId, params],
    queryFn: async () => {
      const response = await backendService.get(
        BackendRoute.GAME_POSITION_HISTORY_BY_GAME.replace(':gameId', gameId),
        { params }
      );
      return response.data;
    },
    enabled: !!gameId,
  });
};

export const useRecordGameClick = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gameId: string) =>
      backendService.post(
        BackendRoute.GAME_POSITION_HISTORY_CLICK.replace(':gameId', gameId)
      ),
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.GAME_POSITION_HISTORY_BY_GAME, gameId],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.GAME_POSITION_HISTORY_ANALYTICS],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.GAME_POSITION_HISTORY_PERFORMANCE],
      });
    },
  });
};

export const usePositionHistoryAnalytics = () => {
  return useQuery<any>({
    queryKey: [BackendRoute.GAME_POSITION_HISTORY_ANALYTICS],
    queryFn: async () => {
      const response = await backendService.get(
        BackendRoute.GAME_POSITION_HISTORY_ANALYTICS
      );
      return response.data;
    },
  });
};

export const useAllPositionHistory = (params?: {
  page?: number;
  limit?: number;
  position?: number;
  positionMin?: number;
  positionMax?: number;
  clickCountMin?: number;
  clickCountMax?: number;
  gameTitle?: string;
}) => {
  return useQuery<any>({
    queryKey: [BackendRoute.GAME_POSITION_HISTORY, params],
    queryFn: async () => {
      const response = await backendService.get(
        BackendRoute.GAME_POSITION_HISTORY,
        { params }
      );
      return response.data;
    },
  });
};

export const usePositionPerformance = () => {
  return useQuery<any>({
    queryKey: [BackendRoute.GAME_POSITION_HISTORY_PERFORMANCE],
    queryFn: async () => {
      const response = await backendService.get(
        BackendRoute.GAME_POSITION_HISTORY_PERFORMANCE
      );
      return response.data;
    },
  });
};
