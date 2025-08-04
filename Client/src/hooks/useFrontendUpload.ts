import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { frontendUploadService } from '../services/frontend-upload.service';
import type { FrontendUploadOptions, FrontendUpdateOptions, UploadProgress } from '../services/frontend-upload.service';

export interface UseFrontendUploadReturn {
  uploadGame: (
    thumbnailFile: File,
    gameZipFile: File,
    options: FrontendUploadOptions
  ) => Promise<{ gameId: string }>;
  updateGame: (
    thumbnailFile: File | null,
    gameZipFile: File | null,
    options: FrontendUpdateOptions
  ) => Promise<{ gameId: string }>;
  progress: UploadProgress;
  isUploading: boolean;
  isCompleted: boolean;
  hasError: boolean;
  reset: () => void;
}

export const useFrontendUpload = (): UseFrontendUploadReturn => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<UploadProgress>({
    phase: 'extracting',
    progress: 0,
    message: 'Ready to upload',
  });

  const [isUploading, setIsUploading] = useState(false);

  const uploadGame = useCallback(async (
    thumbnailFile: File,
    gameZipFile: File,
    options: FrontendUploadOptions
  ): Promise<{ gameId: string }> => {
    setIsUploading(true);
    
    try {
      const result = await frontendUploadService.uploadGame(
        thumbnailFile,
        gameZipFile,
        options,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      // Invalidate React Query cache after successful upload
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      
      // Also invalidate the exact query key used by GameManagement
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games-analytics'] });

      return result;
    } catch (error) {
      setProgress({
        phase: 'error',
        progress: 0,
        message: `Upload failed: ${(error as Error).message}`,
        error: (error as Error).message,
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [queryClient]);

  const updateGame = useCallback(async (
    thumbnailFile: File | null,
    gameZipFile: File | null,
    options: FrontendUpdateOptions
  ): Promise<{ gameId: string }> => {
    setIsUploading(true);
    
    try {
      const result = await frontendUploadService.updateGame(
        thumbnailFile,
        gameZipFile,
        options,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      // Invalidate React Query cache after successful update
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      
      // Also invalidate specific game query
      queryClient.invalidateQueries({ queryKey: ['/api/games', options.gameId] });

      return result;
    } catch (error) {
      setProgress({
        phase: 'error',
        progress: 0,
        message: `Update failed: ${(error as Error).message}`,
        error: (error as Error).message,
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [queryClient]);

  const reset = useCallback(() => {
    setProgress({
      phase: 'extracting',
      progress: 0,
      message: 'Ready to upload',
    });
    setIsUploading(false);
  }, []);

  return {
    uploadGame,
    updateGame,
    progress,
    isUploading,
    isCompleted: progress.phase === 'completed',
    hasError: progress.phase === 'error',
    reset,
  };
};
