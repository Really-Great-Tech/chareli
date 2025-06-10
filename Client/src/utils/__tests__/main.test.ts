import { describe, it, expect } from 'vitest'
import { isValidRole } from '../main'

describe('Utils - Main', () => {
  describe('isValidRole', () => {
    it('should return true for admin role', () => {
      expect(isValidRole('admin')).toBe(true)
    })

    it('should return true for superadmin role', () => {
      expect(isValidRole('superadmin')).toBe(true)
    })

    it('should return false for player role', () => {
      expect(isValidRole('player')).toBe(false)
    })

    it('should return false for editor role', () => {
      expect(isValidRole('editor')).toBe(false)
    })

    it('should return false for invalid role', () => {
      expect(isValidRole('invalid')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidRole('')).toBe(false)
    })

    it('should return false for null', () => {
      expect(isValidRole(null as any)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidRole(undefined as any)).toBe(false)
    })
  })
})
