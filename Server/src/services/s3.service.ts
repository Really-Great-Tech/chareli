import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config/config';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { promises as fs } from 'fs';
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
  uploadDirectory(dirPath: string, s3Prefix: string): Promise<void>;
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

  
  async uploadDirectory(dirPath: string, s3Prefix: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          // Recursively upload subdirectories
          await this.uploadDirectory(
            fullPath,
            path.join(s3Prefix, file.name).replace(/\\/g, '/')
          );
        } else {
          // Upload file
          const fileContent = await fs.readFile(fullPath);
          const s3Key = path.join(s3Prefix, file.name).replace(/\\/g, '/');
          
          // Determine content type based on file extension
          const ext = path.extname(file.name).toLowerCase();
          let contentType = 'application/octet-stream';
          
          switch (ext) {
            case '.html':
              contentType = 'text/html';
              break;
            case '.css':
              contentType = 'text/css';
              break;
            case '.js':
              contentType = 'application/javascript';
              break;
            case '.json':
              contentType = 'application/json';
              break;
            case '.png':
              contentType = 'image/png';
              break;
            case '.jpg':
            case '.jpeg':
              contentType = 'image/jpeg';
              break;
            case '.gif':
              contentType = 'image/gif';
              break;
            case '.svg':
              contentType = 'image/svg+xml';
              break;
          }
          
          const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: s3Key,
            Body: fileContent,
            ContentType: contentType
          });
          
          await this.s3Client.send(command);
        }
      }
    } catch (error) {
      logger.error('Error uploading directory to S3:', error);
      throw new Error('Failed to upload directory to S3');
    }
  }

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


  getBaseUrl(): string {
    return config.s3.endpoint 
      ? `${config.s3.endpoint}/${this.bucket}`
      : `https://${this.bucket}.s3.${config.s3.region}.amazonaws.com`;
  }
}


export const s3Service = new S3Service();
