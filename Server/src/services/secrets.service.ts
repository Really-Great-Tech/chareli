import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

async function loadFromSecretsManager() {
  const secretName = process.env.AWS_SECRET_NAME;
  const region = process.env.AWS_REGION || 'eu-central-1';

  if (!secretName) {
    throw new Error('AWS_SECRET_NAME environment variable is not set');
  }

  const client = new SecretsManagerClient({ region });

  logger.info(`Fetching secrets from AWS Secrets Manager: ${secretName}`);

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: 'AWSCURRENT',
      })
    );

    if (response.SecretString) {
      const secret = JSON.parse(response.SecretString);
      for (const key in secret) {
        if (process.env[key] === undefined) {
          process.env[key] = secret[key];
        }
      }
      logger.info('Successfully loaded secrets from AWS Secrets Manager');
    } else {
      throw new Error('SecretString from AWS Secrets Manager is empty');
    }
  } catch (error) {
    logger.error('Could not fetch secrets from AWS Secrets Manager.', error);
    throw error;
  }
}

function loadFromDotenv() {
  logger.info('Loading configuration from .env file');
  dotenv.config({ path: path.join(__dirname, '../../.env') });
}

export async function loadConfiguration() {
  const configSource = process.env.NODE_ENV === 'production' ? 'aws' : 'file';
  if (configSource === 'aws') {
    await loadFromSecretsManager();
  } else {
    loadFromDotenv();
  }
}
