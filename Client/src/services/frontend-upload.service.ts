import JSZip from 'jszip';
import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import { backendService } from '../backend/api.service';

// Simple UUID generator to avoid external dependency
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface FrontendUploadOptions {
  title: string;
  description?: string;
  categoryId?: string;
  config?: number;
  position?: number;
}

export interface FrontendUpdateOptions {
  title: string;
  description?: string;
  categoryId?: string;
  config?: number;
  position?: number;
  gameId: string;
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
  private uppy: Uppy | null = null;

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

      // Step 3: Upload all files using Uppy
      await this.uploadFilesWithUppy(allFiles, onProgress);

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

      // Handle different response structures
      let responseGameId: string;
      if (gameResponse.data?.data?.id) {
        responseGameId = gameResponse.data.data.id;
      } else if (gameResponse.data?.id) {
        responseGameId = gameResponse.data.id;
      } else if (gameResponse.data?.gameId) {
        responseGameId = gameResponse.data.gameId;
      } else {
        console.error('Unexpected response structure:', gameResponse.data);
        throw new Error('Game created but could not retrieve game ID from response');
      }

      if (onProgress) {
        onProgress({
          phase: 'completed',
          progress: 100,
          message: 'Game uploaded successfully!',
          filesUploaded: allFiles.length,
          totalFiles: allFiles.length,
        });
      }

      return { gameId: responseGameId };

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

  private async uploadFilesWithUppy(
    files: Array<{
      name: string;
      data: Blob;
      type: string;
      isMain: boolean;
    }>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create new Uppy instance
      this.uppy = new Uppy({
        autoProceed: false,
        allowMultipleUploadBatches: false,
        restrictions: {
          maxNumberOfFiles: files.length,
        },
      });

      // Configure AWS S3 plugin
      this.uppy.use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          // Get signed URL for each file
          const response = await backendService.post('api/upload/signed-url', {
            filename: file.meta.key || file.name,
            contentType: file.type || 'application/octet-stream',
          });

          return {
            method: 'PUT',
            url: response.data.uploadUrl,
            fields: {},
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
          };
        },
      });

      let uploadedCount = 0;

      // Set up event listeners
      this.uppy.on('upload-progress', (_file, _progress) => {
        if (onProgress) {
          const overallProgress = 40 + Math.round((uploadedCount / files.length) * 40);
          onProgress({
            phase: 'uploading',
            progress: overallProgress,
            message: `Uploading files... (${uploadedCount}/${files.length})`,
            filesUploaded: uploadedCount,
            totalFiles: files.length,
          });
        }
      });

      this.uppy.on('upload-success', (_file, _response) => {
        uploadedCount++;
        if (onProgress) {
          const overallProgress = 40 + Math.round((uploadedCount / files.length) * 40);
          onProgress({
            phase: 'uploading',
            progress: overallProgress,
            message: `Uploading files... (${uploadedCount}/${files.length})`,
            filesUploaded: uploadedCount,
            totalFiles: files.length,
          });
        }
      });

      this.uppy.on('complete', (result) => {
        if (result.failed && result.failed.length > 0) {
          reject(new Error(`Upload failed for ${result.failed.length} files`));
        } else {
          resolve();
        }
        this.cleanup();
      });

      this.uppy.on('error', (error) => {
        reject(error);
        this.cleanup();
      });

      // Add files to Uppy
      files.forEach((file, _index) => {
        this.uppy!.addFile({
          name: file.name,
          type: file.type,
          data: file.data,
          meta: {
            key: file.name,
          },
        });
      });

      // Start upload
      this.uppy.upload();
    });
  }

  private cleanup() {
    if (this.uppy) {
      this.uppy.cancelAll();
      this.uppy.removeFiles(this.uppy.getFiles().map(file => file.id));
      this.uppy = null;
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

  async updateGame(
    thumbnailFile: File | null,
    gameZipFile: File | null,
    options: FrontendUpdateOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ gameId: string }> {
    try {
      const filesToUpload: Array<{
        name: string;
        data: Blob;
        type: string;
        isMain: boolean;
      }> = [];

      let gameData: any = {
        title: options.title,
        description: options.description,
        categoryId: options.categoryId,
        config: options.config || 1,
        position: options.position,
      };

      // Step 1: Handle ZIP file if provided
      if (gameZipFile) {
        if (onProgress) {
          onProgress({
            phase: 'extracting',
            progress: 10,
            message: 'Extracting game files...',
          });
        }

        const extractedFiles = await this.extractZipFile(gameZipFile, options.gameId);
        filesToUpload.push(...extractedFiles);

        const mainGameFile = extractedFiles.find(f => f.isMain);
        if (!mainGameFile) {
          throw new Error('No index.html found in game files');
        }
        gameData.gameFileUrl = mainGameFile.name;
      }

      // Step 2: Handle thumbnail if provided
      if (thumbnailFile) {
        if (onProgress) {
          onProgress({
            phase: 'extracting',
            progress: 20,
            message: 'Preparing thumbnail...',
          });
        }

        filesToUpload.push({
          name: `thumbnails/${options.gameId}-thumbnail.${this.getFileExtension(thumbnailFile.name)}`,
          data: thumbnailFile,
          type: thumbnailFile.type,
          isMain: false,
        });
        gameData.thumbnailUrl = `thumbnails/${options.gameId}-thumbnail.${this.getFileExtension(thumbnailFile.name)}`;
      }

      // Step 3: Upload files if any
      if (filesToUpload.length > 0) {
        if (onProgress) {
          onProgress({
            phase: 'uploading',
            progress: 30,
            message: 'Starting upload...',
            totalFiles: filesToUpload.length,
            filesUploaded: 0,
          });
        }

        await this.uploadFilesWithUppy(filesToUpload, onProgress);
      }

      // Step 4: Update game record in database
      if (onProgress) {
        onProgress({
          phase: 'finalizing',
          progress: 90,
          message: 'Updating game record...',
        });
      }

      const gameResponse = await backendService.put(`api/games/${options.gameId}/frontend-update`, gameData);

      // Handle different response structures
      let responseGameId: string;
      if (gameResponse.data?.data?.id) {
        responseGameId = gameResponse.data.data.id;
      } else if (gameResponse.data?.id) {
        responseGameId = gameResponse.data.id;
      } else if (gameResponse.data?.gameId) {
        responseGameId = gameResponse.data.gameId;
      } else {
        responseGameId = options.gameId; // Fallback to the provided gameId
      }

      if (onProgress) {
        onProgress({
          phase: 'completed',
          progress: 100,
          message: 'Game updated successfully!',
          filesUploaded: filesToUpload.length,
          totalFiles: filesToUpload.length,
        });
      }

      return { gameId: responseGameId };

    } catch (error) {
      console.error('Update error:', error);
      if (onProgress) {
        onProgress({
          phase: 'error',
          progress: 0,
          message: `Update failed: ${(error as Error).message}`,
          error: (error as Error).message,
        });
      }
      throw error;
    }
  }

  destroy() {
    // No cleanup needed for this implementation
  }
}

export const frontendUploadService = new FrontendUploadService();
