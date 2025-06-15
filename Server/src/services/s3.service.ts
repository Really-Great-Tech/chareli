import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config/config'; // Import the main config
import logger from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';
import mime from 'mime-types';

export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly endpoint?: string;
  private readonly baseUrl: string;

  constructor() {
    this.bucketName = config.s3.bucket;
    this.region = config.s3.region;
    this.endpoint = config.s3.endpoint;

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle: config.s3.forcePathStyle, // Useful for localstack/minio
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
    });

    // Construct the base URL for public access
    this.baseUrl = this.endpoint
      ? `${this.endpoint}/${this.bucketName}`
      : `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

    logger.info(
      `S3 Service initialized for bucket: ${this.bucketName} in region: ${this.region}`
    );
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  async uploadFile(
    buffer: Buffer,
    originalname: string,
    mimetype: string,
    type: string
  ) {
    const key = `${type}/${Date.now()}_${path.basename(originalname)}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await this.s3Client.send(command);
    logger.info(`File uploaded to S3: ${key}`);
    return { key };
  }

  async uploadDirectory(localPath: string, s3BasePath: string) {
    const files = await this.getFilesInDirectory(localPath);

    const uploadPromises = files.map(async (filePath) => {
      const relativePath = path.relative(localPath, filePath);
      const s3Key = path.join(s3BasePath, relativePath).replace(/\\/g, '/');
      const fileContent = await fs.readFile(filePath);
      const contentType = mime.lookup(filePath) || 'application/octet-stream';

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: contentType,
      });

      return this.s3Client.send(command);
    });

    await Promise.all(uploadPromises);
    logger.info(
      `Successfully uploaded directory ${localPath} to s3://${this.bucketName}/${s3BasePath}`
    );
  }

  private async getFilesInDirectory(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map(async (dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? this.getFilesInDirectory(res) : res;
      })
    );
    return Array.prototype.concat(...files);
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
    logger.info(`File deleted from S3: ${key}`);
    return { success: true };
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFolder(prefix: string) {
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const listedObjects = await this.s3Client.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;

    const deleteParams = {
      Bucket: this.bucketName,
      Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) },
    };

    const deleteCommand = new DeleteObjectsCommand(deleteParams);
    await this.s3Client.send(deleteCommand);

    if (listedObjects.IsTruncated) await this.deleteFolder(prefix);
  }
}

export const s3Service = new S3Service();
