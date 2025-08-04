import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UploadJobStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum UploadJobType {
  GAME = 'game',
  THUMBNAIL = 'thumbnail'
}

@Entity('upload_jobs')
@Index(['status', 'createdAt'])
@Index(['userId', 'status'])
export class UploadJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: UploadJobType,
    default: UploadJobType.GAME
  })
  type: UploadJobType;

  @Column({
    type: 'enum',
    enum: UploadJobStatus,
    default: UploadJobStatus.PENDING
  })
  @Index()
  status: UploadJobStatus;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    title?: string;
    description?: string;
    categoryId?: string;
    position?: number;
    config?: number;
    thumbnailKey?: string;
    gameFileKey?: string;
    originalFilename?: string;
    fileSize?: number;
    contentType?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  result: {
    gameId?: string;
    thumbnailFileId?: string;
    gameFileId?: string;
    publicUrls?: {
      thumbnail?: string;
      game?: string;
    };
  };

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ nullable: true })
  currentStep: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
