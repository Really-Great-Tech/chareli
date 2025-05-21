import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export interface ExtractedFile {
  relativePath: string;
  buffer: Buffer;
  isIndex: boolean;
}

export interface ProcessedZip {
  files: ExtractedFile[];
  indexPath?: string;
  error?: string;
}

export class ZipService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'game-uploads');
  }

  /**
   * Process a zip file containing game files
   * @param zipBuffer The zip file as a buffer
   * @returns ProcessedZip object containing extracted files and index path
   */
  async processGameZip(zipBuffer: Buffer): Promise<ProcessedZip> {
    const tempPath = await this.saveTempFile(zipBuffer);
    
    try {
      // Extract and validate zip contents
      const zip = new AdmZip(tempPath);
      const zipEntries = zip.getEntries();
      
      const files: ExtractedFile[] = [];
      let indexPath: string | undefined;
      
      // First, collect all directories to ensure they exist
      const directories = new Set<string>();
      for (const entry of zipEntries) {
        if (entry.isDirectory) {
          directories.add(entry.entryName);
        } else {
          // Add parent directories of files too
          const dir = path.dirname(entry.entryName);
          if (dir !== '.') {
            directories.add(dir + '/');
          }
        }
      }

      // Then process files, maintaining folder structure
      for (const entry of zipEntries) {
        if (entry.isDirectory) {
          continue;
        }
        
        // Normalize path to use forward slashes
        const relativePath = entry.entryName.replace(/\\/g, '/');
        const isIndex = relativePath.toLowerCase().endsWith('index.html');
        
        // Store file info with full path structure
        files.push({
          relativePath,
          buffer: entry.getData(),
          isIndex
        });
        
        // Track index.html location
        if (isIndex) {
          indexPath = relativePath;
        }
      }
      
      // Validate zip contents
      if (!indexPath) {
        throw new Error('No index.html file found in the zip');
      }
      
      // Cleanup temp file
      await this.cleanup(tempPath);
      
      return {
        files,
        indexPath
      };
    } catch (error: any) {
      // Cleanup on error
      await this.cleanup(tempPath);
      
      const errorMessage = error.message || 'Unknown error processing zip file';
      logger.error('Error processing zip file:', errorMessage);
      return {
        files: [],
        error: error.message
      };
    }
  }
  
  /**
   * Save buffer to temporary file
   * @param buffer File buffer to save
   * @returns Path to temporary file
   */
  private async saveTempFile(buffer: Buffer): Promise<string> {
    // Ensure temp directory exists
    await fs.mkdir(this.tempDir, { recursive: true });
    
    const tempPath = path.join(this.tempDir, `${uuidv4()}.zip`);
    await fs.writeFile(tempPath, buffer);
    
    return tempPath;
  }
  
  /**
   * Clean up temporary file
   * @param filePath Path to file to delete
   */
  private async cleanup(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error cleaning up temp file';
      logger.warn('Error cleaning up temp file:', errorMessage);
    }
  }
}

// Singleton instance
export const zipService = new ZipService();
