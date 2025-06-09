import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../errorHandling'

describe('Error Handling Utils', () => {
  describe('getErrorMessage', () => {
    it('should handle basic error message', () => {
      const error = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      }

      const result = getErrorMessage(error)

      expect(result.message).toBe('Invalid credentials')
      expect(result.type).toBe('error')
    })

    it('should handle permission errors', () => {
      const error = {
        response: {
          data: {
            message: 'You do not have permission to perform this action'
          }
        }
      }

      const result = getErrorMessage(error)

      expect(result.message).toBe("You don't have permission to perform this action. Contact your administrator.")
      expect(result.type).toBe('error')
    })

    it('should handle role assignment warnings', () => {
      const error = {
        response: {
          data: {
            message: 'User already has this role'
          }
        }
      }

      const result = getErrorMessage(error)

      expect(result.message).toBe('This user already has the selected role.')
      expect(result.type).toBe('warning')
    })

    it('should use default message when no error message found', () => {
      const error = {}

      const result = getErrorMessage(error)

      expect(result.message).toBe('An error occurred')
      expect(result.type).toBe('error')
    })

    it('should use custom default message', () => {
      const error = {}
      const customDefault = 'Custom error message'

      const result = getErrorMessage(error, customDefault)

      expect(result.message).toBe(customDefault)
      expect(result.type).toBe('error')
    })
  })
})
