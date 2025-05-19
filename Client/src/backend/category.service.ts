import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';
import type { Category } from './types';

/**
 * Hook to fetch all categories
 * @returns Query result with categories data
 */
export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: [BackendRoute.CATEGORIES],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.CATEGORIES);
      return response.data as Category[];
    },
  });
};

/**
 * Hook to fetch a specific category by ID
 * @param id - Category ID
 * @returns Query result with category data
 */
export const useCategoryById = (id: string) => {
  return useQuery<Category>({
    queryKey: [BackendRoute.CATEGORIES, id],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.CATEGORY_BY_ID.replace(':id', id));
      return response.data as Category;
    },
  });
};

/**
 * Hook to create a new category
 * @returns Mutation function to create a category
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => 
      backendService.post(BackendRoute.CATEGORIES, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.CATEGORIES] });
    },
  });
};

/**
 * Hook to update a category
 * @returns Mutation function to update a category
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      backendService.put(BackendRoute.CATEGORY_BY_ID.replace(':id', id), data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.CATEGORIES] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.CATEGORIES, id] });
    },
  });
};

/**
 * Hook to delete a category
 * @returns Mutation function to delete a category
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      backendService.delete(BackendRoute.CATEGORY_BY_ID.replace(':id', id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.CATEGORIES] });
    },
  });
};
