import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';

export interface SignUpConfig {
  authType: 'email' | 'otp' | 'both';
  fields: {
    firstName: boolean;
    lastName: boolean;
    email: boolean;
    phoneNumber: boolean;
    password: boolean;
    ageConfirm: boolean;
    terms: boolean;
  };
}

export const defaultConfig: SignUpConfig = {
  authType: 'email',
  fields: {
    firstName: true,
    lastName: true,
    email: true,
    phoneNumber: true,
    password: true,
    ageConfirm: true,
    terms: true
  }
};

export const useGetSignUpConfig = () => {
  return useQuery({
    queryKey: ['signUpConfig'],
    queryFn: async () => {
      try {
        // The backend returns { success: true, data: { key: 'signup', value: {...} } }
        // Assuming backendService.get returns the object { success: true, data: { key: 'signup', value: {...}, ... } }
        const response = await backendService.get('/api/system-configs/signup');
        // Correctly extract the 'value' from the response object
        if (response?.data?.value) { // Changed from response?.value to response?.data?.value
          return response.data.value as SignUpConfig;
        } else {
          console.error('Failed to fetch signup config: Unexpected response structure', response);
          // Fallback to default config if the structure is unexpected
          return defaultConfig;
        }
      } catch (error) {
        console.error('Failed to fetch signup config:', error);
        // Return default config on fetch error
        return defaultConfig;
      }
    },
    initialData: defaultConfig,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
};

export const useUpdateSignUpConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: SignUpConfig) => {
      const { data } = await backendService.post(BackendRoute.SIGNUP_CONFIG, {
        key: 'signup',
        value: config,
        description: 'Sign up configuration'
      });
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch the config query
      queryClient.invalidateQueries({ queryKey: ['signUpConfig'] });
    }
  });
};
