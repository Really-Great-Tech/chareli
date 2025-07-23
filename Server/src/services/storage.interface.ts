export interface UploadResult {
  /**
   * The unique identifier for the file within the storage system (e.g., 'thumbnails/abc-123.jpg').
   * This is what we will store in our database.
   */
  key: string;
  /**
   * The fully-qualified public URL that a client can use to access the file.
   * This URL will be constructed by the specific adapter (e.g., pointing to a Cloudflare Worker or S3).
   */
  publicUrl: string;
}

/**
 * Defines the contract for any storage service used by the application.
 * Whether it's Cloudflare R2, AWS S3, or the local filesystem for development,
 * it must implement these methods.
 */
export interface IStorageService {
  /**
   * Uploads a single file buffer to the storage provider.
   * @param file The file content as a Buffer.
   * @param originalname The original name of the file, used for generating the key.
   * @param contentType The MIME type of the file (e.g., 'image/jpeg').
   * @param folder An optional sub-folder within the bucket (e.g., 'thumbnails', 'games').
   * @returns A promise that resolves to an UploadResult object.
   */
  uploadFile(
    file: Buffer,
    originalname: string,
    contentType: string,
    folder?: string
  ): Promise<UploadResult>;

  /**
   * Uploads an entire directory recursively. This is essential for our unzipped game files.
   * @param localPath The path to the local directory to be uploaded.
   * @param remotePath The destination path (prefix) in the storage bucket.
   * @returns A promise that resolves when the upload is complete.
   */
  uploadDirectory(localPath: string, remotePath: string): Promise<void>;

  /**
   * Deletes a file from storage using its key.
   * @param key The unique identifier/path of the file to delete.
   * @returns A promise that resolves to true if deletion was successful.
   */
  deleteFile(key: string): Promise<boolean>;

  /**
   * Constructs the public-facing URL for a given storage key.
   * This method encapsulates the logic of how assets are served.
   * @param key The unique identifier/path of the file.
   * @returns The publicly accessible URL.
   */
  getPublicUrl(key: string): string;
}
