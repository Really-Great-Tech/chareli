import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * GameLikeCache entity
 * Stores pre-calculated like counts for games
 * Updated daily by cron job to avoid CPU-intensive calculations
 */
@Entity('game_like_cache')
@Index(['gameId'], { unique: true })
export class GameLikeCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  gameId: string;

  @Column({ type: 'integer', default: 0 })
  cachedLikeCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
