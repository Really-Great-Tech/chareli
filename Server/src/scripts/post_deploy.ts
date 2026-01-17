import 'dotenv/config';
import { AppDataSource } from '../config/database';
import { cloudflareCacheService } from '../services/cloudflare-cache.service';
import { jsonCdnService } from '../services/jsonCdn.service';
import logger from '../utils/logger';

const runPostDeploy = async () => {
  try {
    logger.info('🚀 Starting Post-Deploy Cache Busting...');

    // Initialize Database (required for jsonCdnService to fetch data)
    await AppDataSource.initialize();
    logger.info('Database connected');

    // 1. Purge App Zone (Fix Blank Page)
    // This fixes the issue where users see a blank page after deployment until cache is flushed
    logger.info('1️⃣  Purging Application Zone...');
    const appPurged = await cloudflareCacheService.purgeApp();
    if (appPurged) logger.info('✅ Application Zone purged');
    else logger.warn('⚠️  Application Zone purge skipped or failed');

    // 2. Regenerate JSON Files (Fix Stale Data)
    // This fixes the issue where likes reset to 100 because JSONs are stale
    logger.info('2️⃣  Regenerating JSON CDN Files...');
    await jsonCdnService.generateAllJsonFiles();
    logger.info('✅ JSON Files regenerated');

    // 3. Purge CDN Zone (Ensure fresh JSON served)
    // Extra safety measure to ensure the newly generated JSONs are served
    logger.info('3️⃣  Purging CDN Zone...');
    const cdnPurged = await cloudflareCacheService.purgeAll();
    if (cdnPurged) logger.info('✅ CDN Zone purged');
    else logger.warn('⚠️  CDN Zone purge skipped or failed');

    logger.info('🎉 Post-Deploy actions completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during post-deploy actions:', error);
    process.exit(1);
  }
};

runPostDeploy();
