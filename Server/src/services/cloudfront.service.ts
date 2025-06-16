import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import config from '../config/config';
import logger from '../utils/logger';

export interface CloudFrontServiceInterface {
  transformS3UrlToCloudFront(s3Url: string): Promise<string>;
  transformS3KeyToCloudFront(s3Key: string): Promise<string>;
  getSignedCookies(resourcePath: string): { [key: string]: string };
  getConfigurationStatus(): Promise<any>;
}

export class CloudFrontService implements CloudFrontServiceInterface {
  private distributionDomain: string;
  private keyPairId: string;
  private privateKey: string | null = null; // Initialize as null
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private secretsManager: SecretsManagerClient;

  constructor() {
    this.distributionDomain = config.cloudfront.distributionDomain;
    this.keyPairId = config.cloudfront.keyPairId;
    this.secretsManager = new SecretsManagerClient({
      region: config.ses.region, // Assuming the secret is in the same region as SES
    });

    // Start initialization, but don't block the constructor
    this.initializationPromise = this.init().catch((error) => {
      logger.error(
        'Failed to initialize CloudFront service during construction:',
        error
      );
      // The service will remain in a non-initialized state
    });
  }

  private async init(): Promise<void> {
    if (this.isInitialized || !this.keyPairId) {
      if (!this.keyPairId) {
        logger.warn(
          'CloudFront Key Pair ID is not configured. Skipping private key fetching.'
        );
      }
      return;
    }

    try {
      logger.info(
        'Fetching CloudFront private key from AWS Secrets Manager...'
      );
      const command = new GetSecretValueCommand({
        SecretId: 'chareli/testing/cloudfront_private_key',
      });
      const response = await this.secretsManager.send(command);

      if (response.SecretString) {
        // AWS Secrets Manager often stores the secret as a JSON string with the key being the secret name.
        // However in our case it is saved as is so no need to parse it.
        this.privateKey = response.SecretString.trim();
      }

      if (!this.privateKey) {
        throw new Error(
          'Failed to retrieve CloudFront private key from Secrets Manager or key value is empty.'
        );
      }

      this.isInitialized = true;
      logger.info(
        'CloudFront service initialized successfully with private key.'
      );
    } catch (error) {
      logger.error(
        'Error fetching CloudFront private key from Secrets Manager:',
        error
      );
      // Set privateKey to null to indicate failure
      this.privateKey = null;
      // Re-throw the error to be caught by the caller if needed
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      throw new Error('CloudFrontService initialization was not started.');
    }
    // Wait for the initialization promise to resolve or reject
    await this.initializationPromise;
    if (!this.isInitialized) {
      throw new Error('CloudFront service failed to initialize.');
    }
  }

  public getSignedCookies(resourcePath: string): { [key: string]: string } {
    if (
      !this.isInitialized ||
      !this.distributionDomain ||
      !this.keyPairId ||
      !this.privateKey
    ) {
      throw new Error(
        'CloudFront service is not properly configured for signing cookies.'
      );
    }

    // The policy determines which files can be accessed.
    // e.g., 'https://<cdn-domain>/games/game-123/*'
    const resourceUrl = `https://${this.distributionDomain}/${resourcePath}`;

    // Cookies should expire in a reasonable time, e.g., 24 hours.
    const expires = new Date();
    expires.setDate(expires.getDate() + 1); // 24-hour expiration

    const signedCookies = getSignedCookies({
      url: resourceUrl,
      keyPairId: this.keyPairId,
      privateKey: this.privateKey,
      dateLessThan: expires.toISOString(),
    });

    return Object.fromEntries(
      Object.entries(signedCookies).map(([key, value]) => [key, String(value)])
    );
  }

  // The transform methods remain the same but should also ensure initialization
  async transformS3KeyToCloudFront(s3Key: string): Promise<string> {
    await this.ensureInitialized();
    // Your existing logic...
    // Fallback to S3 URL if not initialized
    if (!this.isInitialized || !this.privateKey) {
      const bucketName = config.s3.bucket;
      return config.s3.endpoint
        ? `${config.s3.endpoint}/${bucketName}/${s3Key}`
        : `https://${bucketName}.s3.${config.s3.region}.amazonaws.com/${s3Key}`;
    }
    // ... rest of the signing logic
    return `https://${this.distributionDomain}/${s3Key}`; // Placeholder for signed URL logic if you need it
  }

  async transformS3UrlToCloudFront(s3Url: string): Promise<string> {
    await this.ensureInitialized();
    // Your existing logic...
    // Fallback to original S3 URL if not initialized
    if (!this.isInitialized) {
      return s3Url;
    }
    // ... rest of the transformation logic
    return s3Url; // Placeholder
  }

  
  public async getConfigurationStatus(): Promise<any> {
    const status: any = {
      timestamp: new Date().toISOString(),
      configuration: {
        distributionDomain: this.distributionDomain || '❌ MISSING',
        keyPairId: this.keyPairId || '❌ MISSING',
        secretName: 'chareli/testing/cloudfront_private_key',
        privateKey: 'Unknown'
      },
      initialization: {
        isInitialized: this.isInitialized,
        hasPrivateKey: !!this.privateKey,
        initializationStarted: !!this.initializationPromise,
        cookieGeneration: 'Not Tested'
      },
      missing: [] as string[],
      errors: [] as string[],
      overall: 'Unknown',
      devOpsAction: null,
      troubleshooting: null
    };

    // Check what's missing from environment variables
    if (!this.distributionDomain) {
      status.missing.push('CLOUDFRONT_DISTRIBUTION_DOMAIN');
    }
    if (!this.keyPairId) {
      status.missing.push('CLOUDFRONT_KEY_PAIR_ID');
    }

    // Test private key retrieval
    let privateKeyStatus = 'Unknown';
    try {
      if (this.initializationPromise) {
        await this.initializationPromise;
        if (this.isInitialized && this.privateKey) {
          privateKeyStatus = '✅ Retrieved Successfully';
        } else {
          privateKeyStatus = '❌ Failed to Retrieve';
          status.errors.push('Private key could not be retrieved from AWS Secrets Manager');
        }
      } else {
        privateKeyStatus = '❌ Initialization Not Started';
        status.errors.push('CloudFront service initialization was not started');
      }
    } catch (error) {
      privateKeyStatus = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      status.errors.push(`Private key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    status.configuration.privateKey = privateKeyStatus;

    // Test cookie generation if everything is configured
    let cookieGenerationStatus = 'Not Tested';
    if (status.missing.length === 0 && this.isInitialized) {
      try {
        const testCookies = this.getSignedCookies('test/*');
        const hasPolicyCookie = !!testCookies['CloudFront-Policy'];
        const hasSignatureCookie = !!testCookies['CloudFront-Signature'];
        const hasKeyPairIdCookie = !!testCookies['CloudFront-Key-Pair-Id'];
        
        if (hasPolicyCookie && hasSignatureCookie && hasKeyPairIdCookie) {
          cookieGenerationStatus = '✅ Working';
        } else {
          cookieGenerationStatus = '❌ Incomplete Cookies Generated';
          status.errors.push('Cookie generation is incomplete - some cookies are missing');
        }
      } catch (error) {
        cookieGenerationStatus = `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        status.errors.push(`Cookie generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      cookieGenerationStatus = '⏸️ Skipped (Missing Configuration)';
    }

    status.initialization.cookieGeneration = cookieGenerationStatus;

    // Overall status
    const isFullyConfigured = status.missing.length === 0 && status.errors.length === 0;
    status.overall = isFullyConfigured ? 
      '✅ CloudFront Fully Configured and Working' : 
      '🚨 CloudFront Configuration Issues Detected';

    // DevOps action items
    if (status.missing.length > 0) {
      status.devOpsAction = {
        message: 'Set the following environment variables:',
        required: status.missing,
        examples: {
          'CLOUDFRONT_DISTRIBUTION_DOMAIN': 'd2ns3zhxgoe7jt.cloudfront.net',
          'CLOUDFRONT_KEY_PAIR_ID': 'K1MG939NUWLVLL'
        }
      };
    }

    if (status.errors.length > 0) {
      status.troubleshooting = {
        message: 'The following issues need to be resolved:',
        issues: status.errors,
        commonSolutions: [
          'Verify AWS Secrets Manager contains the private key at: chareli/testing/cloudfront_private_key',
          'Check AWS credentials and permissions for Secrets Manager access',
          'Ensure CloudFront distribution domain is correct',
          'Verify CloudFront Key Pair ID matches the private key'
        ]
      };
    }

    return status;
  }
}

// Singleton instance
export const cloudFrontService = new CloudFrontService();
