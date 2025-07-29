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
import { specs } from './config/swagger';
import config from './config/config';
// import { cloudFrontService } from './services/cloudfront.service';

const app: Express = express();

// Request logging middleware
app.use(requestLogger);


// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [config.app.clientUrl] // Change this line to use the configured client URL
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
  );
  next();
});

// Body parsing middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Input sanitization middleware
app.use(sanitizeInput);


// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'none',
  },
}));



// test/cloudfront.test.ts



// async function testSignedUrl() {
//    const s3Key = 'games/200274ce-df18-4160-96c1-09efe2e71cd8/glass-city/index.html';

//   const signedUrl = cloudFrontService.transformS3KeyToCloudFront(s3Key);

//   console.log('Generated Signed URL:');
//   console.log(signedUrl);
// }

// testSignedUrl();










































































// API Routes
app.use('/api', routes);


// Error handling middleware
app.use(errorHandler);
logger.info(`Express application initialized in ${config.env} mode`);

export default app;
