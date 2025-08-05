import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

import { IStorageService, UploadResult } from './storage.interface';
import config from '../config/config';
import logger from '../utils/logger';

/**
 * An adapter for the IStorageService interface that connects to Cloudflare R2.
 * It leverages R2's S3-compatible API.
 */
export class R2StorageAdapter implements IStorageService {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    // These are the R2-specific credentials and endpoint from our config
    const r2AccountId = config.r2.accountId;
    const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

    const s3ClientConfig: S3ClientConfig = {
      region: 'auto', // R2 requires 'auto'
      endpoint: endpoint, // This is the key that points the SDK to R2
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    };

    logger.info(`Initializing storage adapter for Cloudflare R2`);
    this.s3Client = new S3Client(s3ClientConfig);
    this.bucket = config.r2.bucket; // Your R2 bucket name
    this.publicUrl = config.r2.publicUrl; // e.g., https://games.yourdomain.com
  }

  /**
   * @inheritdoc
   */
  getPublicUrl(key: string): string {
    // This simply prepends the base public URL of our Worker to the storage key.
    return `${this.publicUrl}/${key}`;
  }

  /**
   * @inheritdoc
   */
  async generatePresignedUrl(key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      logger.info(`Generated presigned URL for key: ${key}`);
      return url;
    } catch (error) {
      logger.error('Error generating presigned URL:', { error, key });
      throw new Error(
        `Failed to generate presigned URL: ${(error as Error).message}`
      );
    }
  }

  /**
   * @inheritdoc
   */
  async uploadFile(
    file: Buffer,
    originalname: string,
    contentType: string,
    folder: string = 'files'
  ): Promise<UploadResult> {
    try {
      const fileId = uuidv4();
      const extension = path.extname(originalname);
      const filename = path
        .basename(originalname, extension)
        .replace(/\s+/g, '-')
        .toLowerCase();

      // The key is the full path in the bucket, e.g., "thumbnails/123-abc-my-image.jpg"
      const key = `${folder}/${fileId}-${filename}${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      logger.info(`Successfully uploaded file to R2 with key: ${key}`);

      return {
        key,
        publicUrl: this.getPublicUrl(key),
      };
    } catch (error) {
      logger.error('Error uploading file to R2:', { error, originalname });
      throw new Error(
        `Failed to upload file to R2: ${(error as Error).message}`
      );
    }
  }

  /**
   * @inheritdoc
   */
  async uploadDirectory(localPath: string, remotePath: string): Promise<void> {
    try {
      const files = await fs.readdir(localPath, { withFileTypes: true });

      for (const file of files) {
        const fullLocalPath = path.join(localPath, file.name);
        const fullRemotePath = path
          .join(remotePath, file.name)
          .replace(/\\/g, '/');

        if (file.isDirectory()) {
          // Recursively upload subdirectories
          await this.uploadDirectory(fullLocalPath, fullRemotePath);
        } else {
          // Upload the file
          const fileContent = await fs.readFile(fullLocalPath);
          const contentType =
            mime.lookup(fullLocalPath) || 'application/octet-stream';

          const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: fullRemotePath,
            Body: fileContent,
            ContentType: contentType,
          });

          await this.s3Client.send(command);
        }
      }
      logger.info(
        `Successfully uploaded directory "${localPath}" to R2 at "${remotePath}"`
      );
    } catch (error) {
      logger.error('Error uploading directory to R2:', {
        error,
        localPath,
        remotePath,
      });
      throw new Error(
        `Failed to upload directory to R2: ${(error as Error).message}`
      );
    }
  }

  /**
   * @inheritdoc
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No file content received');
      }

      const buffer = Buffer.from(await response.Body.transformToByteArray());
      logger.info(`Successfully downloaded file from R2 with key: ${key}`);
      return buffer;
    } catch (error) {
      logger.error('Error downloading file from R2:', { error, key });
      throw new Error(
        `Failed to download file from R2: ${(error as Error).message}`
      );
    }
  }

  /**
   * @inheritdoc
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info(`Successfully deleted file from R2 with key: ${key}`);
      return true;
    } catch (error) {
      logger.error('Error deleting file from R2:', { error, key });
      // Don't throw, just return false for a failed deletion
      return false;
    }
  }
}
