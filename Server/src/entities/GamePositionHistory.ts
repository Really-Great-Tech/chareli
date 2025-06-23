import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Game } from './Games';

@Entity('game_position_history')
@Unique(['gameId', 'position'])
export class GamePositionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  gameId: string;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
