import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import { sanitizeInput } from './middlewares/sanitizationMiddleware';
import logger from './utils/logger';
import fs from 'fs';
import path from 'path';
//import swaggerDocument from '../dist/swagger.json';
//import { specs } from './config/swagger';
import config from './config/config';
// import { cloudFrontService } from './services/cloudfront.service';

let swaggerDocument: any = null;
try {
  swaggerDocument = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf-8')
  );
} catch (error) {
  logger.warn('swagger.json not found, API documentation will not be available');
  swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'Chareli API',
      version: '1.0.0',
      description: 'API documentation not available - swagger.json not found'
    },
    paths: {}
  };
}

const app: Express = express();
app.use(requestLogger);
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? [config.app.clientUrl] : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'"], // unsafe-inline is needed by swagger-ui
        'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        'font-src': ["'self'", 'fonts.gstatic.com'],
      },
    },
  })
);

// Body parsing middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Input sanitization middleware
app.use(sanitizeInput);

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'none',
    },
  })
);

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);
logger.info(`Express application initialized in ${config.env} mode`);

export default app;
