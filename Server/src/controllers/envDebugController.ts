import { Request, Response, NextFunction } from 'express';
import config from '../config/config';
import { ApiError } from '../middlewares/errorHandler';

interface EnvDebugResponse {
  status: string;
  timestamp: string;
  environment: string;
  summary: {
    totalVariables: number;
    setVariables: number;
    missingVariables: number;
    configStatus: string;
  };
  environmentVariables: Record<string, string>;
  processedConfig: any;
  issues: string[];
}

/**
 * Complete list of all environment variables used in the application
 */
const ALL_ENV_VARIABLES = [
  // Core application
  'NODE_ENV',
  'PORT',
  'CLIENT_URL',
  'STORAGE_PROVIDER',

  // Database
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',

  // Redis
  'REDIS_HOST',
  'REDIS_PORT',

  // JWT
  'JWT_SECRET',
  'JWT_EXPIRATION',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRATION',

  // Superadmin
  'SUPERADMIN_EMAIL',
  'SUPERADMIN_PASSWORD',

  // AWS/SMS Service
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SNS_SENDER_NAME',

  // Email
  'EMAIL_SERVICE',
  'EMAIL_USER',
  'EMAIL_PASSWORD',

  // SES
  'SES_REGION',
  'AWS_SES_FROM_EMAIL',

  // OTP
  'OTP_EXPIRY_MINUTES',
  'INVITATION_EXPIRY_DAYS',

  // S3
  'AWS_S3_BUCKET',
  'AWS_S3_ENDPOINT',
  'AWS_S3_FORCE_PATH_STYLE',
  'AWS_SIGNED_URL_EXPIRATION',

  // CloudFront
  'CLOUDFRONT_DISTRIBUTION_DOMAIN',
  'CLOUDFRONT_KEY_PAIR_ID',

  // R2 (Cloudflare)
  'CLOUDFLARE_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'WORKER_JWT_SECRET',

  // Twilio
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
  'USE_TWILIO',
  'TWILIO_SERVICE_SID'
];

/**
 * Mask sensitive values for security
 */
const maskSensitiveValue = (key: string, value: string): string => {
  const sensitiveKeys = [
    'password', 'secret', 'key', 'token', 'auth', 'credential',
    'private', 'sid', 'api_key', 'access_key', 'secret_key'
  ];
  
  const isSensitive = sensitiveKeys.some(sensitiveKey => 
    key.toLowerCase().includes(sensitiveKey)
  );
  
  if (!isSensitive || !value || value.length <= 6) {
    return value;
  }
  
  // Show first 3 and last 3 characters with asterisks in between
  const start = value.substring(0, 3);
  const end = value.substring(value.length - 3);
  const middle = '*'.repeat(Math.min(value.length - 6, 8));
  
  return `${start}${middle}${end}`;
};

/**
 * Get all environment variables with optional masking
 */
const getEnvironmentVariables = (showFull: boolean = false): Record<string, string> => {
  const envVars: Record<string, string> = {};
  
  // Get all known environment variables
  ALL_ENV_VARIABLES.forEach(key => {
    const value = process.env[key];
    if (value !== undefined) {
      envVars[key] = showFull ? value : maskSensitiveValue(key, value);
    } else {
      envVars[key] = '[NOT SET]';
    }
  });
  
  // Also include any additional environment variables that might exist
  Object.keys(process.env).forEach(key => {
    if (!ALL_ENV_VARIABLES.includes(key)) {
      const value = process.env[key] || '';
      envVars[key] = showFull ? value : maskSensitiveValue(key, value);
    }
  });
  
  return envVars;
};

/**
 * Get processed config with masking
 */
const getProcessedConfig = (showFull: boolean = false): any => {
  const maskConfigValue = (obj: any, path: string = ''): any => {
    if (typeof obj === 'string') {
      return showFull ? obj : maskSensitiveValue(path, obj);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const masked: any = {};
      Object.keys(obj).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;
        masked[key] = maskConfigValue(obj[key], currentPath);
      });
      return masked;
    }
    
    return obj;
  };
  
  return maskConfigValue(config);
};

/**
 * Check for configuration issues
 */
const getConfigurationIssues = (): string[] => {
  const issues: string[] = [];
  
  // Core required variables
  const coreRequiredVars = [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  coreRequiredVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push(`${varName} is not set (required for core functionality)`);
    }
  });
  
  // Check storage provider specific requirements
  const storageProvider = process.env.STORAGE_PROVIDER || 's3';
  
  if (storageProvider === 'r2') {
    const r2RequiredVars = [
      'CLOUDFLARE_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME',
      'R2_PUBLIC_URL'
    ];
    
    r2RequiredVars.forEach(varName => {
      if (!process.env[varName]) {
        issues.push(`${varName} is required for R2 storage provider`);
      }
    });
  } else if (storageProvider === 's3') {
    const s3RequiredVars = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_S3_BUCKET',
      'AWS_REGION'
    ];
    
    s3RequiredVars.forEach(varName => {
      if (!process.env[varName]) {
        issues.push(`${varName} is required for S3 storage provider`);
      }
    });
  }
  
  // Check email configuration
  if (process.env.EMAIL_SERVICE) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      issues.push('EMAIL_USER and EMAIL_PASSWORD are required when EMAIL_SERVICE is configured');
    }
  }
  
  // Check SES configuration
  if (process.env.AWS_SES_FROM_EMAIL && (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
    issues.push('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required for SES email service');
  }
  
  // Check Twilio configuration
  if (process.env.USE_TWILIO === 'true') {
    const twilioRequiredVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_FROM_NUMBER'
    ];
    
    twilioRequiredVars.forEach(varName => {
      if (!process.env[varName]) {
        issues.push(`${varName} is required when USE_TWILIO is enabled`);
      }
    });
  }
  
  // Check CloudFront configuration
  if (process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN && !process.env.CLOUDFRONT_KEY_PAIR_ID) {
    issues.push('CLOUDFRONT_KEY_PAIR_ID is required when CLOUDFRONT_DISTRIBUTION_DOMAIN is set');
  }
  
  // Check superadmin configuration
  if (!process.env.SUPERADMIN_EMAIL || !process.env.SUPERADMIN_PASSWORD) {
    issues.push('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD should be configured');
  }
  
  return issues;
};

/**
 * Get environment debug information
 */
export const getEnvironmentDebug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for full access - only SUPERADMIN can see full values
    const showFull = req.query.full === 'true' && req.user?.role === 'SUPERADMIN';
    
    // Get all environment variables
    const envVars = getEnvironmentVariables(showFull);
    const totalVars = Object.keys(envVars).length;
    const setVars = Object.values(envVars).filter(value => value && value !== '[NOT SET]').length;
    const missingVars = totalVars - setVars;
    
    // Get configuration issues
    const issues = getConfigurationIssues();
    
    // Determine overall config status
    let configStatus = '✓ All configurations look good';
    if (issues.length > 0) {
      configStatus = issues.length > 5 ? '✗ Major configuration issues found' : '⚠ Some configuration issues found';
    }
    
    const response: EnvDebugResponse = {
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      summary: {
        totalVariables: totalVars,
        setVariables: setVars,
        missingVariables: missingVars,
        configStatus
      },
      environmentVariables: envVars,
      processedConfig: getProcessedConfig(showFull),
      issues
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(ApiError.internal('Failed to retrieve environment debug information'));
  }
};
