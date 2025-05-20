import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';
import type { GameResponse, GameStatus } from './types';

export const useGames = (params?: { categoryId?: string; status?: GameStatus }) => {
  return useQuery<GameResponse[]>({
    queryKey: [BackendRoute.GAMES, params],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.GAMES, { params });
      return response.data as GameResponse[];
    },
  });
};

export const useGameById = (id: string) => {
  return useQuery<GameResponse>({
    queryKey: [BackendRoute.GAMES, id],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.GAME_BY_ID.replace(':id', id));
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
    },
  });
};

export const useToggleGameStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameId: string) => {
      const response = await backendService.patch(`${BackendRoute.ADMIN_GAMES}/${gameId}/toggle-status`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS] });
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
