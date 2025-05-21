import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config/config';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../utils/logger';

export interface S3UploadResult {
  key: string;
  url: string;
  contentType: string;
  size?: number;
}

export interface S3ServiceInterface {
  uploadFile(file: Buffer, originalname: string, contentType: string, folder?: string): Promise<S3UploadResult>;
  uploadFiles(files: Array<{ buffer: Buffer, originalname: string, contentType: string }>, folder?: string): Promise<S3UploadResult[]>;
  deleteFile(key: string): Promise<boolean>;
  getFile(key: string): Promise<Buffer>;
  getSignedUrl(key: string, operation: 'get' | 'put', expiresIn?: number): Promise<string>;
  generatePresignedPost(key: string, contentType: string, expiresIn?: number): Promise<{ url: string, fields: Record<string, string> }>;
}

export class S3Service implements S3ServiceInterface {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      endpoint: config.s3.endpoint,
      forcePathStyle: config.s3.forcePathStyle
    });
    this.bucket = config.s3.bucket;
  }

  /**
   * Upload a single file to S3
   * @param file Buffer containing the file data
   * @param originalname Original filename
   * @param contentType MIME type of the file
   * @param folder Optional folder path within the bucket
   * @returns Object containing the S3 key and URL
   */
  async uploadFile(file: Buffer, originalname: string, contentType: string, folder?: string): Promise<S3UploadResult> {
    try {
      // For game files, preserve the original path structure
      let key;
      if (folder === 'games') {
        // Keep original path for game files
        key = `${folder}/${originalname}`;
      } else {
        // For other files (like thumbnails), use the old naming
        const fileId = uuidv4();
        const extension = path.extname(originalname);
        const filename = path.basename(originalname, extension).replace(/\s+/g, '-').toLowerCase();
        key = folder 
          ? `${folder}/${fileId}-${filename}${extension}`
          : `${fileId}-${filename}${extension}`;
      }
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType
      });
      
      await this.s3Client.send(command);
      
      // Generate URL
      const url = config.s3.endpoint 
        ? `${config.s3.endpoint}/${this.bucket}/${key}`
        : `https://${this.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
      
      return {
        key,
        url,
        contentType,
        size: file.length
      };
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Upload multiple files to S3
   * @param files Array of file objects containing buffer, originalname, and contentType
   * @param folder Optional folder path within the bucket
   * @returns Array of objects containing the S3 keys and URLs
   */
  async uploadFiles(files: Array<{ buffer: Buffer, originalname: string, contentType: string }>, folder?: string): Promise<S3UploadResult[]> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(file.buffer, file.originalname, file.contentType, folder)
      );
      
      return Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error uploading multiple files to S3:', error);
      throw new Error('Failed to upload multiple files to S3');
    }
  }

  /**
   * Delete a file from S3
   * @param key S3 key of the file to delete
   * @returns Boolean indicating success
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Get a file from S3
   * @param key S3 key of the file to get
   * @returns Buffer containing the file data
   */
  async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      
      const response = await this.s3Client.send(command);
      
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      if (response.Body) {
        // @ts-ignore - TypeScript doesn't know about the async iterator
        for await (const chunk of response.Body) {
          chunks.push(Buffer.from(chunk));
        }
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('Error getting file from S3:', error);
      throw new Error('Failed to get file from S3');
    }
  }

  /**
   * Generate a signed URL for getting or putting a file
   * @param key S3 key of the file
   * @param operation 'get' or 'put'
   * @param expiresIn Expiration time in seconds
   * @returns Signed URL
   */
  async getSignedUrl(key: string, operation: 'get' | 'put', expiresIn: number = config.s3.signedUrlExpiration): Promise<string> {
    try {
      let command;
      
      if (operation === 'get') {
        command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key
        });
      } else {
        command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key
        });
      }
      
      return getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Generate a presigned post for browser uploads
   * @param key S3 key for the file
   * @param contentType MIME type of the file
   * @param expiresIn Expiration time in seconds
   * @returns Object containing the URL and form fields
   */
  async generatePresignedPost(key: string, contentType: string, expiresIn: number = config.s3.signedUrlExpiration): Promise<{ url: string, fields: Record<string, string> }> {
    try {
      // For simplicity, we'll just return a signed PUT URL
      // In a real implementation, you would use the createPresignedPost method from @aws-sdk/s3-presigned-post
      const url = await this.getSignedUrl(key, 'put', expiresIn);
      
      return {
        url,
        fields: {
          'Content-Type': contentType
        }
      };
    } catch (error) {
      logger.error('Error generating presigned post:', error);
      throw new Error('Failed to generate presigned post');
    }
  }

  /**
   * Check if a file exists in S3
   * @param key S3 key of the file
   * @returns Boolean indicating if the file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the base URL for S3 bucket
   * @returns Base URL for the bucket
   */
  getBaseUrl(): string {
    return config.s3.endpoint 
      ? `${config.s3.endpoint}/${this.bucket}`
      : `https://${this.bucket}.s3.${config.s3.region}.amazonaws.com`;
  }
}

// Singleton instance
export const s3Service = new S3Service();
