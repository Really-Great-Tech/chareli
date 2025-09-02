import { useState, useEffect, useCallback, useRef } from 'react';
import { useGenerateGameAccessToken } from '../backend/r2.service';

interface UseSecureGameAccessOptions {
  gameId: string;
  expiresIn?: string;
  autoGenerate?: boolean;
}

interface SecureGameAccessState {
  isLoading: boolean;
  error: string | null;
  tokenData: any | null;
  gameUrl: string | null;
  isAuthenticated: boolean;
}

export const useSecureGameAccess = ({
  gameId,
  expiresIn = '1h',
  autoGenerate = true,
}: UseSecureGameAccessOptions) => {
  const [state, setState] = useState<SecureGameAccessState>({
    isLoading: false,
    error: null,
    tokenData: null,
    gameUrl: null,
    isAuthenticated: false,
  });

  const generateTokenMutation = useGenerateGameAccessToken();
  const lastGenerationTime = useRef<number>(0);
  const isGeneratingRef = useRef<boolean>(false);

  // Function to set the authentication cookie
  const setAuthCookie = useCallback((tokenData: any) => {
    const { cookieInstructions } = tokenData;
    
    try {
      // Set the cookie using the instructions from the backend
      const cookieString = `${cookieInstructions.name}=${cookieInstructions.value}; domain=${cookieInstructions.domain}; path=${cookieInstructions.path}; expires=${cookieInstructions.expires}; ${cookieInstructions.secure ? 'secure;' : ''} samesite=${cookieInstructions.sameSite}`;
      document.cookie = cookieString;  
      return true;
    } catch (error) {
      console.error('Failed to set authentication cookie:', error);
      return false;
    }
  }, []);

 
  // Function to generate token and set cookie
  const generateAndSetToken = useCallback(async () => {
    if (!gameId) return;
    if (isGeneratingRef.current) {
      console.log('🚫 Token generation already in progress, skipping...');
      return;
    }

    // Prevent rapid successive calls (minimum 5 seconds between calls)
    const now = Date.now();
    if (now - lastGenerationTime.current < 5000) {
      console.log('🚫 Token generation called too recently, skipping...');
      return;
    }

    isGeneratingRef.current = true;
    lastGenerationTime.current = now;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      console.log('🔄 Generating new game access token...');
      const tokenData = await generateTokenMutation.mutateAsync({
        gameId,
        request: { expiresIn },
      });

      // Set the authentication cookie
      const cookieSet = setAuthCookie(tokenData);
      
      if (cookieSet) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          tokenData,
          gameUrl: tokenData.gameUrl,
          isAuthenticated: true,
          error: null,
        }));

        console.log('🎮 Game access token generated and cookie set:', {
          gameUrl: tokenData.gameUrl,
          expiresAt: tokenData.expiresAt,
        });
      } else {
        throw new Error('Failed to set authentication cookie');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate access token';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      }));
      console.error('❌ Failed to generate game access token:', error);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [gameId, expiresIn, setAuthCookie]);

  // Auto-generate token on mount if enabled - use a ref to track if we've already tried
  useEffect(() => {
    if (autoGenerate && gameId && !state.tokenData && !state.isLoading && !generateTokenMutation.isPending) {
      generateAndSetToken();
    }
  }, [autoGenerate, gameId, state.tokenData, state.isLoading, generateTokenMutation.isPending, generateAndSetToken]);

  // Function to manually refresh token
  const refreshToken = useCallback(() => {
    generateAndSetToken();
  }, [generateAndSetToken]);

  // Function to clear authentication
  const clearAuth = useCallback(() => {
    if (state.tokenData) {
      // Clear the cookie
      const cookieName = state.tokenData.cookieInstructions.name;
      const domain = state.tokenData.cookieInstructions.domain;
      document.cookie = `${cookieName}=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      
      console.log('🧹 Authentication cleared');
    }

    setState({
      isLoading: false,
      error: null,
      tokenData: null,
      gameUrl: null,
      isAuthenticated: false,
    });
  }, [state.tokenData]);

  // Check if token is expired (with 30 second buffer to prevent edge cases)
  const isTokenExpired = useCallback(() => {
    if (!state.tokenData) return true;
    
    const expiresAt = new Date(state.tokenData.expiresAt);
    const now = new Date();
    const bufferTime = 30 * 1000; // 30 seconds buffer
    
    const isExpired = now.getTime() >= (expiresAt.getTime() - bufferTime);
    
    if (isExpired) {
      console.log('⏰ Token expiration check:', {
        now: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isExpired,
        timeUntilExpiry: Math.round((expiresAt.getTime() - now.getTime()) / 1000) + 's'
      });
    }
    
    return isExpired;
  }, [state.tokenData]);

  // Auto-refresh if token is expired (with proper debouncing)
  useEffect(() => {
    if (!state.tokenData || state.isLoading || isGeneratingRef.current) {
      return;
    }

    // Only check expiration periodically, not on every render
    const checkExpiration = () => {
      if (isTokenExpired()) {
        console.log('🔄 Token expired, refreshing...');
        refreshToken();
      }
    };

    // Set up interval to check every 30 seconds instead of on every render
    const interval = setInterval(checkExpiration, 30000);

    return () => clearInterval(interval);
  }, [state.tokenData, state.isLoading]); // Removed isTokenExpired and refreshToken from dependencies

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    tokenData: state.tokenData,
    gameUrl: state.gameUrl,
    isAuthenticated: state.isAuthenticated,
    
    // Actions
    generateToken: generateAndSetToken,
    refreshToken,
    clearAuth,
    
    // Utilities
    isTokenExpired: isTokenExpired(),
    expiresAt: state.tokenData?.expiresAt,
    
    // Debug info
    debugInfo: {
      cookieInstructions: state.tokenData?.cookieInstructions,
      testInstructions: state.tokenData?.testInstructions,
    },
  };
};
