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

  generatePresignedUrl(key: string, contentType: string): Promise<string>;
  downloadFile(key: string): Promise<Buffer>;
  uploadDirectory(localPath: string, remotePath: string): Promise<void>;
  deleteFile(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
}
