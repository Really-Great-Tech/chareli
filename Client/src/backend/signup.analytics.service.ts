import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backendService } from "./api.service";
import { BackendRoute } from "./constants";

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { sessionId?: string; type: string }) => {
      const response = await backendService.post(
        BackendRoute.SIGNUP_ANALYTICS_CLICK,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.USER] });
      queryClient.invalidateQueries({ queryKey: ["allTeamMembers"] });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ANALYTICS],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_DASHBOARD],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_USERS_ANALYTICS],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_USER_ANALYTICS],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_GAME_ANALYTICS],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.ADMIN_USER_ACTIVITY],
      });
      queryClient.invalidateQueries({
        queryKey: [BackendRoute.SIGNUP_ANALYTICS_DATA],
      });
    },
  });
};


// Import the types from analytics service
import type { DashboardTimeRange } from './analytics.service';

interface SignupAnalyticsFilters {
  timeRange: DashboardTimeRange;
}

export const useSignupAnalyticsData = (filters?: SignupAnalyticsFilters | number) => {
  // Support both old API (number of days) and new API (filters object)
  const isLegacyAPI = typeof filters === 'number';
  const days = isLegacyAPI ? filters : undefined;
  const filtersObj = !isLegacyAPI ? filters : undefined;

  return useQuery<SignupAnalyticsData>({
    queryKey: [BackendRoute.SIGNUP_ANALYTICS_DATA, isLegacyAPI ? days : filtersObj],
    queryFn: async () => {
      let url = BackendRoute.SIGNUP_ANALYTICS_DATA;
      const params = new URLSearchParams();

      if (isLegacyAPI && days) {
        // Legacy API - just days parameter
        params.append('days', days.toString());
      } else if (filtersObj?.timeRange) {
        // New API - time range filter support only
        if (filtersObj.timeRange.period) params.append('period', filtersObj.timeRange.period);
        if (filtersObj.timeRange.startDate) params.append('startDate', filtersObj.timeRange.startDate);
        if (filtersObj.timeRange.endDate) params.append('endDate', filtersObj.timeRange.endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await backendService.get(url);
      return response.data;
    },
    refetchOnWindowFocus: false,
    retry: 3,
  });
};
