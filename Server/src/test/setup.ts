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

// Mock Redis service to prevent actual connections during tests
jest.mock('../services/redis.service', () => ({
  redisService: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    getClient: jest.fn().mockReturnValue({
      ping: jest.fn().mockResolvedValue('PONG'),
      disconnect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
    }),
    ping: jest.fn().mockResolvedValue('PONG'),
    isConnected: jest.fn().mockResolvedValue(true),
  },
}))

// Mock Queue service to prevent actual queue connections during tests
jest.mock('../services/queue.service', () => ({
  queueService: {
    addGameZipProcessingJob: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
    createWorker: jest.fn().mockReturnValue({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    }),
    getJobStatus: jest.fn().mockResolvedValue({ status: 'completed' }),
    closeAllQueues: jest.fn().mockResolvedValue(undefined),
    getQueue: jest.fn().mockReturnValue(undefined),
    getWorker: jest.fn().mockReturnValue(undefined),
  },
  JobType: {
    GAME_ZIP_PROCESSING: 'game-zip-processing',
  },
}))

// Global test cleanup
afterAll(async () => {
  // Close any remaining database connections
  try {
    const { AppDataSource } = await import('../config/database')
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  } catch (error) {
    // Database might not be initialized, ignore
  }

  // Close any remaining Redis connections
  try {
    const { redisService } = await import('../services/redis.service')
    await redisService.disconnect()
  } catch (error) {
    // Redis might not be connected, ignore
  }

  // Close any remaining queue connections
  try {
    const { queueService } = await import('../services/queue.service')
    await queueService.closeAllQueues()
  } catch (error) {
    // Queues might not be initialized, ignore
  }

  // Force close any remaining handles and allow time for cleanup
  await new Promise(resolve => setTimeout(resolve, 500))
})

// Add cleanup after each test to handle supertest connections
afterEach(async () => {
  // Small delay to allow supertest connections to close
  await new Promise(resolve => setTimeout(resolve, 10))
})
