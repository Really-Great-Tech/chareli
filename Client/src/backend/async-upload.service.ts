import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';

export interface PrepareUploadRequest {
  title: string;
  description?: string;
  thumbnailFilename: string;
  gameFilename: string;
  categoryId?: string;
  config?: number;
  position?: number;
}

export interface PrepareUploadResponse {
  success: boolean;
  data: {
    jobId: string;
    uploadUrls: {
      thumbnail: string;
      game: string;
    };
    keys: {
      thumbnail: string;
      game: string;
    };
  };
}

export interface UploadStatusResponse {
  success: boolean;
  data: {
    jobId: string;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
    progress: number;
    currentStep: string;
    result?: {
      gameId?: string;
      thumbnailFileId?: string;
      gameFileId?: string;
      publicUrls?: {
        thumbnail?: string;
        game?: string;
      };
    };
    errorMessage?: string;
    createdAt: string;
    completedAt?: string;
  };
}

// Hook to prepare async upload
export const usePrepareAsyncUpload = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PrepareUploadRequest) => {
      const response = await backendService.post('api/games/upload/prepare', data);
      return response;
    },
    onSuccess: () => {
      // Invalidate games queries when upload is prepared
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
    },
  });
};

// Hook to get upload status
export const useUploadStatus = (jobId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['upload-status', jobId],
    queryFn: async () => {
      const response = await backendService.get(`api/games/upload/status/${jobId}`);
      return response
    },
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      // Stop polling when completed or failed
      const data = query.state.data;
      if (data?.data?.status === 'completed' || data?.data?.status === 'failed') {
        return false;
      }
      // Poll every 2 seconds while processing
      return 2000;
    },
  });
};

// Hook to confirm upload
export const useConfirmUpload = () => {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await backendService.post('api/games/upload/confirm', { jobId });
      return response;
    },
  });
};

// Utility function to upload file directly to R2
export const uploadFileToR2 = async (
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};
