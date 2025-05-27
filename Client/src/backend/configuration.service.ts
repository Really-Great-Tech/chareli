import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backendService } from "./api.service";
import { BackendRoute } from "./constants";

// Get formatted configs (public route)
export const useFormattedSystemConfigs = () => {
  return useQuery({
    queryKey: [BackendRoute.SYSTEM_CONFIG_FORMATTED],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.SYSTEM_CONFIG_FORMATTED);
      return response.data;
    }
  });
};

// Get config by key (public route)
export const useSystemConfigByKey = (key: string) => {
  return useQuery({
    queryKey: [BackendRoute.SYSTEM_CONFIG, key],
    queryFn: async () => {
      const response = await backendService.get(
        BackendRoute.SYSTEM_CONFIG_BY_KEY.replace(':key', key)
      );
      return response.data;
    },
    retry: false, // Don't retry on 404
    enabled: true // Always enabled by default
  });
};

// Get all configs (admin route)
export const useAllSystemConfigs = () => {
  return useQuery({
    queryKey: [BackendRoute.SYSTEM_CONFIG],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.SYSTEM_CONFIG);
      return response.data;
    }
  });
};

// Create config (admin route)
export const useCreateSystemConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const headers = data instanceof FormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' };

      const response = await backendService.post(BackendRoute.SYSTEM_CONFIG, data, { headers });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.SYSTEM_CONFIG] });
    }
  });
};

// Update config (admin route)
export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, data }: { key: string; data: any }) => {
      const response = await backendService.put(
        BackendRoute.SYSTEM_CONFIG_BY_KEY.replace(':key', key),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.SYSTEM_CONFIG] });
    }
  });
};

// Delete config (admin route)
export const useDeleteSystemConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const response = await backendService.delete(
        BackendRoute.SYSTEM_CONFIG_BY_KEY.replace(':key', key)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.SYSTEM_CONFIG] });
    }
  });
};
