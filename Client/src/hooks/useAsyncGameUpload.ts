import React, { useState, useCallback } from 'react';
import { 
  usePrepareAsyncUpload, 
  useUploadStatus, 
  useConfirmUpload, 
  uploadFileToR2
} from '../backend/async-upload.service';
import type { PrepareUploadRequest } from '../backend/async-upload.service';

export interface AsyncUploadState {
  phase: 'idle' | 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  jobId?: string;
  gameId?: string;
  error?: string;
  uploadProgress: {
    thumbnail: number;
    game: number;
  };
}

export const useAsyncGameUpload = () => {
  const [state, setState] = useState<AsyncUploadState>({
    phase: 'idle',
    progress: 0,
    message: 'Ready to upload',
    uploadProgress: { thumbnail: 0, game: 0 }
  });

  const prepareUpload = usePrepareAsyncUpload();
  const confirmUpload = useConfirmUpload();
  
  // Only poll status when we have a jobId and are in processing phase
  const { data: statusData } = useUploadStatus(
    state.jobId || '', 
    !!(state.jobId && (state.phase === 'processing' || state.phase === 'uploading'))
  );

  // Update state based on status polling
  React.useEffect(() => {
    if (statusData && state.phase === 'processing') {
      const { status, progress, currentStep, result, errorMessage } = statusData.data;
      
      if (status === 'completed' && result?.gameId) {
        setState(prev => ({
          ...prev,
          phase: 'completed',
          progress: 100,
          message: 'Upload completed successfully!',
          gameId: result.gameId
        }));
      } else if (status === 'failed') {
        setState(prev => ({
          ...prev,
          phase: 'error',
          error: errorMessage || 'Upload failed',
          message: errorMessage || 'Upload failed'
        }));
      } else {
        setState(prev => ({
          ...prev,
          progress: progress,
          message: currentStep
        }));
      }
    }
  }, [statusData, state.phase]);

  const uploadGame = useCallback(async (
    thumbnailFile: File,
    gameFile: File,
    metadata: Omit<PrepareUploadRequest, 'thumbnailFilename' | 'gameFilename'>
  ) => {
    try {
      // Reset state
      setState({
        phase: 'preparing',
        progress: 0,
        message: 'Preparing upload...',
        uploadProgress: { thumbnail: 0, game: 0 }
      });

      // Step 1: Prepare upload
      const prepareData = await prepareUpload.mutateAsync({
        ...metadata,
        thumbnailFilename: thumbnailFile.name,
        gameFilename: gameFile.name
      });

      const { jobId, uploadUrls } = prepareData.data;

      setState(prev => ({
        ...prev,
        jobId,
        phase: 'uploading',
        message: 'Uploading files...'
      }));

      // Step 2: Upload files directly to R2
      const uploadPromises = [
        // Upload thumbnail
        uploadFileToR2(thumbnailFile, uploadUrls.thumbnail, (progress) => {
          setState(prev => ({
            ...prev,
            uploadProgress: { ...prev.uploadProgress, thumbnail: progress }
          }));
        }),
        // Upload game file
        uploadFileToR2(gameFile, uploadUrls.game, (progress) => {
          setState(prev => ({
            ...prev,
            uploadProgress: { ...prev.uploadProgress, game: progress }
          }));
        })
      ];

      await Promise.all(uploadPromises);

      setState(prev => ({
        ...prev,
        progress: 50,
        message: 'Upload complete! Setting up your game...',
        uploadProgress: { thumbnail: 100, game: 100 }
      }));

      // Step 3: Confirm upload and start processing
      await confirmUpload.mutateAsync(jobId);

      setState(prev => ({
        ...prev,
        phase: 'processing',
        progress: 60,
        message: 'Almost ready...'
      }));

      // Status polling will take over from here via useEffect

    } catch (error) {
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
        message: error instanceof Error ? error.message : 'Upload failed'
      }));
    }
  }, [prepareUpload, confirmUpload]);

  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      progress: 0,
      message: 'Ready to upload',
      uploadProgress: { thumbnail: 0, game: 0 }
    });
  }, []);

  return {
    state,
    uploadGame,
    reset,
    isLoading: state.phase !== 'idle' && state.phase !== 'completed' && state.phase !== 'error',
    isCompleted: state.phase === 'completed',
    hasError: state.phase === 'error'
  };
};
