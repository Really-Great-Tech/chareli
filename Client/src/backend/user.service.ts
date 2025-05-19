import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';
import type { User } from './types';

/**
 * Hook to fetch user data
 * @returns Query result with user data
 */
export const useUserData = () => {
  return useQuery<User>({
    queryKey: [BackendRoute.AUTH_ME],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.AUTH_ME);
      return response.data as unknown as User;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch a specific user by ID
 * @param id - User ID
 * @returns Query result with user data
 */
export const useUserById = (id: string) => {
  const url = BackendRoute.USER_BY_ID.replace(':id', id);
  return useQuery<User>({
    queryKey: [BackendRoute.USER, id],
    queryFn: async () => {
      const response = await backendService.get(url);
      return response as unknown as User;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to update user data
 * @returns Mutation function to update user data
 */
export const useUpdateUserData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<User> & { id: string }) => {
      const url = BackendRoute.USER_BY_ID.replace(':id', id);
      const response = await backendService.put(url, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.USER] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.AUTH_ME] });
    },
  });
};

/**
 * Hook to create a new user
 * @returns Mutation function to create a user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phoneNumber?: string;
      isAdult: boolean;
      hasAcceptedTerms: boolean;
    }) => backendService.post(BackendRoute.USER, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.USER] });
    },
  });
};

/**
 * Hook to delete a user
 * @returns Mutation function to delete a user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      const url = BackendRoute.USER_BY_ID.replace(':id', id);
      return backendService.delete(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.USER] });
    },
  });
};
