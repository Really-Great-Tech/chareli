import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  env: string;
  port: number;
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
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  email: {
    service: string;
    user: string;
    password: string;
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
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'chareli_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    expiresIn: process.env.JWT_EXPIRATION || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret_here',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  superadmin: {
    email: process.env.SUPERADMIN_EMAIL || 'admin@example.com',
    password: process.env.SUPERADMIN_PASSWORD || 'Admin123!',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  email: {
    service: process.env.EMAIL_SERVICE || '',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    invitationExpiryDays: parseInt(process.env.INVITATION_EXPIRY_DAYS || '7', 10),
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
    enabled: process.env.NODE_ENV === 'production'
  }
};

export default config;
