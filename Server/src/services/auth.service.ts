import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Role, RoleType } from '../entities/Role';
import { Invitation } from '../entities/Invitation';
import config from '../config/config';
import logger from '../utils/logger';
import { otpService } from './otp.service';
import { emailService } from './email.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { MoreThan } from 'typeorm';

const userRepository = AppDataSource.getRepository(User);
const roleRepository = AppDataSource.getRepository(Role);
const invitationRepository = AppDataSource.getRepository(Invitation);

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user (only available for players)
   */
  async registerPlayer(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Get the player role
    const playerRole = await roleRepository.findOne({
      where: { name: RoleType.PLAYER }
    });

    if (!playerRole) {
      throw new Error('Player role not found');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(password);

    // Create the user
    const user = userRepository.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      role: playerRole,
      roleId: playerRole.id,
      isVerified: false,
      isActive: true
    });

    await userRepository.save(user);

    return user;
  }

  /**
   * Register a user from an invitation
   */
  async registerFromInvitation(
    token: string,
    firstName: string,
    lastName: string,
    password: string,
    phoneNumber: string
  ): Promise<User> {
    // Find the invitation
    const invitation = await invitationRepository.findOne({
      where: { token },
      relations: ['role']
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.isAccepted) {
      throw new Error('Invitation has already been accepted');
    }

    if (new Date() > invitation.expiresAt) {
      throw new Error('Invitation has expired');
    }

    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: invitation.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(password);

    // Create the user
    const user = userRepository.create({
      firstName,
      lastName,
      email: invitation.email,
      password: hashedPassword,
      phoneNumber,
      role: invitation.role,
      roleId: invitation.roleId,
      isVerified: false,
      isActive: true
    });

    await userRepository.save(user);

    // Mark invitation as accepted
    invitation.isAccepted = true;
    await invitationRepository.save(invitation);

    return user;
  }

  /**
   * Login a user with email and password
   * Returns the user if credentials are valid
   */
  async login(email: string, password: string): Promise<User> {
    // Find the user with password included
    const user = await userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'phoneNumber', 'isActive', 'isVerified', 'roleId'],
      relations: ['role']
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return user;
  }

  /**
   * Send OTP to user's phone number
   */
  async sendOtp(user: User): Promise<boolean> {
    if (!user.phoneNumber) {
      throw new Error('User does not have a phone number');
    }

    // Generate OTP
    const otp = await otpService.generateOtp(user.phoneNumber);

    // Send OTP
    return otpService.sendOtp(user.phoneNumber, otp);
  }

  /**
   * Verify OTP and generate JWT tokens
   */
  async verifyOtp(userId: string, phoneNumber: string, otp: string): Promise<AuthTokens> {
    // Verify OTP
    const isValid = await otpService.verifyOtp(phoneNumber, otp);
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    // Find the user
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Mark user as verified if not already
    if (!user.isVerified) {
      user.isVerified = true;
      await userRepository.save(user);
    }

    // Generate tokens
    return this.generateTokens(user);
  }

  /**
   * Generate JWT tokens for a user
   */
  generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name
    };

    const accessToken = jwt.sign(
      payload, 
      config.jwt.secret
    );

    const refreshToken = jwt.sign(
      payload, 
      config.jwt.refreshSecret
    );

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

      // Find the user
      const user = await userRepository.findOne({
        where: { id: decoded.userId },
        relations: ['role']
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid token');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Create an invitation for a new user
   */
  async createInvitation(
    email: string,
    roleName: RoleType,
    invitedById: string
  ): Promise<Invitation> {
    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if invitation already exists
    const existingInvitation = await invitationRepository.findOne({ where: { email } });
    if (existingInvitation) {
      throw new Error('Invitation for this email already exists');
    }

    // Get the role
    const role = await roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    // Get the inviter
    const inviter = await userRepository.findOne({ where: { id: invitedById } });
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Generate token
    const token = uuidv4();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.otp.invitationExpiryDays);

    // Create invitation
    const invitation = invitationRepository.create({
      email,
      role,
      roleId: role.id,
      token,
      expiresAt,
      invitedBy: inviter,
      invitedById
    });

    await invitationRepository.save(invitation);

    // Generate invitation link
    const invitationLink = `${config.env === 'development' ? 'http://localhost:5000' : ''}/api/auth/register/${token}`;

    // Send invitation email
    await emailService.sendInvitationEmail(email, invitationLink, role.name);

    return invitation;
  }

  /**
   * Request a password reset
   * Generates a reset token and sends it to the user's email
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    // Find the user
    const user = await userRepository.findOne({ where: { email } });
    
    // Even if user is not found, return true to prevent email enumeration attacks
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return true;
    }

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing it
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiry (1 hour)
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
    
    // Save the token to the user
    user.resetToken = hashedToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await userRepository.save(user);
    
    // Generate reset link
    const resetLink = `${config.env === 'development' ? 'http://localhost:5000' : ''}/api/auth/reset-password/${resetToken}`;
    
    try {
      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetLink);
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Verify a password reset token
   */
  async verifyResetToken(token: string): Promise<User> {
    // Hash the token to compare with the stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with this token and valid expiry
    const user = await userRepository.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: MoreThan(new Date())
      }
    });
    
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    
    return user;
  }

  /**
   * Reset a user's password using a valid reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Verify the token first
    const user = await this.verifyResetToken(token);
    
    // Hash the new password
    const hashedPassword = await this.hashPassword(newPassword);
    
    // Update the user's password and clear the reset token
    user.resetToken = '';
    user.resetTokenExpiry = new Date(0); // Set to epoch time
    user.password = hashedPassword;
    
    await userRepository.save(user);
    
    return true;
  }

  /**
   * Initialize the superadmin account if it doesn't exist
   */
  async initializeSuperadmin(): Promise<void> {
    try {
      // Check if superadmin role exists
      let superadminRole = await roleRepository.findOne({
        where: { name: RoleType.SUPERADMIN }
      });

      // If roles don't exist yet, the migration might not have run
      if (!superadminRole) {
        logger.warn('Superadmin role not found. Skipping superadmin initialization.');
        return;
      }

      // Check if superadmin user exists
      const existingSuperadmin = await userRepository.findOne({
        where: { role: { name: RoleType.SUPERADMIN } },
        relations: ['role']
      });

      if (existingSuperadmin) {
        logger.info('Superadmin account already exists');
        return;
      }

      // Create superadmin user
      const hashedPassword = await this.hashPassword(config.superadmin.password);

      const superadmin = userRepository.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: config.superadmin.email,
        password: hashedPassword,
        role: superadminRole,
        roleId: superadminRole.id,
        isVerified: true,
        isActive: true
      });

      await userRepository.save(superadmin);
      logger.info(`Superadmin account created with email: ${config.superadmin.email}`);
    } catch (error) {
      logger.error('Failed to initialize superadmin account:', error);
    }
  }

  /**
   * Hash a password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

// Singleton instance
export const authService = new AuthService();
