import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });
interface Config {
  env: string;
  port: number;
  storageProvider: 'r2' | 's3' | 'local';
  app: {
    clientUrl: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  superadmin: {
    email: string;
    password: string;
  };
  smsService: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    senderName: string;
  };
  email: {
    service: string;
    user: string;
    password: string;
  };
  ses: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    fromEmail: string;
  };
  otp: {
    expiryMinutes: number;
    invitationExpiryDays: number;
  };
  sentry: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
    enabled: boolean;
  };
  s3: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    signedUrlExpiration: number;
  };
  cloudfront: {
    distributionDomain: string;
    keyPairId: string;
    cookieExpiration: number;
  };
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicUrl: string;
    bucket: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    enabled: boolean;
  };
  worker: {
    jwtSecret: string;
  };
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  if (process.env.NODE_ENV === 'production') {
    logger.error(`FATAL: Environment variable ${key} is not set`);
    process.exit(1);
  }

  logger.warn(
    `Environment variable ${key} is not set, setting it to an empty string.`
  );

  return '';
}

const config: Config = {
  env: getEnv('NODE_ENV', 'development'),
  app: { clientUrl: getEnv('CLIENT_URL', 'http://localhost:5173') },
  storageProvider: getEnv('STORAGE_PROVIDER', 'local') as 'r2' | 's3' | 'local',
  port: parseInt(getEnv('PORT', '5000'), 10),
  database: {
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '5432'), 10),
    username: getEnv('DB_USERNAME', 'postgres'),
    password: getEnv('DB_PASSWORD', 'postgres'),
    database: getEnv('DB_DATABASE', 'chareli_db'),
  },
  jwt: {
    secret: getEnv('JWT_SECRET', 'your_jwt_secret_key_here'),
    expiresIn: getEnv('JWT_EXPIRATION', '1h'),
    refreshSecret: getEnv(
      'JWT_REFRESH_SECRET',
      'your_refresh_token_secret_here'
    ),
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRATION', '7d'),
  },
  superadmin: {
    email: getEnv('SUPERADMIN_EMAIL', 'admin@example.com'),
    password: getEnv('SUPERADMIN_PASSWORD', 'Admin123!'),
  },
  smsService: {
    region: getEnv('AWS_REGION', 'us-east-1'),
    accessKeyId: getEnv('AWS_ACCESS_KEY_ID', ''),
    secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY', ''),
    senderName: getEnv('AWS_SNS_SENDER_NAME', 'Chareli'),
  },
  email: {
    service: getEnv('EMAIL_SERVICE', ''),
    user: getEnv('EMAIL_USER', ''),
    password: getEnv('EMAIL_PASSWORD', ''),
  },
  ses: {
    region: getEnv('SES_REGION', 'eu-central-1'),
    accessKeyId: getEnv('AWS_ACCESS_KEY_ID', ''),
    secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY', ''),
    fromEmail: getEnv(
      'AWS_SES_FROM_EMAIL',
      'no-reply@dev.chareli.reallygreattech.com'
    ),
  },
  otp: {
    expiryMinutes: parseInt(getEnv('OTP_EXPIRY_MINUTES', '5'), 10),
    invitationExpiryDays: parseInt(getEnv('INVITATION_EXPIRY_DAYS', '7'), 10),
  },
  sentry: {
    dsn: getEnv('SENTRY_DSN', ''),
    environment: getEnv('NODE_ENV', 'development'),
    tracesSampleRate: parseFloat(getEnv('SENTRY_TRACES_SAMPLE_RATE', '0.2')),
    enabled: getEnv('USE_SENTRY', 'false') === 'true',
  },
  s3: {
    region: getEnv('AWS_REGION', 'us-east-1'),
    accessKeyId: getEnv('AWS_ACCESS_KEY_ID', ''),
    secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY', ''),
    bucket: getEnv('AWS_S3_BUCKET', 'chareli-bucket'),
    // endpoint: process.env.AWS_S3_ENDPOINT,
    // forcePathStyle: getEnv('AWS_S3_FORCE_PATH_STYLE', 'false') === 'true',
    signedUrlExpiration: parseInt(
      getEnv('AWS_SIGNED_URL_EXPIRATION', '3600'),
      10
    ),
  },
  r2: {
    accountId: getEnv('CLOUDFLARE_ACCOUNT_ID'),
    accessKeyId: getEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY'),
    publicUrl: getEnv('R2_PUBLIC_URL'),
    bucket: getEnv('R2_BUCKET'),
  },
  cloudfront: {
    distributionDomain: getEnv('CLOUDFRONT_DISTRIBUTION_DOMAIN', ''),
    keyPairId: getEnv('CLOUDFRONT_KEY_PAIR_ID', ''),
    cookieExpiration: 86400, // 1 day in seconds
  },
  twilio: {
    accountSid: getEnv('TWILIO_ACCOUNT_SID', ''),
    authToken: getEnv('TWILIO_AUTH_TOKEN', ''),
    fromNumber: getEnv('TWILIO_FROM_NUMBER', ''),
    enabled: getEnv('USE_TWILIO', 'false') === 'true',
  },
  worker: {
    jwtSecret: getEnv(
      'WORKER_JWT_SECRET',
      'a_very_secure_secret_for_the_worker'
    ),
  },
};

export default config;
