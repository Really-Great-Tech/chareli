import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { User } from './User';
import { Game } from './Games';

@Entity('analytics')
@Index(['userId', 'activityType'])
@Index(['gameId', 'startTime'])
@Index(['userId', 'startTime'])
@Index(['activityType', 'startTime'])
@Index(['userId', 'gameId'])
export class Analytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

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
      this.duration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
    } else {
      // Set duration to null if either startTime or endTime is missing
      this.duration = null;
    }
  }
}
