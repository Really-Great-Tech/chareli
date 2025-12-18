import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('signup_analytics', { schema: 'internal' })
export class SignupAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  sessionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  @Index()
  country: string;

  @Column({ nullable: true })
  @Index()
  deviceType: string; // 'mobile', 'tablet', 'desktop'

  @Column()
  @Index()
  type: string; // Type of signup form that was clicked

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
