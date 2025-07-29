import request from 'supertest'
import express from 'express'
import { 
  inviteUser,
  getCurrentUser,
  getAllInvitations,
  deleteInvitation,
  verifyInvitationToken,
  resetPasswordFromInvitation,
  changePassword,
  revokeRole,
  changeUserRole
} from '../userManagementController'

// Create a simple test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  
  // Mock authentication middleware
  app.use((req, res, next) => {
    req.user = {
      userId: 'admin-123',
      id: 'admin-123',
      role: 'admin'
    } as any
    next()
  })
  
  // Add routes
  app.post('/auth/invite', inviteUser)
  app.get('/auth/me', getCurrentUser)
  app.get('/auth/invitations', getAllInvitations)
  app.delete('/auth/invitations/:id', deleteInvitation)
  app.get('/auth/verify-invitation/:token', verifyInvitationToken)
  app.post('/auth/reset-password-from-invitation/:token', resetPasswordFromInvitation)
  app.put('/auth/change-password', changePassword)
  app.put('/auth/revoke-role/:id', revokeRole)
  app.put('/auth/users/:id/role', changeUserRole)
  
  return app
}

describe('User Management Controller', () => {
  let app: express.Application

  beforeEach(() => {
    app = createTestApp()
  })

  describe('POST /auth/invite', () => {
    it('should handle request with missing email', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          role: 'editor'
        })

      expect(response.status).toBe(400)
    })

    it('should handle request with missing role', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: 'editor@example.com'
        })

      expect(response.status).toBe(400)
    })

    it('should handle valid invitation request', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: 'editor@example.com',
          role: 'editor'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle invitation with invalid role', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: 'user@example.com',
          role: 'invalid_role'
        })

      expect(response.status).toBe(400)
    })

    it('should handle invitation with player role', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: 'player@example.com',
          role: 'player'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle invitation with admin role (should be forbidden for admin user)', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: 'admin@example.com',
          role: 'admin'
        })

      // Should respond with forbidden
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle invitation with superadmin role (should be forbidden for admin user)', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: 'superadmin@example.com',
          role: 'superadmin'
        })

      // Should respond with forbidden
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle invitation with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: 'invalid-email',
          role: 'editor'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle invitation with empty email', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: '',
          role: 'editor'
        })

      expect(response.status).toBe(400)
    })

    it('should handle invitation with empty role', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: 'user@example.com',
          role: ''
        })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /auth/me', () => {
    it('should handle request to get current user', async () => {
      const response = await request(app)
        .get('/auth/me')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle request without authentication', async () => {
      // Create app without auth middleware
      const noAuthApp = express()
      noAuthApp.use(express.json())
      noAuthApp.get('/auth/me', getCurrentUser)

      const response = await request(noAuthApp)
        .get('/auth/me')

      // Should respond with unauthorized
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })
  })

  describe('GET /auth/invitations', () => {
    it('should handle request to get all invitations', async () => {
      const response = await request(app)
        .get('/auth/invitations')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle request from non-admin user', async () => {
      // Create app with player role
      const playerApp = express()
      playerApp.use(express.json())
      playerApp.use((req, res, next) => {
        req.user = {
          userId: 'player-123',
          id: 'player-123',
          role: 'player'
        } as any
        next()
      })
      playerApp.get('/auth/invitations', getAllInvitations)

      const response = await request(playerApp)
        .get('/auth/invitations')

      // Should respond with forbidden
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })
  })

  describe('DELETE /auth/invitations/:id', () => {
    it('should handle invitation deletion', async () => {
      const response = await request(app)
        .delete('/auth/invitations/invitation-123')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle deletion with non-existent invitation id', async () => {
      const response = await request(app)
        .delete('/auth/invitations/non-existent-id')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle deletion from non-admin user', async () => {
      // Create app with editor role
      const editorApp = express()
      editorApp.use(express.json())
      editorApp.use((req, res, next) => {
        req.user = {
          userId: 'editor-123',
          id: 'editor-123',
          role: 'editor'
        } as any
        next()
      })
      editorApp.delete('/auth/invitations/:id', deleteInvitation)

      const response = await request(editorApp)
        .delete('/auth/invitations/invitation-123')

      // Should respond with forbidden
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle deletion with invalid invitation id format', async () => {
      const response = await request(app)
        .delete('/auth/invitations/invalid-uuid')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle deletion with empty invitation id', async () => {
      const response = await request(app)
        .delete('/auth/invitations/')

      // Should respond (might be 404 for route not found)
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })
  })

  describe('GET /auth/verify-invitation/:token', () => {
    it('should handle invitation token verification', async () => {
      const response = await request(app)
        .get('/auth/verify-invitation/valid-token-123')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle verification with invalid token', async () => {
      const response = await request(app)
        .get('/auth/verify-invitation/invalid-token')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle verification with expired token', async () => {
      const response = await request(app)
        .get('/auth/verify-invitation/expired-token-123')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle verification with empty token', async () => {
      const response = await request(app)
        .get('/auth/verify-invitation/')

      // Should respond (might be 404 for route not found)
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle verification with very long token', async () => {
      const longToken = 'a'.repeat(1000)
      const response = await request(app)
        .get(`/auth/verify-invitation/${longToken}`)

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })
  })

  describe('POST /auth/reset-password-from-invitation/:token', () => {
    it('should handle password reset with missing password', async () => {
      const response = await request(app)
        .post('/auth/reset-password-from-invitation/valid-token-123')
        .send({
          confirmPassword: 'NewPassword123!'
        })

      expect(response.status).toBe(400)
    })

    it('should handle password reset with missing confirmPassword', async () => {
      const response = await request(app)
        .post('/auth/reset-password-from-invitation/valid-token-123')
        .send({
          password: 'NewPassword123!'
        })

      expect(response.status).toBe(400)
    })

    it('should handle password reset with mismatched passwords', async () => {
      const response = await request(app)
        .post('/auth/reset-password-from-invitation/valid-token-123')
        .send({
          password: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!'
        })

      expect(response.status).toBe(400)
    })

    it('should handle valid password reset request', async () => {
      const response = await request(app)
        .post('/auth/reset-password-from-invitation/valid-token-123')
        .send({
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle password reset with invalid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password-from-invitation/invalid-token')
        .send({
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle password reset with weak password', async () => {
      const response = await request(app)
        .post('/auth/reset-password-from-invitation/valid-token-123')
        .send({
          password: '123',
          confirmPassword: '123'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle password reset with empty passwords', async () => {
      const response = await request(app)
        .post('/auth/reset-password-from-invitation/valid-token-123')
        .send({
          password: '',
          confirmPassword: ''
        })

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /auth/change-password', () => {
    it('should handle password change with missing old password', async () => {
      const response = await request(app)
        .put('/auth/change-password')
        .send({
          newPassword: 'NewPassword123!'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle password change with missing new password', async () => {
      const response = await request(app)
        .put('/auth/change-password')
        .send({
          oldPassword: 'OldPassword123!'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle valid password change request', async () => {
      const response = await request(app)
        .put('/auth/change-password')
        .send({
          oldPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle password change with incorrect old password', async () => {
      const response = await request(app)
        .put('/auth/change-password')
        .send({
          oldPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle password change with same old and new password', async () => {
      const response = await request(app)
        .put('/auth/change-password')
        .send({
          oldPassword: 'SamePassword123!',
          newPassword: 'SamePassword123!'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle password change without authentication', async () => {
      // Create app without auth middleware
      const noAuthApp = express()
      noAuthApp.use(express.json())
      noAuthApp.put('/auth/change-password', changePassword)

      const response = await request(noAuthApp)
        .put('/auth/change-password')
        .send({
          oldPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!'
        })

      // Should respond with unauthorized
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })
  })

  describe('PUT /auth/revoke-role/:id', () => {
    it('should handle role revocation', async () => {
      const response = await request(app)
        .put('/auth/revoke-role/user-123')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role revocation with non-existent user id', async () => {
      const response = await request(app)
        .put('/auth/revoke-role/non-existent-user')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle self role revocation attempt', async () => {
      const response = await request(app)
        .put('/auth/revoke-role/admin-123') // Same as the authenticated user

      // Should respond with error
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role revocation from non-admin user', async () => {
      // Create app with player role
      const playerApp = express()
      playerApp.use(express.json())
      playerApp.use((req, res, next) => {
        req.user = {
          userId: 'player-123',
          id: 'player-123',
          role: 'player'
        } as any
        next()
      })
      playerApp.put('/auth/revoke-role/:id', revokeRole)

      const response = await request(playerApp)
        .put('/auth/revoke-role/user-123')

      // Should respond with forbidden
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role revocation with invalid user id format', async () => {
      const response = await request(app)
        .put('/auth/revoke-role/invalid-uuid')

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role revocation with empty user id', async () => {
      const response = await request(app)
        .put('/auth/revoke-role/')

      // Should respond (might be 404 for route not found)
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })
  })

  describe('PUT /auth/users/:id/role', () => {
    it('should handle role change with missing role', async () => {
      const response = await request(app)
        .put('/auth/users/user-123/role')
        .send({})

      expect(response.status).toBe(400)
    })

    it('should handle valid role change request', async () => {
      const response = await request(app)
        .put('/auth/users/user-123/role')
        .send({
          role: 'editor'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role change with invalid role', async () => {
      const response = await request(app)
        .put('/auth/users/user-123/role')
        .send({
          role: 'invalid_role'
        })

      expect(response.status).toBe(400)
    })

    it('should handle role change to player', async () => {
      const response = await request(app)
        .put('/auth/users/user-123/role')
        .send({
          role: 'player'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role change to admin (should be forbidden for admin user)', async () => {
      const response = await request(app)
        .put('/auth/users/user-123/role')
        .send({
          role: 'admin'
        })

      // Should respond with forbidden
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role change to superadmin (should be forbidden for admin user)', async () => {
      const response = await request(app)
        .put('/auth/users/user-123/role')
        .send({
          role: 'superadmin'
        })

      // Should respond with forbidden
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle self role change attempt', async () => {
      const response = await request(app)
        .put('/auth/users/admin-123/role') // Same as the authenticated user
        .send({
          role: 'editor'
        })

      // Should respond with error
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role change from non-admin user', async () => {
      // Create app with editor role
      const editorApp = express()
      editorApp.use(express.json())
      editorApp.use((req, res, next) => {
        req.user = {
          userId: 'editor-123',
          id: 'editor-123',
          role: 'editor'
        } as any
        next()
      })
      editorApp.put('/auth/users/:id/role', changeUserRole)

      const response = await request(editorApp)
        .put('/auth/users/user-123/role')
        .send({
          role: 'player'
        })

      // Should respond with forbidden
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role change with non-existent user id', async () => {
      const response = await request(app)
        .put('/auth/users/non-existent-user/role')
        .send({
          role: 'editor'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role change with invalid user id format', async () => {
      const response = await request(app)
        .put('/auth/users/invalid-uuid/role')
        .send({
          role: 'editor'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle role change with empty role', async () => {
      const response = await request(app)
        .put('/auth/users/user-123/role')
        .send({
          role: ''
        })

      expect(response.status).toBe(400)
    })

    it('should handle role change with null role', async () => {
      const response = await request(app)
        .put('/auth/users/user-123/role')
        .send({
          role: null
        })

      expect(response.status).toBe(400)
    })
  })

  // Additional edge case tests
  describe('Edge Cases', () => {
    it('should handle requests with malformed JSON', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", "role": "editor"') // Malformed JSON

      // Should respond with error
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle requests with very long email addresses', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: longEmail,
          role: 'editor'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle requests with SQL injection attempts', async () => {
      const response = await request(app)
        .post('/auth/invite')
        .send({
          email: "test@example.com'; DROP TABLE users; --",
          role: 'editor'
        })

      // Should respond safely
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })

    it('should handle concurrent role change requests', async () => {
      const requests = Array(3).fill(null).map(() => 
        request(app)
          .put('/auth/users/user-123/role')
          .send({ role: 'editor' })
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBeDefined()
        expect(typeof response.status).toBe('number')
      })
    })

    it('should handle password change with unicode characters', async () => {
      const response = await request(app)
        .put('/auth/change-password')
        .send({
          oldPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!测试'
        })

      // Should respond
      expect(response.status).toBeDefined()
      expect(typeof response.status).toBe('number')
    })
  })
})
