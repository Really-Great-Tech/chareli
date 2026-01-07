import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from './User';
import { Game } from './Games';

@Entity('analytics', { schema: 'internal' })
@Index(['userId', 'activityType'])
@Index(['gameId', 'startTime'])
@Index(['userId', 'startTime'])
@Index(['activityType', 'startTime'])
@Index(['userId', 'gameId'])
// Composite indexes for optimized queries (new)
@Index(['createdAt', 'userId', 'sessionId', 'duration']) // For unified user counting with COALESCE
@Index(['createdAt', 'gameId', 'duration'])              // For game session queries
@Index(['createdAt', 'duration'])                        // For time-range filtered queries
export class Analytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'session_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  sessionId: string | null;

  @Column({ name: 'game_id', nullable: true })
  @Index()
  gameId: string | null;

  @ManyToOne(() => Game, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  activityType: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  startTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  endTime: Date;

  @Column({ type: 'int', nullable: true })
  @Index()
  duration: number | null; // Duration in seconds

  @Column({ type: 'int', nullable: true, default: null })
  sessionCount: number | null;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateDuration() {
    if (this.startTime && this.endTime) {
      // Calculate duration in seconds only if both startTime and endTime are present
      this.duration = Math.floor(
        (this.endTime.getTime() - this.startTime.getTime()) / 1000
      );
    } else {
      // Set duration to null if either startTime or endTime is missing
      this.duration = null;
    }
  }
}
