import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import yauzl from 'yauzl';
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
      // Create temp directory
      await fs.mkdir(tempDir, { recursive: true });
      
      // Write buffer to temporary file for yauzl
      const tempZipPath = path.join(tempDir, 'temp.zip');
      await fs.writeFile(tempZipPath, zipBuffer);
      
      // Extract using yauzl
      await this.extractZip(tempZipPath, tempDir);
      
      // Delete temporary zip file
      await fs.unlink(tempZipPath);
      
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

  private extractZip(zipPath: string, targetDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (err, zipfile) => {
        if (err) {
          return reject(err);
        }

        if (!zipfile) {
          return reject(new Error('Failed to open ZIP file'));
        }

        zipfile.readEntry();

        zipfile.on('entry', async (entry) => {
          const fullPath = path.join(targetDir, entry.fileName);

          // Directory entry
          if (/\/$/.test(entry.fileName)) {
            try {
              await fs.mkdir(fullPath, { recursive: true });
              zipfile.readEntry();
            } catch (err) {
              zipfile.close();
              reject(err);
            }
            return;
          }

          // File entry
          zipfile.openReadStream(entry, async (err, readStream) => {
            if (err) {
              zipfile.close();
              return reject(err);
            }

            if (!readStream) {
              zipfile.close();
              return reject(new Error('Failed to open read stream'));
            }

            try {
              // Ensure directory exists
              const dirPath = path.dirname(fullPath);
              await fs.mkdir(dirPath, { recursive: true });

              // Create write stream
              const writeStream = require('fs').createWriteStream(fullPath);

              readStream.pipe(writeStream);

              writeStream.on('close', () => {
                zipfile.readEntry();
              });

              writeStream.on('error', (err: Error) => {
                zipfile.close();
                reject(err);
              });
            } catch (err) {
              zipfile.close();
              reject(err);
            }
          });
        });

        zipfile.on('end', () => {
          resolve();
        });

        zipfile.on('error', (err) => {
          reject(err);
        });
      });
    });
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
