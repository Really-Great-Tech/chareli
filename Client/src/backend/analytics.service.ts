import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';

import type { Analytics, CreateAnalyticsData } from './types';

/**
 * Hook to fetch all analytics entries
 * @returns Query result with analytics data
 */
export const useAllAnalytics = () => {
  return useQuery<Analytics[]>({
    queryKey: [BackendRoute.ANALYTICS],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.ANALYTICS);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch analytics by ID
 * @param id - Analytics entry ID
 * @returns Query result with analytics data
 */
export const useAnalyticsById = (id: string) => {
  const url = BackendRoute.ANALYTICS_BY_ID.replace(':id', id);
  return useQuery<Analytics>({
    queryKey: [BackendRoute.ANALYTICS, id],
    queryFn: async () => {
      const response = await backendService.get(url);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to create a new analytics entry
 * @returns Mutation function to create analytics
 */
export const useCreateAnalytics = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAnalyticsData) => {
      const response = await backendService.post(BackendRoute.ANALYTICS, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all analytics-related queries
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS] });
      
      // Invalidate user stats
      queryClient.invalidateQueries({ queryKey: [BackendRoute.USER_STATS] });
      
      // Invalidate admin dashboard analytics
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_DASHBOARD] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USERS_ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USER_ACTIVITY] });
      
      // Invalidate specific user and game analytics
      queryClient.invalidateQueries({ 
        queryKey: [BackendRoute.ADMIN_USER_ANALYTICS],
        exact: false // Invalidate all user analytics queries
      });
      queryClient.invalidateQueries({ 
        queryKey: [BackendRoute.ADMIN_GAME_ANALYTICS],
        exact: false // Invalidate all game analytics queries
      });
      queryClient.invalidateQueries({ 
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS_POPULARITY]
      });
    },
  });
};

/**
 * Hook to update an analytics entry
 * @returns Mutation function to update analytics
 */
export const useUpdateAnalytics = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Analytics> & { id: string }) => {
      const url = BackendRoute.ANALYTICS_BY_ID.replace(':id', id);
      const response = await backendService.put(url, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all analytics-related queries
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS, variables.id] });
      
      // Invalidate user stats
      queryClient.invalidateQueries({ queryKey: [BackendRoute.USER_STATS] });
      
      // Invalidate admin dashboard analytics
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_DASHBOARD] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USERS_ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USER_ACTIVITY] });
      
      // Invalidate specific user and game analytics
      queryClient.invalidateQueries({ 
        queryKey: [BackendRoute.ADMIN_USER_ANALYTICS],
        exact: false // Invalidate all user analytics queries
      });
      queryClient.invalidateQueries({ 
        queryKey: [BackendRoute.ADMIN_GAME_ANALYTICS],
        exact: false // Invalidate all game analytics queries
      });
      queryClient.invalidateQueries({ 
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS_POPULARITY]
      });
    },
  });
};

/**
 * Hook to delete an analytics entry
 * @returns Mutation function to delete analytics
 */
export const useDeleteAnalytics = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = BackendRoute.ANALYTICS_BY_ID.replace(':id', id);
      const response = await backendService.delete(url);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all analytics-related queries
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS] });
      
      // Invalidate user stats
      queryClient.invalidateQueries({ queryKey: [BackendRoute.USER_STATS] });
      
      // Invalidate admin dashboard analytics
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_DASHBOARD] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USERS_ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USER_ACTIVITY] });
      
      // Invalidate specific user and game analytics
      queryClient.invalidateQueries({ 
        queryKey: [BackendRoute.ADMIN_USER_ANALYTICS],
        exact: false // Invalidate all user analytics queries
      });
      queryClient.invalidateQueries({ 
        queryKey: [BackendRoute.ADMIN_GAME_ANALYTICS],
        exact: false // Invalidate all game analytics queries
      });
      queryClient.invalidateQueries({ 
        queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS_POPULARITY]
      });
    },
  });
};

// Admin Dashboard Types
interface DashboardAnalytics {
  totalUsers: {
    current: string;
    percentageChange: number;
  };
  totalRegisteredUsers: {
    current: number;
    percentageChange: number;
  };
  activeUsers: number;
  inactiveUsers: number;
  adultsCount: number;
  minorsCount: number;
  totalGames: {
    current: number;
    percentageChange: number;
  };
  totalSessions: {
    current: number;
    percentageChange: number;
  };
  totalTimePlayed: {
    current: number;
    percentageChange: number;
  };
  mostPopularGame: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    sessionCount: number;
    percentageChange: number;
  } | null;
  avgSessionDuration: {
    current: number;
    percentageChange: number;
  };
  retentionRate: number;
}

export interface UserAnalytics {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoggedIn: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  analytics: {
    totalGamesPlayed: number;
    totalSessionCount: number;
    totalTimePlayed: number;
    mostPlayedGame: {
      gameId?: string;
      gameTitle?: string;
      sessionCount?: number;
    };
  };
}

export interface GameAnalytics {
  id: string;
  title: string;
  description?: string;
  overview?: string;
  position?: string;
  code?: string;
  thumbnailFile?: {
    id: string;
    url: string;
    s3Url?: string;
  };
  status: 'active' | 'disabled';
  category?: {
    id: string;
    name: string;
  };
  analytics: {
    uniquePlayers: number;
    totalSessions: number;
    totalPlayTime: number;
  };
}

interface UserActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean>;
}

// Dashboard time range filter types
export interface DashboardTimeRange {
  period?: 'last24hours' | 'last7days' | 'last30days' | 'custom';
  startDate?: string;
  endDate?: string;
}

/**
 * Hook to fetch dashboard analytics with time range support
 * @param timeRange - Time range filter options
 * @returns Query result with dashboard analytics data
 */
export const useDashboardAnalytics = (timeRange?: DashboardTimeRange) => {
  return useQuery<DashboardAnalytics>({
    queryKey: [BackendRoute.ADMIN_DASHBOARD, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeRange) {
        if (timeRange.period) params.append('period', timeRange.period);
        if (timeRange.startDate) params.append('startDate', timeRange.startDate);
        if (timeRange.endDate) params.append('endDate', timeRange.endDate);
      }
      const url = `${BackendRoute.ADMIN_DASHBOARD}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await backendService.get(url);
      console.log('API Response:', response.data);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch all users with their analytics
 * @returns Query result with users analytics data
 */
export interface FilterState {
  registrationDates: {
    startDate: string;
    endDate: string;
  };
  lastLoginDates: {
    startDate: string;
    endDate: string;
  };
  sessionCount: string;
  timePlayed: {
    min: number;
    max: number;
  };
  gameTitle: string[];
  gameCategory: string[];
  country: string[];
  ageGroup: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const useUsersAnalytics = (filters?: FilterState) => {
  return useQuery<UserAnalytics[]>({
    queryKey: [BackendRoute.ADMIN_USERS_ANALYTICS, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.registrationDates.startDate) params.append('startDate', filters.registrationDates.startDate);
        if (filters.registrationDates.endDate) params.append('endDate', filters.registrationDates.endDate);
        if (filters.lastLoginDates.startDate) params.append('lastLoginStartDate', filters.lastLoginDates.startDate);
        if (filters.lastLoginDates.endDate) params.append('lastLoginEndDate', filters.lastLoginDates.endDate);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
        if (filters.sessionCount) params.append('sessionCount', filters.sessionCount);
        if (filters.timePlayed.min) params.append('minTimePlayed', String(filters.timePlayed.min * 60)); // Convert to seconds
        if (filters.timePlayed.max) params.append('maxTimePlayed', String(filters.timePlayed.max * 60)); // Convert to seconds
        if (filters.gameTitle && filters.gameTitle.length > 0) {
          filters.gameTitle.forEach(title => params.append('gameTitle', title));
        }
        if (filters.gameCategory && filters.gameCategory.length > 0) {
          filters.gameCategory.forEach(category => params.append('gameCategory', category));
        }
        if (filters.country && filters.country.length > 0) {
          filters.country.forEach(country => params.append('country', country));
        }
        if (filters.ageGroup) params.append('ageGroup', filters.ageGroup);
      }
      const url = `${BackendRoute.ADMIN_USERS_ANALYTICS}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await backendService.get(url);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch analytics for a specific user
 * @param userId - User ID
 * @returns Query result with user analytics data
 */
export const useUserAnalyticsById = (userId: string) => {
  const url = BackendRoute.ADMIN_USER_ANALYTICS.replace(':id', userId);
  return useQuery<UserAnalytics>({
    queryKey: [BackendRoute.ADMIN_USER_ANALYTICS, userId],
    queryFn: async () => {
      const response = await backendService.get(url);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch all games with their analytics
 * @returns Query result with games analytics data
 */
export const useGamesAnalytics = () => {
  return useQuery<GameAnalytics[]>({
    queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.ADMIN_GAMES_ANALYTICS);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch analytics for a specific game
 * @param gameId - Game ID
 * @returns Query result with game analytics data
 */
export const useGameAnalyticsById = (gameId: string) => {
  const url = BackendRoute.ADMIN_GAME_ANALYTICS.replace(':id', gameId);
  return useQuery<GameAnalytics>({
    queryKey: [BackendRoute.ADMIN_GAME_ANALYTICS, gameId],
    queryFn: async () => {
      const response = await backendService.get(url);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch user activity log
 * @returns Query result with user activity log data
 */
export const useUserActivityLog = () => {
  return useQuery<UserActivityLog[]>({
    queryKey: [BackendRoute.ADMIN_USER_ACTIVITY],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.ADMIN_USER_ACTIVITY);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to trigger inactive users check
 * @returns Mutation function to check inactive users
 */
export const useCheckInactiveUsers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await backendService.post(BackendRoute.ADMIN_CHECK_INACTIVE);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries that might be affected by the inactive users check
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_DASHBOARD] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USERS_ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_USER_ACTIVITY] });
    },
  });
};

// User Stats Types
interface UserGameStats {
  gameId: string;
  title: string;
  thumbnailUrl: string;
  totalSeconds: number;
  lastPlayed: Date;
}

interface UserStats {
  totalSeconds: number;
  totalPlays: number;
  gamesPlayed: UserGameStats[];
}

/**
 * Hook to fetch current user's game statistics
 * @returns Query result with user stats data
 */
export const useCurrentUserStats = () => {
  return useQuery<UserStats>({
    queryKey: [BackendRoute.USER_STATS],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.USER_STATS);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};
export const useGamesWithPopularity = () => {
  return useQuery({
    queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS_POPULARITY],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.ADMIN_GAMES_ANALYTICS_POPULARITY);
      return response;
    },
    refetchOnWindowFocus: false,
  });
};
