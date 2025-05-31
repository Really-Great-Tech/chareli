import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Role, RoleType } from '../entities/Role';
import { Analytics } from '../entities/Analytics';
import { ApiError } from '../middlewares/errorHandler';
import * as bcrypt from 'bcrypt';
import { authService } from '../services/auth.service';
import { OtpType } from '../entities/Otp';
import { Not, IsNull } from 'typeorm';
import { s3Service } from '../services/s3.service';
import { getCountryFromIP } from './signupAnalyticsController';

const userRepository = AppDataSource.getRepository(User);
const roleRepository = AppDataSource.getRepository(Role);
const analyticsRepository = AppDataSource.getRepository(Analytics);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users. Accessible by admins.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userRepository.find({
      relations: ['role'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        role: {
          id: true,
          name: true,
          description: true
        }
      }
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/me/stats:
 *   get:
 *     summary: Get current user's game statistics
 *     description: Retrieve game play statistics for the currently logged in user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User stats retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getCurrentUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // If user is not authenticated, send default stats
    if (!req.user || !req.user.userId) {
      res.status(200).json({
        success: true,
        data: {
          totalSeconds: 0,
          totalPlays: 0,
          gamesPlayed: []
        }
      });
      return;
    }

    const userId = req.user.userId;

    // Get total minutes played
    const totalTimeResult = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('SUM(analytics.duration)', 'totalDuration')
      .where('analytics.userId = :userId', { userId })
      .getRawOne();

    // Get total play count (only count entries with gameId)
    const totalPlaysResult = await analyticsRepository
      .count({
        where: {
          userId,
          gameId: Not(IsNull())
        }
      });

    // Get games played with details
    const gamesPlayed = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.gameId', 'gameId')
      .addSelect('game.title', 'title')
      .addSelect('thumbnailFile.s3Key', 'thumbnailKey')
      .addSelect('SUM(analytics.duration)', 'totalDuration')
      .addSelect('MAX(analytics.startTime)', 'lastPlayed')
      .leftJoin('analytics.game', 'game')
      .leftJoin('game.thumbnailFile', 'thumbnailFile')
      .where('analytics.userId = :userId AND analytics.gameId IS NOT NULL', { userId })
      .groupBy('analytics.gameId')
      .addGroupBy('game.title')
      .addGroupBy('thumbnailFile.s3Key')
      .orderBy('"lastPlayed"', 'DESC')
      .getRawMany();

    // Format the response
    const formattedGames = await Promise.all(gamesPlayed.map(async game => ({
      gameId: game.gameId,
      title: game.title,
      thumbnailUrl: game.thumbnailKey ? `${s3Service.getBaseUrl()}/${game.thumbnailKey}` : null,
      totalSeconds: game.totalDuration || 0,
      lastPlayed: game.lastPlayed
    })));

    // Send total duration in seconds
    const totalSeconds = totalTimeResult?.totalDuration || 0;

    res.status(200).json({
      success: true,
      data: {
        totalSeconds,
        totalPlays: totalPlaysResult,
        gamesPlayed: formattedGames
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a single user by their ID. Users can view their own profile, admins can view any profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await userRepository.findOne({
      where: { id },
      relations: ['role'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        role: {
          id: true,
          name: true,
          description: true
        }
      }
    });

    if (!user) {
      return next(ApiError.notFound(`User with id ${id} not found`));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *           example:
 *             firstName: "Alex"
 *             lastName: "Johnson"
 *             email: "alex.johnson@example.com"
 *             password: "SecurePass789!"
 *             phoneNumber: "+1555123456"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phoneNumber, isAdult, hasAcceptedTerms } = req.body;

    // Get IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded || req.socket.remoteAddress || req.ip || '');

    // Get country from IP
    const country = await getCountryFromIP(ipAddress);

    // Check if user with email already exists (only if email is provided)
    if (email) {
      const existingUser = await userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        return next(ApiError.badRequest('An account with this email already exists'));
      }
    }

    // Get the role
    const role = await roleRepository.findOne({
      where: { name: RoleType.PLAYER }
    });

    if (!role) {
      return next(ApiError.badRequest('Invalid role'));
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = userRepository.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      role,
      roleId: role.id,
      isVerified: false,
      isActive: true,
      isAdult: isAdult || false,
      hasAcceptedTerms,
      country: country || undefined
    });

    await userRepository.save(user);

    // Create analytics entry for signup
    const signupAnalytics = new Analytics();
    signupAnalytics.userId = user.id;
    signupAnalytics.activityType = 'Signed up';
    await analyticsRepository.save(signupAnalytics);

    // Don't return sensitive information
    const { password: _, ...userWithoutSensitiveInfo } = user;

    // Determine OTP type based on provided contact info
    let otpType: OtpType | null = null;

    if (email && !phoneNumber) {
      otpType = OtpType.EMAIL;
    } else if (phoneNumber && !email) {
      otpType = OtpType.SMS;
    } else if (email && phoneNumber) {
      // If both are provided, check if otpType was specified in request
      otpType = req.body.otpType || null;
    }

    // Send OTP if applicable
    if (otpType) {
      await authService.sendOtp(user, otpType);
      
      res.status(201).json({
        success: true,
        message: `User created successfully. OTP sent to ${otpType === OtpType.EMAIL ? 'email' : 'phone'}.`,
        data: userWithoutSensitiveInfo,
      });
    } else if (email && phoneNumber) {
      // Both contact methods available but no otpType specified
      // Return success but indicate user needs to request OTP
      res.status(201).json({
        success: true,
        message: 'User created successfully. User has both email and phone. Please request OTP with preferred method.',
        data: {
          ...userWithoutSensitiveInfo,
          requiresOtpRequest: true
        }
      });
    } else {
      // No valid contact method for OTP
      res.status(201).json({
        success: true,
        message: 'User created successfully. No valid contact method for OTP.',
        data: userWithoutSensitiveInfo,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Update a user's information by their ID. Users can update their own profile, admins can update any profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           example:
 *             firstName: "Alexander"
 *             lastName: "Johnson"
 *             phoneNumber: "+1555123789"
 *             isActive: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, roleId, isActive, password } = req.body;

    const user = await userRepository.findOne({
      where: { id },
      relations: ['role']
    });

    if (!user) {
      return next(ApiError.notFound(`User with id ${id} not found`));
    }

    // If trying to update role, check permissions
    if (roleId && roleId !== user.roleId) {
      // Only admins can change roles
      if (req.user?.role !== RoleType.ADMIN && req.user?.role !== RoleType.SUPERADMIN) {
        return next(ApiError.forbidden('Only admins can change user roles'));
      }

      // Get the new role
      const newRole = await roleRepository.findOne({
        where: { id: roleId }
      });

      if (!newRole) {
        return next(ApiError.badRequest('Invalid role'));
      }

      // Admin can only assign editor and player roles
      if (
        req.user.role === RoleType.ADMIN &&
        (newRole.name === RoleType.SUPERADMIN || newRole.name === RoleType.ADMIN)
      ) {
        return next(ApiError.forbidden('Admin can only assign editor and player roles'));
      }

      user.role = newRole;
      user.roleId = roleId;
    }

    // If trying to update active status, check permissions
    if (isActive !== undefined && isActive !== user.isActive) {
      // Only admins can activate/deactivate users
      if (req.user?.role !== RoleType.ADMIN && req.user?.role !== RoleType.SUPERADMIN) {
        return next(ApiError.forbidden('Only admins can activate/deactivate users'));
      }

      // Admin cannot deactivate superadmin
      if (
        req.user.role === RoleType.ADMIN &&
        user.role.name === RoleType.SUPERADMIN &&
        !isActive
      ) {
        return next(ApiError.forbidden('Admin cannot deactivate superadmin'));
      }

      user.isActive = isActive;
    }

    // Update basic user properties
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email && email !== user.email) {
      // Check if email is already in use
      const existingUser = await userRepository.findOne({
        where: { email }
      });

      if (existingUser && existingUser.id !== id) {
        return next(ApiError.badRequest('Email is already in use'));
      }

      user.email = email;
    }
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // Update password if provided
    if (password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    await userRepository.save(user);

    // Don't return sensitive information
    const { password: _, ...userWithoutSensitiveInfo } = user;

    res.status(200).json({
      success: true,
      data: userWithoutSensitiveInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user by their ID. Only accessible by admins.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await userRepository.findOne({
      where: { id },
      relations: ['role']
    });

    if (!user) {
      return next(ApiError.notFound(`User with id ${id} not found`));
    }

    // Admin cannot delete superadmin
    if (
      req.user?.role === RoleType.ADMIN &&
      user.role.name === RoleType.SUPERADMIN
    ) {
      return next(ApiError.forbidden('Admin cannot delete superadmin'));
    }

    // Prevent deleting yourself
    if (req.user?.userId === id) {
      return next(ApiError.badRequest('You cannot delete your own account'));
    }

    await userRepository.remove(user);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
