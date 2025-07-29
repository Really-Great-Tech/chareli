import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';
import type { 
  User, 
  LoginCredentials, 
  OtpVerification, 
  AuthTokens, 
  RegistrationData,
  ForgotPasswordData,
} from './types';


export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await backendService.post(BackendRoute.AUTH_LOGIN, credentials);
      return response;
    },
  });
};


export const useVerifyOtp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: OtpVerification): Promise<AuthTokens> => {
      const response = await backendService.post(BackendRoute.AUTH_VERIFY_OTP, data);
      return response as unknown as AuthTokens;
    },
    onSuccess: (data) => {
      // Store tokens
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    
      queryClient.invalidateQueries({ queryKey: [BackendRoute.AUTH_ME] });
    },
  });
};

export const useVerifyResetOtp = () => {
  return useMutation({
    mutationFn: async ({ userId, otp }: { userId: string; otp: string }) => {
      return backendService.post(BackendRoute.AUTH_VERIFY_OTP, { userId, otp });
    },
  });
};

//Hook to request a new OTP

export const useRequestOtp = () => {
  return useMutation({
    mutationFn: async ({ userId, otpType }: { userId: string; otpType: 'SMS' | 'EMAIL' | 'NONE' }) => {
      return backendService.post(BackendRoute.AUTH_REQUEST_OTP, { userId, otpType });
    },
  });
};


export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: [BackendRoute.AUTH_ME],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.AUTH_ME);
      return response as unknown as User;
    },
    retry: false,
    enabled: !!localStorage.getItem('token'), // Only run if token exists
  });
};


export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: RegistrationData) => {
      return backendService.post(BackendRoute.AUTH_REGISTER, userData);
    },
  });
};


export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async (refreshToken: string): Promise<AuthTokens> => {
      const response = await backendService.post(BackendRoute.AUTH_REFRESH_TOKEN, { refreshToken });
      return response as unknown as AuthTokens;
    },
  onSuccess: (data) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  },
  });
};


export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Clear user from cache
    queryClient.invalidateQueries({ queryKey: [BackendRoute.AUTH_ME] });
  };
};


export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const data: ForgotPasswordData = { email };
      return backendService.post(BackendRoute.AUTH_FORGOT_PASSWORD, data);
    },
  });
};

export const useForgotPasswordPhone = () => {
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      return backendService.post(BackendRoute.AUTH_FORGOT_PASSWORD + '/phone', { phoneNumber });
    },
  });
};


export const useVerifyResetToken = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      try {
        const response = await backendService.get(`${BackendRoute.AUTH_RESET_PASSWORD}/${token}?_=${Date.now()}`);
        console.log("Verify token response:", response);
        return { success: true, message: "Token is valid" };
      } catch (error) {
        console.error("Error verifying token:", error);
        throw error;
      }
    },
    retry: false, // Don't retry on failure
  });
};


export const useResetPassword = () => {
  return useMutation({
    mutationFn: async ({ token, userId, password, confirmPassword }: { token?: string; userId?: string; password: string; confirmPassword: string }) => {
      if (token) {
        // Email flow - use token in URL
        return backendService.post(`${BackendRoute.AUTH_RESET_PASSWORD}/${token}`, { password, confirmPassword });
      } else {
        // Phone flow - use userId in body
        return backendService.post(BackendRoute.AUTH_RESET_PASSWORD, { userId, password, confirmPassword });
      }
    },
  });
};
