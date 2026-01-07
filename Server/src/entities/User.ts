import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Role } from './Role';

@Entity('users')
@Index(['isActive', 'isVerified'])
@Index(['roleId', 'isActive'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  @Index()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ unique: true, nullable: true })
  @Index()
  phoneNumber: string;

  @Column({ nullable: true })
  fileId: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  registrationIpAddress: string;

  @Column({ nullable: true })
  @Index()
  lastKnownDeviceType: string;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column()
  @Index()
  roleId: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ default: false })
  @Index()
  isVerified: boolean;

  @Column({ default: false })
  isAdult: boolean;

  @Column({ default: false })
  hasAcceptedTerms: boolean;

  @Column({ default: false })
  hasCompletedFirstLogin: boolean;

  @Column({ nullable: true })
  lastLoggedIn: Date;

  @Column({ nullable: true })
  @Index()
  lastSeen: Date;

  @Column({ default: false })
  @Index()
  isDeleted: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true, select: false })
  resetToken: string;

  @Column({ nullable: true })
  resetTokenExpiry: Date;

  @Column({ nullable: true, default: 'UTC' })
  preferredTimezone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
