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

export interface UpdateGameDto extends Partial<CreateGameDto> {}

// These types represent the actual API response structure
export interface GameResponse extends Omit<Game, 'thumbnailFile' | 'gameFile'> {
  thumbnailFile?: FileMetadata;
  gameFile?: FileMetadata;
}
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
  email: string;
  password: string;
  otpType?: 'SMS' | 'EMAIL' | 'BOTH';
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
