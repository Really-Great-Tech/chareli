import { describe, it, expect } from 'vitest'
import * as Yup from 'yup'
import { passwordSchema, confirmPasswordSchema, PASSWORD_REQUIREMENTS } from '../password'

describe('Password Validation', () => {
  describe('passwordSchema', () => {
    it('should accept valid password', async () => {
      const validPassword = 'Password123!'
      
      const result = await passwordSchema.isValid(validPassword)
      
      expect(result).toBe(true)
    })

    it('should reject password shorter than 6 characters', async () => {
      const shortPassword = 'Pa1'
      
      try {
        await passwordSchema.validate(shortPassword)
        expect.fail('Should have thrown validation error')
      } catch (error: any) {
        expect(error.message).toBe(PASSWORD_REQUIREMENTS.MESSAGES.MIN_LENGTH)
      }
    })

    it('should reject password without letters and numbers', async () => {
      const noLettersOrNumbers = '!@#$%^'
      
      try {
        await passwordSchema.validate(noLettersOrNumbers)
        expect.fail('Should have thrown validation error')
      } catch (error: any) {
        expect(error.message).toBe(PASSWORD_REQUIREMENTS.MESSAGES.WEAK)
      }
    })

    it('should reject password with only letters', async () => {
      const onlyLetters = 'Password'
      
      try {
        await passwordSchema.validate(onlyLetters)
        expect.fail('Should have thrown validation error')
      } catch (error: any) {
        expect(error.message).toBe(PASSWORD_REQUIREMENTS.MESSAGES.WEAK)
      }
    })

    it('should reject password with only numbers', async () => {
      const onlyNumbers = '123456'
      
      try {
        await passwordSchema.validate(onlyNumbers)
        expect.fail('Should have thrown validation error')
      } catch (error: any) {
        expect(error.message).toBe(PASSWORD_REQUIREMENTS.MESSAGES.WEAK)
      }
    })

    it('should accept password with letters and numbers', async () => {
      const validPassword = 'Password123'
      
      const result = await passwordSchema.isValid(validPassword)
      
      expect(result).toBe(true)
    })

    it('should reject empty password', async () => {
      const emptyPassword = ''
      
      try {
        await passwordSchema.validate(emptyPassword)
        expect.fail('Should have thrown validation error')
      } catch (error: any) {
        expect(error.message).toBe(PASSWORD_REQUIREMENTS.MESSAGES.MIN_LENGTH)
      }
    })

    it('should accept password with various special characters', async () => {
      const passwords = [
        'Password123!',
        'Password123@',
        'Password123#',
        'Password123$',
        'Password123%',
        'Password123^',
        'Password123&',
        'Password123*'
      ]
      
      for (const password of passwords) {
        const result = await passwordSchema.isValid(password)
        expect(result).toBe(true)
      }
    })

    it('should accept minimum length password with all requirements', async () => {
      const minValidPassword = 'abc123'
      
      const result = await passwordSchema.isValid(minValidPassword)
      
      expect(result).toBe(true)
    })
  })

  describe('confirmPasswordSchema', () => {
    it('should accept matching passwords', async () => {
      const formData = { password: 'Password123!', confirmPassword: 'Password123!' }
      
      // Create a schema for the entire form to properly validate the reference
      const formSchema = Yup.object({
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema
      })
      
      const result = await formSchema.isValid(formData)
      
      expect(result).toBe(true)
    })

    it('should reject non-matching passwords', async () => {
      const formData = { password: 'Password123!', confirmPassword: 'DifferentPass123!' }
      
      try {
        await confirmPasswordSchema.validate(formData.confirmPassword, { context: formData })
        expect.fail('Should have thrown validation error')
      } catch (error: any) {
        expect(error.message).toBe(PASSWORD_REQUIREMENTS.MESSAGES.MATCH)
      }
    })

    it('should reject empty confirm password', async () => {
      const formData = { password: 'Password123!', confirmPassword: '' }
      
      try {
        await confirmPasswordSchema.validate(formData.confirmPassword, { context: formData })
        expect.fail('Should have thrown validation error')
      } catch (error: any) {
        expect(error.message).toBe(PASSWORD_REQUIREMENTS.MESSAGES.MATCH)
      }
    })
  })

  describe('PASSWORD_REQUIREMENTS constants', () => {
    it('should have correct minimum length', () => {
      expect(PASSWORD_REQUIREMENTS.MIN_LENGTH).toBe(6)
    })

    it('should have all required error messages', () => {
      expect(PASSWORD_REQUIREMENTS.MESSAGES.MIN_LENGTH).toBeDefined()
      expect(PASSWORD_REQUIREMENTS.MESSAGES.REQUIRED).toBeDefined()
      expect(PASSWORD_REQUIREMENTS.MESSAGES.MATCH).toBeDefined()
      expect(PASSWORD_REQUIREMENTS.MESSAGES.WEAK).toBeDefined()
    })
  })
})
