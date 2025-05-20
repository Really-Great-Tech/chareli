import { useQuery, useMutation } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';

interface SignupAnalyticsData {
  totalClicks: number;
  periodClicks: number;
  uniqueSessions: number;
  clicksByCountry: Array<{
    country: string;
    count: string;
  }>;
  clicksByDevice: Array<{
    deviceType: string;
    count: string;
  }>;
  clicksByDay: Array<{
    date: string;
    count: string;
  }>;
  clicksByType: Array<{
    type: string;
    count: string;
  }>;
}

/**
 * Hook to track signup button clicks
 * @returns Mutation function to track signup clicks
 */
export const useTrackSignupClick = () => {
  return useMutation({
    mutationFn: async (data: { sessionId?: string; type: string }) => {
      const response = await backendService.post(BackendRoute.SIGNUP_ANALYTICS_CLICK, data);
      return response.data;
    }
  });
};

/**
 * Hook to fetch signup analytics data
 * @param days - Number of days to include (default 30)
 * @returns Query result with signup analytics data
 */
export const useSignupAnalyticsData = (days?: number) => {
  return useQuery<SignupAnalyticsData>({
    queryKey: [BackendRoute.SIGNUP_ANALYTICS_DATA, days],
    queryFn: async () => {
      const url = days 
        ? `${BackendRoute.SIGNUP_ANALYTICS_DATA}?days=${days}`
        : BackendRoute.SIGNUP_ANALYTICS_DATA;
      const response = await backendService.get(url);
      return response.data.data;
    },
    refetchOnWindowFocus: false,
  });
};
