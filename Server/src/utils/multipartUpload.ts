import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client } from '@aws-sdk/client-s3';
import config from '../config/config';
import logger from '../utils/logger';

// Initialize S3 client for multipart uploads
const getS3Client = (): S3Client => {
  const r2AccountId = config.r2.accountId;
  const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  });
};

export const multipartUploadHelpers = {
  /**
   * Create a multipart upload
   */
  async createMultipartUpload(key: string, contentType: string) {
    const s3Client = getS3Client();
    const command = new CreateMultipartUploadCommand({
      Bucket: config.r2.bucket,
      Key: key,
      ContentType: contentType,
    });

    const response = await s3Client.send(command);
    logger.info(
      `Created multipart upload for ${key}, UploadId: ${response.UploadId}`
    );

    return {
      uploadId: response.UploadId,
      key: response.Key,
    };
  },

  /**
   * Generate presigned URLs for uploading parts
   */
  async getPresignedUrlForPart(
    key: string,
    uploadId: string,
    partNumber: number
  ): Promise<string> {
    const s3Client = getS3Client();
    const command = new UploadPartCommand({
      Bucket: config.r2.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
  },

  /**
   * Complete a multipart upload
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ PartNumber: number; ETag: string }>
  ) {
    const s3Client = getS3Client();
    const command = new CompleteMultipartUploadCommand({
      Bucket: config.r2.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    const response = await s3Client.send(command);
    logger.info(`Completed multipart upload for ${key}`);

    return {
      location: response.Location,
      bucket: response.Bucket,
      key: response.Key,
      etag: response.ETag,
    };
  },

  /**
   * Abort a multipart upload
   */
  async abortMultipartUpload(key: string, uploadId: string) {
    const s3Client = getS3Client();
    const command = new AbortMultipartUploadCommand({
      Bucket: config.r2.bucket,
      Key: key,
      UploadId: uploadId,
    });

    await s3Client.send(command);
    logger.info(`Aborted multipart upload for ${key}, UploadId: ${uploadId}`);
  },
};
