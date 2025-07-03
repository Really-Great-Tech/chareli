import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Role, RoleType } from '../entities/Role';
import { Invitation } from '../entities/Invitation';
import { Otp, OtpType } from '../entities/Otp';
import { SystemConfig } from '../entities/SystemConfig';
import { SignupAnalytics } from '../entities/SignupAnalytics';
import config from '../config/config';
import logger from '../utils/logger';
import { getFrontendUrl } from '../utils/main';
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
const systemConfigRepository = AppDataSource.getRepository(SystemConfig);
const signupAnalyticsRepository = AppDataSource.getRepository(SignupAnalytics);

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OtpResult {
  success: boolean;
  actualType: OtpType;
  message: string;
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
    // Check if user already exists by email or phone number (including deleted users)
    const existingUser = await userRepository.findOne({
      where: [{ email }, { phoneNumber }],
      select: ['id', 'email', 'phoneNumber', 'isDeleted'],
    });

    if (existingUser) {
      if (existingUser.email == email) {
        console.log('Email already exists:', existingUser.email);
        throw new Error('Email is already registered');
      }
      if (existingUser.phoneNumber == phoneNumber) {
        throw new Error('Phone number is already registered');
      }
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

    // Check if there's a soft-deleted user with this email
    const softDeletedUser = await userRepository.findOne({
      where: { email: invitation.email, isDeleted: true }
    });

    if (softDeletedUser) {
      // Restore the soft-deleted user instead of creating a new one
      const hashedPassword = await this.hashPassword(password);
      
      softDeletedUser.firstName = firstName as any;
      softDeletedUser.lastName = lastName as any;
      softDeletedUser.password = hashedPassword;
      softDeletedUser.phoneNumber = phoneNumber as any;
      softDeletedUser.role = invitation.role;
      softDeletedUser.roleId = invitation.roleId;
      softDeletedUser.isVerified = false;
      softDeletedUser.isActive = true;
      softDeletedUser.isAdult = isAdult;
      softDeletedUser.hasAcceptedTerms = hasAcceptedTerms;
      softDeletedUser.country = country as any;
      
      // Restore the account
      softDeletedUser.isDeleted = false;
      softDeletedUser.deletedAt = null as any;

      await userRepository.save(softDeletedUser);

      // Mark invitation as accepted
      invitation.isAccepted = true;
      await invitationRepository.save(invitation);

      return softDeletedUser;
    }

    // Check if phone number already exists (for active users)
    const existingUser = await userRepository.findOne({
      where: { phoneNumber, isDeleted: false },
    });

    if (existingUser) {
      throw new Error('Phone number is already registered');
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
      where: isEmail ? { email: identifier, isDeleted: false } : { phoneNumber: identifier, isDeleted: false },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'phoneNumber', 'isActive', 'isVerified', 'hasCompletedFirstLogin', 'roleId', 'country'],
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


  async determineOtpDeliveryMethod(user: User): Promise<OtpType> {
    try {
      const authConfig = await systemConfigRepository.findOne({
        where: { key: 'authentication_settings' }
      });

      if (!authConfig?.value?.settings) {
        logger.info('No authentication settings found, using default OTP behavior');
        return OtpType.NONE;
      }

      const { email, sms, both } = authConfig.value.settings;

      if (both?.enabled) {
        const otpDeliveryMethod = both.otpDeliveryMethod || 'none';
        
        switch (otpDeliveryMethod) {
          case 'email':
            return OtpType.EMAIL;
          case 'sms':
            return OtpType.SMS;
          case 'none':
            return OtpType.NONE;
          default:
            return OtpType.NONE;
        }
      } else if (email?.enabled) {
        return OtpType.EMAIL;
      } else if (sms?.enabled) {
        return OtpType.SMS;
      } else {
        return OtpType.NONE;
      }
    } catch (error) {
      logger.error('Error determining OTP delivery method:', error);
      return OtpType.NONE
    }
  }

  


  async sendOtp(user: User, type: OtpType): Promise<OtpResult> {
    const otp = await otpService.generateOtp(user.id, type);
    const success = await otpService.sendOtp(user.id, otp, type);

    let message = '';
    if (type === OtpType.EMAIL) {
      message = `OTP sent to your email address (${user.email}).`;
    } else if (type === OtpType.SMS) {
      message = `OTP sent to your phone number (${user.phoneNumber}).`;
    }

    return { success, actualType: type, message };
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
        where: { id: decoded.userId, isDeleted: false },
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
    // Check if active user already has this role
    const existingActiveUser = await userRepository.findOne({
      where: { email, isDeleted: false },
      relations: ['role']
    });

    if (existingActiveUser && existingActiveUser.role.name === roleName) {
      throw new Error('User already has this role');
    }

    // Check if there's a soft-deleted user with this email
    const softDeletedUser = await userRepository.findOne({
      where: { email, isDeleted: true },
      relations: ['role']
    });

    // If soft-deleted user exists, we'll allow the invitation (for restoration)
    // No need to throw an error - the invitation will restore their account

    // Check for pending invitation
    const existingInvitation = await invitationRepository.findOne({
      where: {
        email,
        isAccepted: false,
        expiresAt: MoreThan(new Date())
      }
    });
    if (existingInvitation) {
      throw new Error('Active invitation for this email already exists');
    }

    // Clean up old invitations for this email (expired or accepted)
    await invitationRepository.delete({
      email,
      isAccepted: true
    });

    // Delete expired invitations
    await invitationRepository.createQueryBuilder()
      .delete()
      .from(Invitation)
      .where('email = :email', { email })
      .andWhere('expiresAt <= :now', { now: new Date() })
      .execute();

    const role = await roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const inviter = await userRepository.findOne({ where: { id: invitedById, isDeleted: false } });
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
    // const frontendUrl = getFrontendUrl();

    //hardcode this for now, to be removed
    const frontendUrl = 'https://staging.chareli.reallygreattech.com';
    const invitationLink = `${frontendUrl}/register-invitation/${token}`;

    // Send invitation email
    await emailService.sendInvitationEmail(email, invitationLink, role.name);

    return invitation;
  }


  /**
   * Change a user's role directly
   */
  async changeUserRole(
    userId: string,
    newRoleName: RoleType,
    changedById: string
  ): Promise<User> {
    // Find the user
    const user = await userRepository.findOne({
      where: { id: userId, isDeleted: false },
      relations: ['role']
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has this role
    if (user.role.name === newRoleName) {
      throw new Error('User already has this role');
    }

    // Find the new role
    const newRole = await roleRepository.findOne({ where: { name: newRoleName } });
    if (!newRole) {
      throw new Error(`Role ${newRoleName} not found`);
    }

    // Find the person making the change
    const changer = await userRepository.findOne({ where: { id: changedById, isDeleted: false } });
    if (!changer) {
      throw new Error('User making the change not found');
    }

    const oldRoleName = user.role.name;

    // Update user's role
    user.role = newRole;
    user.roleId = newRole.id;
    await userRepository.save(user);

    // Send email notification about role change
    await emailService.sendRoleChangedEmail(user.email, oldRoleName, newRoleName);

    return user;
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    // Find the user
    const user = await userRepository.findOne({ where: { email, isDeleted: false } });

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
    // const frontendUrl = getFrontendUrl();


    //hardcode this for now, will be removed 

    const frontendUrl = 'https://staging.chareli.reallygreattech.com';
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
        hasAcceptedTerms: true,
        hasCompletedFirstLogin: true,
      });

      await userRepository.save(superadmin);
      logger.info(`Superadmin account created with email: ${config.superadmin.email}`);

      // Create signup analytics entry for the new superadmin
      const signupAnalytics = signupAnalyticsRepository.create({
        ipAddress: '127.0.0.1',
        deviceType: 'server',
        type: 'signup-modal'
      });

      await signupAnalyticsRepository.save(signupAnalytics);
      logger.info('Created signup analytics entry for new superadmin');
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
