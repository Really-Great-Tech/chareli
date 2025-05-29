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
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS] });
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
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS, variables.id] });
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
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS] });
    },
  });
};

// Admin Dashboard Types
interface DashboardAnalytics {
  totalUsers: number;
  totalRegisteredUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalGames: number;
  totalSessions: number;
  totalTimePlayed: number;
  mostPopularGame: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    sessionCount: number;
  } | null;
  avgSessionDuration: number;
}

export interface UserAnalytics {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
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
  metadata?: Record<string, any>;
}

/**
 * Hook to fetch dashboard analytics
 * @returns Query result with dashboard analytics data
 */
export const useDashboardAnalytics = () => {
  return useQuery<DashboardAnalytics>({
    queryKey: [BackendRoute.ADMIN_DASHBOARD],
    queryFn: async () => {
      const response = await backendService.get(BackendRoute.ADMIN_DASHBOARD);
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
  sessionCount: string;
  timePlayed: {
    min: number;
    max: number;
  };
  gameTitle: string;
  gameCategory: string;
}

export const useUsersAnalytics = (filters?: FilterState) => {
  return useQuery<UserAnalytics[]>({
    queryKey: [BackendRoute.ADMIN_USERS_ANALYTICS, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.registrationDates.startDate) params.append('startDate', filters.registrationDates.startDate);
        if (filters.registrationDates.endDate) params.append('endDate', filters.registrationDates.endDate);
        if (filters.sessionCount) params.append('sessionCount', filters.sessionCount);
        if (filters.timePlayed.min) params.append('minTimePlayed', String(filters.timePlayed.min * 60)); // Convert to seconds
        if (filters.timePlayed.max) params.append('maxTimePlayed', String(filters.timePlayed.max * 60)); // Convert to seconds
        if (filters.gameTitle) params.append('gameTitle', filters.gameTitle);
        if (filters.gameCategory) params.append('gameCategory', filters.gameCategory);
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
