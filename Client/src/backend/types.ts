export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  games?: Game[];
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export type GameStatus = 'active' | 'disabled';

export interface Game {
  id: string;
  title: string;
  description?: string;
  thumbnailFileId?: string;
  thumbnailFile?: FileMetadata;
  status: GameStatus;
  gameFileId?: string;
  gameFile?: FileMetadata;
  config: number;
  categoryId?: string;
  category?: Category;
  createdById?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameDto {
  title: string;
  description?: string;
  thumbnailFile?: File;
  gameFile?: File;
  config?: number;
  categoryId?: string;
}

export type UpdateGameDto = Partial<CreateGameDto>;

// These types represent the actual API response structure
export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: T[];
}

export interface GameFile {
  id: string;
  s3Key: string;
  url: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimilarGame {
  id: string;
  title: string;
  thumbnailFile?: GameFile;
}

export interface GameData {
  id: string;
  title: string;
  description?: string;
  thumbnailFile?: GameFile;
  gameFile?: GameFile;
  status: GameStatus;
  config: number;
  categoryId?: string;
  category?: Category;
  createdById?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
  similarGames?: SimilarGame[];
}

export type GameResponse = GameData;
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: Role
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface OtpVerification {
  userId: string;
  otp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type RegistrationData = Partial<User> & {
  password: string;
  hasAcceptedTerms: boolean;
  isAdult: boolean;
};

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  id: string;
  oldPassword: string;
  password: string;
}

export interface CreateAnalyticsData {
  gameId?: string;
  activityType: string;
  startTime?: Date;
  endTime?: Date;
  sessionCount?: number;
}

export interface Analytics {
  id: string;
  userId: string;
  gameId?: string;
  activityType: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  sessionCount?: number;
  createdAt: string;
  updatedAt: string;
}

// New upload flow types
export interface PresignedUrlRequest {
  files: Array<{
    path: string;
    contentType: string;
    size: number;
  }>;
  thumbnail: {
    name: string;
    contentType: string;
    size: number;
  };
}

export interface PresignedUrlResponse {
  gameId: string;
  gameFiles: Array<{
    path: string;
    uploadUrl: string;
    s3Key: string;
  }>;
  thumbnail: {
    uploadUrl: string;
    s3Key: string;
  };
  indexFileKey: string;
}

export interface CreateGameFromUploadRequest {
  gameId: string;
  title: string;
  description?: string;
  categoryId?: string;
  status?: GameStatus;
  config?: number;
  thumbnailS3Key: string;
  gameFileS3Key: string;
}
