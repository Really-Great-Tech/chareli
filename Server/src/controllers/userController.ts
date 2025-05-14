import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Role, RoleType } from '../entities/Role';
import { ApiError } from '../middlewares/errorHandler';
import * as bcrypt from 'bcrypt';

const userRepository = AppDataSource.getRepository(User);
const roleRepository = AppDataSource.getRepository(Role);

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
 *     description: Create a new user in the system. Only accessible by admins.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *               - roleId
 *           example:
 *             firstName: "Alex"
 *             lastName: "Johnson"
 *             email: "alex.johnson@example.com"
 *             password: "SecurePass789!"
 *             phoneNumber: "+1555123456"
 *             roleId: "aa628a45-4c53-4500-a66a-e4c0851c2e00"
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
    const { firstName, lastName, email, password, roleId, phoneNumber } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !roleId) {
      return next(ApiError.badRequest('All fields are required'));
    }

    // Check if user with email already exists
    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      return next(ApiError.badRequest('User with this email already exists'));
    }

    // Get the role
    const role = await roleRepository.findOne({
      where: { id: roleId }
    });

    if (!role) {
      return next(ApiError.badRequest('Invalid role'));
    }

    // Check if the current user has permission to create a user with this role
    if (
      req.user?.role === RoleType.ADMIN &&
      (role.name === RoleType.SUPERADMIN || role.name === RoleType.ADMIN)
    ) {
      return next(ApiError.forbidden('Admin can only create editor and player roles'));
    }

    // Hash the password
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
      roleId,
      isVerified: false,
      isActive: true
    });

    await userRepository.save(user);

    // Don't return sensitive information
    const { password: _, ...userWithoutSensitiveInfo } = user;

    res.status(201).json({
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
