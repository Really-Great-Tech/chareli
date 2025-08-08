import 'reflect-metadata'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '5432'
process.env.DB_USERNAME = 'test'
process.env.DB_PASSWORD = 'test'
process.env.DB_NAME = 'test_db'
process.env.REDIS_HOST = 'localhost'
process.env.REDIS_PORT = '6379'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock external services
jest.mock('../services/email.service', () => ({
  emailService: {
    sendEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  },
}))

jest.mock('../services/otp.service', () => ({
  otpService: {
    generateOtp: jest.fn().mockResolvedValue('123456'),
    sendOtp: jest.fn().mockResolvedValue(true),
    verifyOtp: jest.fn().mockResolvedValue(true),
  },
}))

// Mock AWS services
jest.mock('../services/s3.service', () => ({
  s3Service: {
    uploadFile: jest.fn().mockResolvedValue({ key: 'test-key', url: 'test-url' }),
    deleteFile: jest.fn().mockResolvedValue(true),
  },
}))

// Mock Redis client
jest.mock('../config/redisClient', () => ({
  __esModule: true,
  default: {
    ping: jest.fn().mockResolvedValue('PONG'),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),
    flushall: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
  },
}))
