import { loadConfiguration } from './services/secrets.service';
import app from './app';
import config from './config/config';
import { initializeDatabase } from './config/database';
import logger from './utils/logger';
import fs from 'fs';
import path from 'path';
import { authService } from './services/auth.service';
import { initializeScheduledJobs } from './jobs';
// import { UploadWorker } from './workers/upload-worker';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
  logger.info(`Created logs directory at ${logDir}`);
}

const startServer = async () => {
  try {
    await loadConfiguration();

    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
      logger.info(`Created logs directory at ${logDir}`);
    }


    logger.info('Initializing database connection...');
    try {
      await initializeDatabase();

      // Initialize superadmin account
      logger.info('Initializing superadmin account...');
      await authService.initializeSuperadmin();

      // Initialize scheduled jobs
      initializeScheduledJobs();

      // Initialize upload worker
      // try {
      //   // const uploadWorker = new UploadWorker();
      //   await uploadWorker.start();
      //   logger.info('✅ Upload worker started successfully');
      // } catch (workerError) {
      //   logger.warn('⚠️ Upload worker failed to start, uploads will use sync mode');
      //   logger.warn(workerError instanceof Error ? workerError.message : String(workerError));
      // }
    } catch (dbError) {
      if (config.env === 'development') {
        logger.warn(
          'Failed to connect to database in development mode, continuing without database connection'
        );
        logger.warn(
          'You can still access the Swagger documentation at http://localhost:5000/api-docs'
        );
      } else {
        throw dbError;
      }
    }

    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(
        `Server running in ${config.env} mode on port ${config.port}`
      );
      logger.info(`API available at http://localhost:${config.port}/api`);
      logger.info(
        `API documentation available at http://localhost:${config.port}/api-docs`
      );
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack || 'No stack trace available');


      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down...');
      logger.error(`${err.name}: ${err.message}`);
      logger.error(err.stack || 'No stack trace available');


      process.exit(1);
    });

    // Handle SIGTERM signal
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated!');
      });
    });
  } catch (error) {
    logger.error('Failed to start server:');
    logger.error(
      error instanceof Error ? error.stack || error.message : String(error)
    );


    process.exit(1);
  }
};

startServer();
