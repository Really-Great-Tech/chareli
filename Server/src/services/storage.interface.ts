export interface UploadResult {
  key: string;
  publicUrl: string;
}

export interface IStorageService {
  uploadFile(
    file: Buffer,
    originalname: string,
    contentType: string,
    folder?: string
  ): Promise<UploadResult>;

 
  uploadDirectory(localPath: string, remotePath: string): Promise<void>;
  deleteFile(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
  generatePresignedUploadUrl?(
    key: string,
    contentType: string,
    expiresIn?: number
  ): Promise<string>;
}
