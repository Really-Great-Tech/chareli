import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import config from '../config/config';
import logger from '../utils/logger';

export interface CloudFrontServiceInterface {
  transformS3UrlToCloudFront(s3Url: string): Promise<string>;
  transformS3KeyToCloudFront(s3Key: string): Promise<string>;
}

export class CloudFrontService implements CloudFrontServiceInterface {
  private distributionDomain: string;
  private keyPairId: string;
  private privateKey: string;

  private secretsManager: SecretsManagerClient;

  constructor() {
    this.distributionDomain = config.cloudfront.distributionDomain;
    this.keyPairId = config.cloudfront.keyPairId;
    this.privateKey = '';
    this.secretsManager = new SecretsManagerClient({ 
      region: 'eu-central-1'
    });
    // this.init().catch(error => {
    //   logger.error('Failed to initialize CloudFront service:', error);
    // });
  }

//  private async init() {
//   try {
//     const command = new GetSecretValueCommand({
//       SecretId: ""
//     });
//     const response = await this.secretsManager.send(command);

//     this.privateKey = response.SecretString || '';
//     if (!this.privateKey) {
//       throw new Error('Failed to retrieve CloudFront private key from Secrets Manager');
//     }
//   } catch (error) {
//     logger.error('Error fetching CloudFront private key from Secrets Manager:', error);
//     throw error;
//   }
// }

  
  async transformS3KeyToCloudFront(s3Key: string): Promise<string> {
    try {
      if (!this.distributionDomain || !this.keyPairId || !this.privateKey) {
        logger.warn('CloudFront configuration not complete, generating S3 URL');
        const bucketName = config.s3.bucket;
        return config.s3.endpoint 
          ? `${config.s3.endpoint}/${bucketName}/${s3Key}`
          : `https://${bucketName}.s3.${config.s3.region}.amazonaws.com/${s3Key}`;
      }

      // Normalize and encode the S3 key for CloudFront
      const normalizedS3Key = s3Key
        .startsWith('/') ? s3Key.substring(1) : s3Key;
      
      // Ensure the path is properly encoded
      const encodedKey = encodeURIComponent(normalizedS3Key)
        .replace(/%2F/g, '/'); // Keep forward slashes for readability
      
      const cloudfrontUrl = `https://${this.distributionDomain}/${encodedKey}`;
      
      // Generate signed URL
      try {
        const now = new Date();
        const expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        expiryTime.setMilliseconds(0);

        const signedUrl = getSignedUrl({
          url: cloudfrontUrl,
          keyPairId: this.keyPairId,
          privateKey: this.privateKey,
          dateLessThan: expiryTime
        });

        return signedUrl;
      } catch (error: any) {
        throw error;
      }
    } catch (error) {
      logger.error('Error transforming S3 key to CloudFront:', error);
      // Fallback to S3 URL
      const bucketName = config.s3.bucket;
      const fallbackUrl = config.s3.endpoint 
        ? `${config.s3.endpoint}/${bucketName}/${s3Key}`
        : `https://${bucketName}.s3.${config.s3.region}.amazonaws.com/${s3Key}`;
      logger.warn(`Returning S3 URL as fallback: ${fallbackUrl}`);
      return fallbackUrl;
    }
  }

  
  async transformS3UrlToCloudFront(s3Url: string): Promise<string> {
    try {
      if (!this.distributionDomain) {
        logger.warn('CloudFront distribution domain not configured, returning S3 URL');
        return s3Url;
      }

      // Extract the S3 key from the URL
      let s3Key = '';
      const bucketName = config.s3.bucket;
      
      if (s3Url.includes(`${bucketName}.s3.`)) {
        // Format: https://bucket.s3.region.amazonaws.com/key
        const parts = s3Url.split(`${bucketName}.s3.`)[1];
        s3Key = parts.split('/').slice(1).join('/');
      } else if (s3Url.includes(`s3.`) && s3Url.includes(`/${bucketName}/`)) {
        // Format: https://s3.region.amazonaws.com/bucket/key
        const parts = s3Url.split(`/${bucketName}/`);
        s3Key = parts[1];
      } else if (s3Url.includes(`/${bucketName}/`)) {
        // Format: https://endpoint/bucket/key (custom endpoint)
        const parts = s3Url.split(`/${bucketName}/`);
        s3Key = parts[1];
      } else {
        throw new Error('Unable to parse S3 URL format');
      }

      if (!s3Key) {
        throw new Error('Could not extract S3 key from URL');
      }

      // Use the key transformation method
      return await this.transformS3KeyToCloudFront(s3Key);
    } catch (error) {
      logger.error('Error transforming S3 URL to CloudFront:', error);
      logger.warn(`Returning original S3 URL as fallback: ${s3Url}`);
      return s3Url; // Return original URL as fallback
    }
  }
}

// Singleton instance
export const cloudFrontService = new CloudFrontService();
