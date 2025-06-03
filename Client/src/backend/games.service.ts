import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';
import type { GameResponse, GameStatus, PaginatedResponse } from './types';

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
  return useQuery<any>({
    queryKey: [BackendRoute.GAMES, id],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.GAME_BY_ID.replace(':id', id));
      console.log('Game API Response:', response.data);
      return response.data as GameResponse;
    },
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
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS] });
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
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAME_ANALYTICS, id] });
    },
  });
};

export const useToggleGameStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ gameId, currentStatus }: { gameId: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const formData = new FormData();
      formData.append('status', newStatus);
      
      const response = await backendService.put(BackendRoute.GAME_BY_ID.replace(':id', gameId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, { gameId }) => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAME_ANALYTICS, gameId] });
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
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS] });
    },
  });
};
