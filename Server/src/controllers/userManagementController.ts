import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ApiError } from '../middlewares/errorHandler';
import { Role, RoleType } from '../entities/Role';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Invitation } from '../entities/Invitation';
import { emailService } from '../services/email.service';
import * as bcrypt from 'bcrypt';

const userRepository = AppDataSource.getRepository(User);
const invitationRepository = AppDataSource.getRepository(Invitation);
const roleRepository = AppDataSource.getRepository(Role);

/**
 * @swagger
 * /auth/invite:
 *   post:
 *     summary: Invite user
 *     description: Invite a new user with a specific role. Only admin and superadmin can invite users.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *           example:
 *             email: "editor@example.com"
 *             role: "editor"
 *     responses:
 *       201:
 *         description: Invitation sent
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const inviteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, role } = req.body;
    const invitedById = req.user?.userId;

    // Validate required fields
    if (!email || !role || !invitedById) {
      return next(ApiError.badRequest('All fields are required'));
    }

    // Validate role
    if (!Object.values(RoleType).includes(role as RoleType)) {
      return next(ApiError.badRequest('Invalid role'));
    }

    // Only admin and superadmin can invite users
    if (req.user?.role !== RoleType.ADMIN && req.user?.role !== RoleType.SUPERADMIN) {
      return next(ApiError.forbidden('Only admin and superadmin can invite users'));
    }

    // Superadmin can invite any role, admin can only invite editor and player
    if (
      req.user.role === RoleType.ADMIN &&
      (role === RoleType.SUPERADMIN || role === RoleType.ADMIN)
    ) {
      return next(ApiError.forbidden('Admin can only invite editor and player roles'));
    }

    // Create invitation
    const invitation = await authService.createInvitation(
      email,
      role as RoleType,
      invitedById
    );

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        id: invitation.id,
        email: invitation.email,
        role: role,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    next(error instanceof Error ? ApiError.badRequest(error.message) : error);
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the current authenticated user's information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user) {
      return next(ApiError.notFound('User not found'));
    }

    // Don't return sensitive information
    const { password, ...userWithoutSensitiveInfo } = user;

    res.status(200).json({
      success: true,
      data: userWithoutSensitiveInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/invitations:
 *   get:
 *     summary: Get all invitations
 *     description: Get all invitations. Only admin and superadmin can access this endpoint.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitations retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const getAllInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only admin and superadmin can view all invitations
    if (req.user?.role !== RoleType.ADMIN && req.user?.role !== RoleType.SUPERADMIN) {
      return next(ApiError.forbidden('Only admin and superadmin can view all invitations'));
    }

    const invitations = await invitationRepository.find({
      relations: ['role', 'invitedBy']
    });

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/invitations/{id}:
 *   delete:
 *     summary: Delete invitation
 *     description: Delete an invitation. Only admin and superadmin can access this endpoint.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Invitation not found
 *       500:
 *         description: Internal server error
 */
export const deleteInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin and superadmin can delete invitations
    if (req.user?.role !== RoleType.ADMIN && req.user?.role !== RoleType.SUPERADMIN) {
      return next(ApiError.forbidden('Only admin and superadmin can delete invitations'));
    }

    const invitation = await invitationRepository.findOne({
      where: { id },
      relations: ['role']
    });

    if (!invitation) {
      return next(ApiError.notFound('Invitation not found'));
    }

    // Admin can only delete invitations for editor and player roles
    if (
      req.user.role === RoleType.ADMIN &&
      (invitation.role.name === RoleType.SUPERADMIN || invitation.role.name === RoleType.ADMIN)
    ) {
      return next(ApiError.forbidden('Admin can only delete invitations for editor and player roles'));
    }

    await invitationRepository.remove(invitation);

    res.status(200).json({
      success: true,
      message: 'Invitation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/verify-invitation/{token}:
 *   get:
 *     summary: Verify invitation token
 *     description: Verify if an invitation token is valid and check if the user already exists
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
export const verifyInvitationToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;

    // Find the invitation
    const invitation = await invitationRepository.findOne({
      where: { token },
      relations: ['role']
    });

    if (!invitation) {
      return next(ApiError.badRequest('Invalid invitation token'));
    }

    if (invitation.isAccepted) {
      return next(ApiError.badRequest('Invitation has already been accepted'));
    }

    if (new Date() > invitation.expiresAt) {
      return next(ApiError.badRequest('Invitation has expired'));
    }

    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: invitation.email }
    });

    if (existingUser) {
      // User already exists, they can reset password directly
      res.status(200).json({
        success: true,
        message: 'User with this email already exists. You can reset your password directly.',
        data: {
          email: invitation.email,
          userExists: true,
          role: invitation.role.name
        }
      });
    } else {
      // User doesn't exist, suggest registration
      res.status(200).json({
        success: true,
        message: 'Valid invitation token. Please proceed to registration.',
        data: {
          email: invitation.email,
          userExists: false,
          role: invitation.role.name
        }
      });
    }
  } catch (error) {
    next(error instanceof Error ? ApiError.badRequest(error.message) : error);
  }
};

/**
 * @swagger
 * /auth/reset-password-from-invitation/{token}:
 *   post:
 *     summary: Reset password from invitation
 *     description: Reset password using an invitation token for existing users
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - confirmPassword
 *           example:
 *             password: "NewStrongPassword123!"
 *             confirmPassword: "NewStrongPassword123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export const resetPasswordFromInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validate required fields
    if (!password || !confirmPassword) {
      return next(ApiError.badRequest('All fields are required'));
    }

    // Validate password match
    if (password !== confirmPassword) {
      return next(ApiError.badRequest('Passwords do not match'));
    }

    // Find the invitation
    const invitation = await invitationRepository.findOne({
      where: { token },
      relations: ['role']
    });

    if (!invitation) {
      return next(ApiError.badRequest('Invalid invitation token'));
    }

    if (invitation.isAccepted) {
      return next(ApiError.badRequest('Invitation has already been accepted'));
    }

    if (new Date() > invitation.expiresAt) {
      return next(ApiError.badRequest('Invitation has expired'));
    }

    // Find the user
    const user = await userRepository.findOne({
      where: { email: invitation.email }
    });

    if (!user) {
      return next(ApiError.badRequest('User not found'));
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user's password
    user.password = hashedPassword;
    await userRepository.save(user);

    // Mark invitation as accepted
    invitation.isAccepted = true;
    await invitationRepository.save(invitation);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    next(error instanceof Error ? ApiError.badRequest(error.message) : error);
  }
};

/**
 * @swagger
 * /auth/revoke-role/{id}:
 *   put:
 *     summary: Revoke user role
 *     description: Revoke a user's role and set them to player role. Superadmins can revoke any role, admins can only revoke editor roles.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user whose role will be revoked
 *     responses:
 *       200:
 *         description: Role successfully revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Role successfully revoked. User is now a player.
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User does not have permission to revoke roles
 *       404:
 *         description: Not found - User not found
 *       500:
 *         description: Internal server error
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password']
    });

    if (!user) {
      return next(ApiError.notFound('User not found'));
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return next(ApiError.badRequest('Current password is incorrect'));
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await userRepository.save(user);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const revokeRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.userId;

    // Find the user whose role will be revoked
    const user = await userRepository.findOne({
      where: { id },
      relations: ['role']
    });

    if (!user) {
      return next(ApiError.notFound(`User with id ${id} not found`));
    }

    // Prevent revoking your own role
    if (currentUserId === id) {
      return next(ApiError.badRequest('You cannot revoke your own role'));
    }

    // Check permission based on role hierarchy
    if (currentUserRole === RoleType.ADMIN) {
      if (user.role.name !== RoleType.EDITOR) {
        return next(ApiError.forbidden('Admin can only revoke editor roles'));
      }
    } else if (currentUserRole !== RoleType.SUPERADMIN) {
      return next(ApiError.forbidden('You do not have permission to revoke roles'));
    }
    
    const playerRole = await roleRepository.findOne({
      where: { name: RoleType.PLAYER }
    });

    if (!playerRole) {
      return next(ApiError.internal('Player role not found'));
    }

    const oldRoleName = user.role.name;
    user.role = playerRole;
    user.roleId = playerRole.id;
    await userRepository.save(user);

    // Send email notification
    await emailService.sendRoleRevokedEmail(user.email, oldRoleName);
    const { password: _, ...userWithoutSensitiveInfo } = user;

    res.status(200).json({
      success: true,
      message: `Role successfully revoked. User is now a player.`,
      data: userWithoutSensitiveInfo,
    });
  } catch (error) {
    next(error);
  }
};
