import { useMutation, useQueryClient } from '@tanstack/react-query';
import { backendService } from './api.service';
import { BackendRoute } from './constants';
import type { 
  PresignedUrlRequest, 
  PresignedUrlResponse, 
  CreateGameFromUploadRequest,
  GameResponse 
} from './types';

// Hook to get presigned URLs for direct S3 upload
export const useGetPresignedUrls = () => {
  return useMutation<PresignedUrlResponse, Error, PresignedUrlRequest>({
    mutationFn: async (data: PresignedUrlRequest) => {
      // console.log('Sending presigned URL request:', data);
      const response = await backendService.post(BackendRoute.UPLOAD_PRESIGNED_URLS, data);
      return response.data as PresignedUrlResponse;
    },
  });
};

// Hook to create game after files are uploaded to S3
export const useCreateGameFromUpload = () => {
  const queryClient = useQueryClient();
  return useMutation<GameResponse, Error, CreateGameFromUploadRequest>({
    mutationFn: async (data: CreateGameFromUploadRequest) => {
      const response = await backendService.post(BackendRoute.UPLOAD_CREATE_GAME, data);
      return response.data.data as GameResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ADMIN_GAMES_ANALYTICS] });
    },
  });
};

// Utility function to upload file to S3 using presigned URL
export const uploadFileToS3 = async (
  file: File | Blob, 
  uploadUrl: string, 
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }
    
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
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
};

// Utility function to get content type from file extension
export const getContentType = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop();
  
  const contentTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
  };
  
  return contentTypes[ext || ''] || 'application/octet-stream';
};

// Utility function to extract files from ZIP and prepare for upload
export const processZipForUpload = async (zipFile: File): Promise<Array<{
  path: string;
  contentType: string;
  size: number;
  file: File;
}>> => {
  // console.log('Starting ZIP processing for file:', zipFile.name, 'Size:', zipFile.size);
  
  try {
    // Import JSZip dynamically to avoid bundle size issues
    const JSZip = (await import('jszip')).default;
    // console.log('JSZip imported successfully');
    
    // console.log('Loading ZIP file...');
    const zip = await JSZip.loadAsync(zipFile);
    // console.log('ZIP loaded successfully. Files in ZIP:', Object.keys(zip.files).length);
    
    const files: Array<{
      path: string;
      contentType: string;
      size: number;
      file: File;
    }> = [];
    
    // Process each file in the ZIP
    // console.log('Processing ZIP entries...');
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      // console.log('Processing entry:', relativePath, 'Is directory:', zipEntry.dir);
      
      if (!zipEntry.dir) {
        // console.log('Extracting file content for:', relativePath);
        const fileContent = await zipEntry.async('blob');
        const contentType = getContentType(relativePath);
        
        // Create a File object from the blob
        const file = new File([fileContent], relativePath.split('/').pop() || relativePath, {
          type: contentType
        });
        
        files.push({
          path: relativePath,
          contentType,
          size: fileContent.size,
          file
        });
      }
    }
    
    // Validate that index.html exists
    const hasIndex = files.some(f => f.path.toLowerCase().endsWith('index.html'));

    
    if (!hasIndex) {
      throw new Error('No index.html file found in the ZIP archive');
    }
    
    // console.log('ZIP processing completed successfully');
    return files;
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    throw error;
  }
};

// Custom hook that encapsulates the entire upload flow
export const useGameUpload = () => {
  const getPresignedUrls = useGetPresignedUrls();
  const createGameFromUpload = useCreateGameFromUpload();
  
  const uploadGame = async (
    gameData: {
      title: string;
      description?: string;
      categoryId?: string;
      config?: number;
      thumbnailFile: File;
      gameFile: File;
    },
    onProgress?: (stage: string, progress: number) => void
  ) => {
    try {
      // console.log('Starting upload process for:', gameData.gameFile.name);
      
      // Stage 1: Process ZIP file
      // onProgress?.('Processing ZIP file...', 10);
      const files = await processZipForUpload(gameData.gameFile);

      // console.log("Files to be uploaded:", files);
      // console.log("Number of files:", files.length);
      
      // Stage 2: Get presigned URLs
      onProgress?.('Getting upload URLs...', 20);
      const requestPayload = {
        files: files.map(f => ({
          path: f.path,
          contentType: f.contentType,
          size: f.size
        })),
        thumbnail: {
          name: gameData.thumbnailFile.name,
          contentType: gameData.thumbnailFile.type,
          size: gameData.thumbnailFile.size
        }
      };
      
      console.log('Request payload for presigned URLs:', requestPayload);
      console.log('Files array length:', requestPayload.files.length);
      
      if (requestPayload.files.length === 0) {
        throw new Error('No files were extracted from the ZIP archive');
      }
      
      const presignedData = await getPresignedUrls.mutateAsync(requestPayload);
      console.log('Presigned URLs received:', presignedData);
      
      // Stage 3: Upload thumbnail
      onProgress?.('Uploading thumbnail...', 30);
      await uploadFileToS3(
        gameData.thumbnailFile,
        presignedData.thumbnail.uploadUrl,
        (progress) => onProgress?.('Uploading thumbnail...', 30 + (progress * 0.2))
      );
      
      // Stage 4: Upload game files
      onProgress?.('Uploading game files...', 50);
      const totalFiles = files.length;
      let completedFiles = 0;
      
      await Promise.all(
        presignedData.gameFiles.map(async (gameFileData: { path: string; uploadUrl: string; s3Key: string }) => {
          const file = files.find(f => f.path === gameFileData.path)?.file;
          if (file) {
            await uploadFileToS3(
              file,
              gameFileData.uploadUrl,
              () => {
                completedFiles++;
                const fileProgress = (completedFiles / totalFiles) * 30; // 30% for all files
                onProgress?.('Uploading game files...', 50 + fileProgress);
              }
            );
          }
        })
      );
      
      // Stage 5: Create game record
      onProgress?.('Creating game record...', 90);
      const result = await createGameFromUpload.mutateAsync({
        gameId: presignedData.gameId,
        title: gameData.title,
        description: gameData.description,
        categoryId: gameData.categoryId,
        config: gameData.config || 0,
        thumbnailS3Key: presignedData.thumbnail.s3Key,
        gameFileS3Key: presignedData.indexFileKey
      });
      
      onProgress?.('Complete!', 100);
      return result;
      
    } catch (error) {
      console.error('Game upload failed:', error);
      throw error;
    }
  };
  
  return {
    uploadGame,
    isLoading: getPresignedUrls.isPending || createGameFromUpload.isPending,
    error: getPresignedUrls.error || createGameFromUpload.error
  };
};
