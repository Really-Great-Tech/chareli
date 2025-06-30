import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import config from '../config/config';
import logger from '../utils/logger';

export class CloudFrontService {
  private readonly keyPairId: string;
  private readonly distributionDomain: string;
  private privateKeyPromise: Promise<string>;

  constructor() {
    this.distributionDomain = config.cloudfront.distributionDomain;
    this.keyPairId = config.cloudfront.keyPairId;
    if (config.env === 'production') {
      this.privateKeyPromise = this.fetchPrivateKeyFromEnv();
    }
  }

  private async fetchPrivateKeyFromEnv(): Promise<string> {
    const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;

    if (!privateKey) {
      logger.error(
        'FATAL: CLOUDFRONT_PRIVATE_KEY environment variable is not set. The ECS task definition is likely misconfigured'
      );
      throw new Error(
        'Cloudfront private key secret name is not configured in the environment.'
      );
    }

    logger.info(
      'Successfully loaded CloudFront Private key from environment variable'
    );

    return privateKey;
  }

  /**
   * Generates the three Set-Cookie headers required for accessing private CloudFront content.
   * @returns An object containing the Set-Cookie headers.
   */

  public async getSignedCookieHeaders(): Promise<Record<string, string>> {
    if (!this.distributionDomain || !this.keyPairId) {
      logger.warn(
        'CloudFront signing is not fully configured. Skipping cookie generation'
      );
      return {};
    }

    const privateKey = await this.privateKeyPromise;
    if (!privateKey) {
      throw new Error(
        'CloudFront private key is not available. Service may not have initialized correctly'
      );
    }

    const policy = JSON.stringify({
      Statement: [
        {
          Resource: `https://${this.distributionDomain}/games/*`,
          Condition: {
            // Cookie is valid for 1 day.
            DateLessThan: {
              'AWS:EpochTime': Math.floor(
                (Date.now() + 24 * 60 * 60 * 1000) / 1000
              ),
            },
          },
        },
      ],
    });

    const signedCookies = getSignedCookies({
      policy,
      privateKey,
      keyPairId: this.keyPairId,
    });

    const policyCookie = signedCookies['CloudFront-Policy'];
    const signatureCookie = signedCookies['CloudFront-Signature'];
    const keyPairIdCookie = signedCookies['CloudFront-Key-Pair-Id'];

    if (!policyCookie || !signatureCookie || !keyPairIdCookie) {
      logger.error(
        'Failed to generate all required CloudFront signed cookies.',
        { signedCookies }
      );
      throw new Error('Could not generate a complete set of signed cookies.');
    }

    return {
      'CloudFront-Policy': policyCookie,
      'CloudFront-Signature': signatureCookie,
      'CloudFront-Key-Pair-Id': keyPairIdCookie,
    };
  }
}

export const cloudFrontService = new CloudFrontService();
