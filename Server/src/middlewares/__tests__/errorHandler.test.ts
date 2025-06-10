import { Request, Response, NextFunction } from 'express'
import { errorHandler, ApiError } from '../errorHandler'

// Mock logger
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}))

// Mock sentry
jest.mock('../../config/sentry', () => ({
  captureException: jest.fn(),
}))

// Mock config
jest.mock('../../config/config', () => ({
  env: 'test'
}))

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/test',
      method: 'GET',
      ip: '127.0.0.1'
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()

    jest.clearAllMocks()
  })

  describe('ApiError handling', () => {
    it('should handle ApiError with custom status and message', () => {
      const apiError = new ApiError(400, 'Custom error message')

      errorHandler(
        apiError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Custom error message',
          errors: {}
        }
      })
    })

    it('should handle ApiError.badRequest', () => {
      const badRequestError = ApiError.badRequest('Invalid input')

      errorHandler(
        badRequestError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid input',
          errors: {}
        }
      })
    })

    it('should handle ApiError.unauthorized', () => {
      const unauthorizedError = ApiError.unauthorized('Access denied')

      errorHandler(
        unauthorizedError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Access denied',
          errors: {}
        }
      })
    })

    it('should handle ApiError.forbidden', () => {
      const forbiddenError = ApiError.forbidden('Insufficient permissions')

      errorHandler(
        forbiddenError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Insufficient permissions',
          errors: {}
        }
      })
    })

    it('should handle ApiError.notFound', () => {
      const notFoundError = ApiError.notFound('Resource not found')

      errorHandler(
        notFoundError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Resource not found',
          errors: {}
        }
      })
    })

    it('should handle ApiError.internal', () => {
      const internalError = ApiError.internal('Internal server error')

      errorHandler(
        internalError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          errors: {}
        }
      })
    })
  })

  describe('Generic Error handling', () => {
    it('should handle generic Error with 500 status', () => {
      const genericError = new Error('Something went wrong')

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Something went wrong',
          errors: {}
        }
      })
    })
  })

  describe('Development vs Production', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development'
      const error = new Error('Test error')
      error.stack = 'Error stack trace'

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          errors: {},
          stack: 'Error stack trace'
        }
      })
    })

    it('should not include stack trace in production', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Test error')
      error.stack = 'Error stack trace'

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          errors: {}
        }
      })
    })
  })

  describe('ApiError static methods', () => {
    it('should create badRequest error correctly', () => {
      const error = ApiError.badRequest('Bad request')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Bad request')
      expect(error instanceof ApiError).toBe(true)
    })

    it('should create unauthorized error correctly', () => {
      const error = ApiError.unauthorized('Unauthorized')
      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('Unauthorized')
      expect(error instanceof ApiError).toBe(true)
    })

    it('should create forbidden error correctly', () => {
      const error = ApiError.forbidden('Forbidden')
      expect(error.statusCode).toBe(403)
      expect(error.message).toBe('Forbidden')
      expect(error instanceof ApiError).toBe(true)
    })

    it('should create notFound error correctly', () => {
      const error = ApiError.notFound('Not found')
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('Not found')
      expect(error instanceof ApiError).toBe(true)
    })

    it('should create internal error correctly', () => {
      const error = ApiError.internal('Internal error')
      expect(error.statusCode).toBe(500)
      expect(error.message).toBe('Internal error')
      expect(error instanceof ApiError).toBe(true)
    })
  })
})
