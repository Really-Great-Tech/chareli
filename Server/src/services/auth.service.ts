import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Role, RoleType } from '../entities/Role';
import { Invitation } from '../entities/Invitation';
import { Otp, OtpType } from '../entities/Otp';
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
    phoneNumber: string,
    isAdult: boolean = false,
    hasAcceptedTerms: boolean = false,
    country?: string
  ): Promise<User> {
    // Check if user already exists
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
      isActive: true,
      isAdult,
      hasAcceptedTerms,
      country
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
    phoneNumber: string,
    isAdult: boolean = false,
    hasAcceptedTerms: boolean = false,
    country?: string
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
      isActive: true,
      isAdult,
      hasAcceptedTerms,
      country
    });

    await userRepository.save(user);

    // Mark invitation as accepted
    invitation.isAccepted = true;
    await invitationRepository.save(invitation);

    return user;
  }

  
  async login(identifier: string, password: string): Promise<User> {
    // Detect if it's email or phone based on format
    const isEmail = identifier.includes('@');
    
    const user = await userRepository.findOne({
      where: isEmail ? { email: identifier } : { phoneNumber: identifier },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'phoneNumber', 'isActive', 'isVerified', 'roleId'],
      relations: ['role']
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // If user was inactive due to inactivity, reactivate them
    if (!user.isActive) {
      user.isActive = true;
      logger.info(`Reactivating previously inactive user: ${user.id} (${user.email})`);
    }

    // Update lastLoggedIn timestamp
    user.lastLoggedIn = new Date();
    await userRepository.save(user);

    return user;
  }

  async sendOtp(user: User, type: OtpType = OtpType.SMS): Promise<boolean> {
    if (type === OtpType.SMS || type === OtpType.BOTH) {
      if (!user.phoneNumber) {
        throw new Error('User does not have a phone number');
      }
    }

    if (type === OtpType.EMAIL || type === OtpType.BOTH) {
      if (!user.email) {
        throw new Error('User does not have an email address');
      }
    }

    const otp = await otpService.generateOtp(user.id, type);
    return otpService.sendOtp(user.id, otp, type);
  }

  
  async verifyOtp(userId: string, otp: string): Promise<AuthTokens> {
    const isValid = await otpService.verifyOtp(userId, otp);
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

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

    return this.generateTokens(user);
  }

 
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


  async createInvitation(
    email: string,
    roleName: RoleType,
    invitedById: string
  ): Promise<Invitation> {
    // Check if user already has this role
    const existingUser = await userRepository.findOne({ 
      where: { email },
      relations: ['role']
    });
    
    if (existingUser && existingUser.role.name === roleName) {
      throw new Error('User already has this role');
    }

    // Check for pending invitation
    const existingInvitation = await invitationRepository.findOne({ where: { email } });
    if (existingInvitation) {
      throw new Error('Invitation for this email already exists');
    }

    const role = await roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const inviter = await userRepository.findOne({ where: { id: invitedById } });
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    const token = uuidv4();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.otp.invitationExpiryDays);

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

    // Generate invitation link - point to frontend route
    const frontendUrl = config.env === 'development' ? 'http://localhost:5173' : '';
    const invitationLink = `${frontendUrl}/register-invitation/${token}`;

    // Send invitation email
    await emailService.sendInvitationEmail(email, invitationLink, role.name);

    return invitation;
  }

 
  async requestPasswordReset(email: string): Promise<boolean> {
    // Find the user
    const user = await userRepository.findOne({ where: { email } });
    
    // Even if user is not found, return true to prevent email enumeration attacks
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return true;
    }

  
    const resetToken = crypto.randomBytes(32).toString('hex');
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
    
    // Generate reset link - point to frontend route instead of API endpoint
    const frontendUrl = config.env === 'development' ? 'http://localhost:5173' : '';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
    
    try {
      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetLink);
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  
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

  
  async initializeSuperadmin(): Promise<void> {
    try {
      let superadminRole = await roleRepository.findOne({
        where: { name: RoleType.SUPERADMIN }
      });

      if (!superadminRole) {
        logger.warn('Superadmin role not found. Skipping superadmin initialization.');
        return;
      }

      const existingSuperadmin = await userRepository.findOne({
        where: { role: { name: RoleType.SUPERADMIN } },
        relations: ['role']
      });

      if (existingSuperadmin) {
        logger.info('Superadmin account already exists');
        return;
      }

      const hashedPassword = await this.hashPassword(config.superadmin.password);

      const superadmin = userRepository.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: config.superadmin.email,
        password: hashedPassword,
        role: superadminRole,
        roleId: superadminRole.id,
        isVerified: true,
        isActive: true,
        isAdult: true,
        hasAcceptedTerms: true
      });

      await userRepository.save(superadmin);
      logger.info(`Superadmin account created with email: ${config.superadmin.email}`);
    } catch (error) {
      logger.error('Failed to initialize superadmin account:', error);
    }
  }

 
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }


  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
