import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { storageService } from './storage.service';
import { R2StorageAdapter } from './r2.storage.adapter';
import logger from '../utils/logger';

export interface DirectUploadRequest {
  filename: string;
  contentType: string;
  folder?: string;
  expiresIn?: number;
  gameTitle?: string; // For better naming context
}

export interface DirectUploadResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export class DirectUploadService {
  /**
   * Generate a clean, readable filename
   */
  private generateCleanFilename(originalFilename: string, gameTitle?: string): string {
    const extension = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, extension);
    
    // Create a clean base name
    let cleanName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // If we have a game title, use it for better context
    if (gameTitle) {
      const cleanGameTitle = gameTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30); // Limit length

      // For thumbnails, prefix with game title
      if (originalFilename.toLowerCase().includes('thumb') || 
          originalFilename.toLowerCase().includes('icon') ||
          extension.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        cleanName = `${cleanGameTitle}-thumbnail`;
      } else {
        // For game files, use game title
        cleanName = `${cleanGameTitle}-game`;
      }
    }

    // Ensure we have a valid filename
    if (!cleanName || cleanName.length < 3) {
      cleanName = 'file';
    }

    // Add timestamp for uniqueness (shorter format)
    const timestamp = Date.now().toString(36); // Base36 is shorter than base10
    
    return `${cleanName}-${timestamp}${extension}`;
  }

  /**
   * Generate direct upload URL for client-to-storage upload
   */
  async generateUploadUrl(request: DirectUploadRequest): Promise<DirectUploadResponse> {
    try {
      // Check if storage service supports direct uploads
      if (!storageService.generatePresignedUploadUrl) {
        throw new Error('Storage provider does not support direct uploads');
      }

      // Generate clean filename
      const cleanFilename = this.generateCleanFilename(request.filename, request.gameTitle);
      
      // Create organized folder structure
      const folder = request.folder || 'files';
      const dateFolder = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const key = `${folder}/${dateFolder}/${cleanFilename}`;

      // Generate direct upload URL
      const uploadUrl = await storageService.generatePresignedUploadUrl(
        key,
        request.contentType,
        request.expiresIn || 3600 // 1 hour default
      );

      const publicUrl = storageService.getPublicUrl(key);

      logger.info(`Generated direct upload URL for key: ${key}`);

      return {
        uploadUrl,
        key,
        publicUrl
      };
    } catch (error) {
      logger.error('Error generating direct upload URL:', error);
      throw new Error(`Failed to generate direct upload URL: ${(error as Error).message}`);
    }
  }

  /**
   * Generate direct upload URLs for multiple files
   */
  async generateMultipleUploadUrls(requests: DirectUploadRequest[]): Promise<DirectUploadResponse[]> {
    try {
      const results = await Promise.all(
        requests.map(request => this.generateUploadUrl(request))
      );

      return results;
    } catch (error) {
      logger.error('Error generating multiple direct upload URLs:', error);
      throw new Error(`Failed to generate direct upload URLs: ${(error as Error).message}`);
    }
  }

  /**
   * Validate that a file was successfully uploaded to the given key
   */
  async validateUpload(key: string, maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use the storage service directly to check if file exists
        if (storageService instanceof R2StorageAdapter) {
          // For R2, we can use the S3 client to check object existence
          const { S3Client, HeadObjectCommand } = await import('@aws-sdk/client-s3');
          const config = await import('../config/config');
          
          const r2AccountId = config.default.r2.accountId;
          const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
          
          const s3Client = new S3Client({
            region: 'auto',
            endpoint: endpoint,
            credentials: {
              accessKeyId: config.default.r2.accessKeyId,
              secretAccessKey: config.default.r2.secretAccessKey,
            },
          });

          const command = new HeadObjectCommand({
            Bucket: config.default.r2.bucket,
            Key: key,
          });

          await s3Client.send(command);
          logger.info(`File validation successful for key: ${key} (attempt ${attempt})`);
          return true;
        } else {
          // Fallback to public URL check for other storage providers
          const publicUrl = storageService.getPublicUrl(key);
          const response = await fetch(publicUrl, { method: 'HEAD' });
          if (response.ok) {
            logger.info(`File validation successful for key: ${key} (attempt ${attempt})`);
            return true;
          }
        }
      } catch (error) {
        logger.warn(`File validation attempt ${attempt} failed for key: ${key}`, (error as Error).message);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          logger.info(`Retrying file validation for key: ${key} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    logger.error(`File validation failed for key: ${key} after ${maxRetries} attempts`);
    return false;
  }
}

export const directUploadService = new DirectUploadService();
