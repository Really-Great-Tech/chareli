import { IStorageService } from './storage.interface';
import { R2StorageAdapter } from './r2.storage.adapter';
import { LocalStorageAdapter } from './local.storage.adapter';
import { S3StorageAdapter } from './s3.storage.adapter';
import config from '../config/config';
import logger from '../utils/logger';

let storageService: IStorageService;

switch (config.storageProvider) {
  case 'r2':
    logger.info('Using Cloudflare R2 Storage Adapter.');
    storageService = new R2StorageAdapter();
    break;
  case 's3':
    logger.info('Using AWS S3 Storage Adapter.');
    storageService = new S3StorageAdapter();
    break;
  case 'local':
  default:
    logger.info('Using Local Storage Adapter for development.');
    storageService = new LocalStorageAdapter();
    break;
}

export { storageService };
