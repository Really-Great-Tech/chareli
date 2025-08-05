import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

import { IStorageService, UploadResult } from './storage.interface';
import config from '../config/config';
import logger from '../utils/logger';

// The directory where local uploads will be stored.
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export class LocalStorageAdapter implements IStorageService {
  private publicUrl: string;

  constructor() {
    // Ensure the upload directory exists.
    fs.mkdir(UPLOAD_DIR, { recursive: true });
    this.publicUrl = `http://localhost:${config.port}`;
    logger.info(
      `LocalStorageAdapter initialized. Uploads will be stored in: ${UPLOAD_DIR}`
    );
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/uploads/${key}`;
  }

  async generatePresignedUrl(key: string, contentType: string): Promise<string> {
    // For local storage, we don't need presigned URLs since files are uploaded directly
    // We'll just return a mock URL that won't be used in practice
    logger.warn('generatePresignedUrl called on LocalStorageAdapter - this should not be used in production');
    return `${this.publicUrl}/api/local-upload/${key}`;
  }

  async downloadFile(key: string): Promise<Buffer> {
    const fullPath = path.join(UPLOAD_DIR, key);
    try {
      const buffer = await fs.readFile(fullPath);
      logger.info(`Successfully downloaded local file: ${fullPath}`);
      return buffer;
    } catch (error) {
      logger.error('Error downloading local file:', { error, path: fullPath });
      throw new Error(
        `Failed to download local file: ${(error as Error).message}`
      );
    }
  }

  async uploadFile(
    file: Buffer,
    originalname: string,
    contentType: string,
    folder: string = 'files'
  ): Promise<UploadResult> {
    const fileId = uuidv4();
    const extension = path.extname(originalname);
    const filename = path
      .basename(originalname, extension)
      .replace(/\s+/g, '-')
      .toLowerCase();

    const key = `${folder}/${fileId}-${filename}${extension}`;
    const fullPath = path.join(UPLOAD_DIR, key);

    try {
      // Ensure the subdirectory exists (e.g., 'uploads/thumbnails')
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file);

      logger.info(`Successfully saved file locally to: ${fullPath}`);
      return { key, publicUrl: this.getPublicUrl(key) };
    } catch (error) {
      logger.error('Error saving file locally:', { error, path: fullPath });
      throw new Error(
        `Failed to save file locally: ${(error as Error).message}`
      );
    }
  }

  async uploadDirectory(localPath: string, remotePath: string): Promise<void> {
    const destinationPath = path.join(UPLOAD_DIR, remotePath);
    await fs.cp(localPath, destinationPath, { recursive: true });
    logger.info(
      `Successfully copied directory "${localPath}" to "${destinationPath}"`
    );
  }

  async deleteFile(key: string): Promise<boolean> {
    const fullPath = path.join(UPLOAD_DIR, key);
    try {
      if (await fs.stat(fullPath)) {
        await fs.unlink(fullPath);
        logger.info(`Successfully deleted local file: ${fullPath}`);
        return true;
      }
      return false;
    } catch (error) {
      // If file doesn't exist, it's a "successful" deletion in principle.
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.warn(`Attempted to delete non-existent local file: ${fullPath}`);
        return true;
      }
      logger.error('Error deleting local file:', { error, path: fullPath });
      return false;
    }
  }

  async moveFile(sourceKey: string, destinationKey: string): Promise<string> {
    const sourcePath = path.join(UPLOAD_DIR, sourceKey);
    const destinationPath = path.join(UPLOAD_DIR, destinationKey);
    
    try {
      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      
      // Move the file
      await fs.rename(sourcePath, destinationPath);
      
      logger.info(`Successfully moved local file from ${sourcePath} to ${destinationPath}`);
      return destinationKey;
    } catch (error) {
      logger.error('Error moving local file:', { error, sourceKey, destinationKey });
      throw new Error(
        `Failed to move local file: ${(error as Error).message}`
      );
    }
  }
}
