import JSZip from 'jszip';
import { backendService } from '../backend/api.service';

// Simple UUID generator to avoid external dependency
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Simple parallel upload with concurrency control
const uploadFileToR2 = async (
  file: Blob,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  // Get signed URL
  const response = await backendService.post('api/upload/signed-url', {
    filename,
    contentType: file.type || 'application/octet-stream',
  });

  const uploadUrl = response.data.uploadUrl;

  // Upload file with progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

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

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
};

export interface FrontendUploadOptions {
  title: string;
  description?: string;
  categoryId?: string;
  config?: number;
  position?: number;
}

export interface UploadProgress {
  phase: 'extracting' | 'uploading' | 'finalizing' | 'completed' | 'error';
  progress: number;
  message: string;
  filesUploaded?: number;
  totalFiles?: number;
  error?: string;
}

export class FrontendUploadService {
  async uploadGame(
    thumbnailFile: File,
    gameZipFile: File,
    options: FrontendUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ gameId: string }> {
    try {
      // Step 1: Extract ZIP file
      if (onProgress) {
        onProgress({
          phase: 'extracting',
          progress: 10,
          message: 'Extracting game files...',
        });
      }

      const gameId = generateUUID();
      const extractedFiles = await this.extractZipFile(gameZipFile, gameId);

      // Step 2: Prepare all files for upload
      if (onProgress) {
        onProgress({
          phase: 'extracting',
          progress: 30,
          message: 'Preparing files for upload...',
        });
      }

      const allFiles = [
        {
          name: `thumbnails/${gameId}-thumbnail.${this.getFileExtension(thumbnailFile.name)}`,
          data: thumbnailFile,
          type: thumbnailFile.type,
          isMain: false,
        },
        ...extractedFiles,
      ];

      if (onProgress) {
        onProgress({
          phase: 'uploading',
          progress: 40,
          message: 'Starting upload...',
          totalFiles: allFiles.length,
          filesUploaded: 0,
        });
      }

      // Step 3: Upload all files with controlled concurrency
      const concurrency = 5; // Upload 5 files at a time
      let uploadedCount = 0;

      for (let i = 0; i < allFiles.length; i += concurrency) {
        const batch = allFiles.slice(i, i + concurrency);
        
        await Promise.all(
          batch.map(async (file) => {
            await uploadFileToR2(file.data, file.name, (_fileProgress) => {
              // Individual file progress can be tracked here if needed
            });
            uploadedCount++;
            
            if (onProgress) {
              const overallProgress = 40 + Math.round((uploadedCount / allFiles.length) * 40);
              onProgress({
                phase: 'uploading',
                progress: overallProgress,
                message: `Uploading files... (${uploadedCount}/${allFiles.length})`,
                filesUploaded: uploadedCount,
                totalFiles: allFiles.length,
              });
            }
          })
        );
      }

      // Step 4: Create game record in database
      if (onProgress) {
        onProgress({
          phase: 'finalizing',
          progress: 90,
          message: 'Creating game record...',
        });
      }

      const mainGameFile = extractedFiles.find(f => f.isMain);
      if (!mainGameFile) {
        throw new Error('No index.html found in game files');
      }

      const gameData = {
        title: options.title,
        description: options.description,
        categoryId: options.categoryId,
        config: options.config || 1,
        position: options.position,
        thumbnailUrl: `thumbnails/${gameId}-thumbnail.${this.getFileExtension(thumbnailFile.name)}`,
        gameFileUrl: mainGameFile.name,
      };

      const gameResponse = await backendService.post('api/games/frontend-upload', gameData);

      if (onProgress) {
        onProgress({
          phase: 'completed',
          progress: 100,
          message: 'Game uploaded successfully!',
          filesUploaded: allFiles.length,
          totalFiles: allFiles.length,
        });
      }

      return { gameId: gameResponse.data.data.id };

    } catch (error) {
      console.error('Upload error:', error);
      if (onProgress) {
        onProgress({
          phase: 'error',
          progress: 0,
          message: `Upload failed: ${(error as Error).message}`,
          error: (error as Error).message,
        });
      }
      throw error;
    }
  }

  private async extractZipFile(zipFile: File, gameId: string): Promise<Array<{
    name: string;
    data: Blob;
    type: string;
    isMain: boolean;
  }>> {
    const zip = await JSZip.loadAsync(zipFile);
    const files: Array<{
      name: string;
      data: Blob;
      type: string;
      isMain: boolean;
    }> = [];

    let indexHtmlFound = false;

    // Process each file in the ZIP
    for (const [relativePath, file] of Object.entries(zip.files)) {
      if (file.dir) continue; // Skip directories

      const blob = await file.async('blob');
      const fileName = relativePath.toLowerCase();
      const isMainFile = fileName === 'index.html' || fileName.endsWith('/index.html');
      
      if (isMainFile) {
        indexHtmlFound = true;
      }

      files.push({
        name: `games/${gameId}/${relativePath}`,
        data: blob,
        type: this.getMimeType(relativePath),
        isMain: isMainFile,
      });
    }

    if (!indexHtmlFound) {
      throw new Error('No index.html found in the ZIP file. Please ensure your game has an index.html file.');
    }

    return files;
  }

  private getMimeType(filename: string): string {
    const ext = this.getFileExtension(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  destroy() {
    // No cleanup needed for this implementation
  }
}

export const frontendUploadService = new FrontendUploadService();
