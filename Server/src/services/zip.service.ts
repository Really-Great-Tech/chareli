import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export interface ProcessedZip {
  extractedPath: string;
  indexPath?: string;
  error?: string;
}

export class ZipService {
 
  async processGameZip(zipBuffer: Buffer): Promise<ProcessedZip> {
    // Create a unique temp directory for this upload
    const tempDir = path.join(os.tmpdir(), 'game-uploads', uuidv4());
    
    try {
      // Extract zip maintaining folder structure
      const zip = new AdmZip(zipBuffer);
      await fs.mkdir(tempDir, { recursive: true });
      zip.extractAllTo(tempDir, true);
      
      // Find index.html recursively
      const indexPath = await this.findIndexHtml(tempDir);
      if (!indexPath) {
        throw new Error('No index.html file found in the zip');
      }
      
      return {
        extractedPath: tempDir,
        indexPath: path.relative(tempDir, indexPath)
      };
    } catch (error: any) {
      // Cleanup on error
      await this.cleanup(tempDir);
      
      const errorMessage = error.message || 'Unknown error processing zip file';
      logger.error('Error processing zip file:', errorMessage);
      return {
        extractedPath: '',
        error: errorMessage
      };
    }
  }


  private async findIndexHtml(dir: string): Promise<string | undefined> {
    const files = await fs.readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        const found = await this.findIndexHtml(fullPath);
        if (found) return found;
      } else if (file.name.toLowerCase() === 'index.html') {
        return fullPath;
      }
    }
    
    return undefined;
  }
  
  
  private async cleanup(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          await this.cleanup(fullPath);
        } else {
          await fs.unlink(fullPath);
        }
      }
      
      await fs.rmdir(dirPath);
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error cleaning up temp directory';
      logger.warn('Error cleaning up temp directory:', errorMessage);
    }
  }
}

export const zipService = new ZipService();
