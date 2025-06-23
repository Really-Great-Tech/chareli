import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Category } from './Category';
import { User } from './User';
import { File } from './Files';


export enum GameStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailFileId: string;

  @ManyToOne(() => File, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'thumbnailFileId' })
  thumbnailFile: File;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.ACTIVE
  })
  status: GameStatus;

  @Column({ nullable: true })
  gameFileId: string;

  @ManyToOne(() => File, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gameFileId' })
  gameFile: File;

  @Column({ type: 'int', default: 0 })
  config: number;

  @ManyToOne(() => Category, category => category.games, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @Column({ type: 'int', nullable: true })
  @Index()
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
