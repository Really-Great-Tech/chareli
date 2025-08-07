import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { storageService } from '../services/storage.service';
import logger from './logger';

/**
 * Move a file from temporary storage to permanent storage with proper naming
 * @param tempKey - The temporary storage key
 * @param folder - The permanent storage folder (e.g., 'thumbnails', 'games')
 * @returns The permanent storage key
 */
export const moveFileToPermanentStorage = async (
  tempKey: string, 
  folder: string
): Promise<string> => {
  try {
    // Generate unique file ID
    const fileId = uuidv4();
    
    // Extract original filename from temp key
    const originalFilename = tempKey.split('/').pop() || 'file';
    const extension = path.extname(originalFilename);
    const cleanFilename = path.basename(originalFilename, extension)
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    // Create permanent key with proper naming convention
    const permanentKey = `${folder}/${fileId}-${cleanFilename}${extension}`;
    
    // Move file using storage service (preserves content type and metadata)
    await storageService.moveFile(tempKey, permanentKey);
    
    logger.info(`Successfully moved file from ${tempKey} to ${permanentKey}`);
    return permanentKey;
  } catch (error) {
    logger.error('Error moving file to permanent storage:', { error, tempKey, folder });
    throw new Error(`Failed to move file to permanent storage: ${(error as Error).message}`);
  }
};

/**
 * Extract file information from a storage key
 * @param key - The storage key
 * @returns Object with filename, extension, and clean filename
 */
export const extractFileInfo = (key: string) => {
  const originalFilename = key.split('/').pop() || 'file';
  const extension = path.extname(originalFilename);
  const cleanFilename = path.basename(originalFilename, extension)
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return {
    originalFilename,
    extension,
    cleanFilename
  };
};

/**
 * Generate a unique file key for permanent storage
 * @param originalFilename - The original filename
 * @param folder - The storage folder
 * @returns A unique storage key
 */
export const generatePermanentFileKey = (originalFilename: string, folder: string): string => {
  const fileId = uuidv4();
  const extension = path.extname(originalFilename);
  const cleanFilename = path.basename(originalFilename, extension)
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return `${folder}/${fileId}-${cleanFilename}${extension}`;
};
