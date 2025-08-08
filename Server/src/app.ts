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
import { specs } from './config/swagger';
import config from './config/config';

let swaggerDocument;
try {
  // Try to read swagger.json file first
  swaggerDocument = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf-8')
  );
} catch (error) {
  // If file doesn't exist, fall back to specs from config
  swaggerDocument = specs;
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


app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Set longer timeout for game creation requests
app.use('/api/games', (req, res, next) => {
  // Set timeout to 25 minutes for game creation and updates
  if (req.method === 'POST' || req.method === 'PUT') {
    req.setTimeout(25 * 60 * 1000); // 25 minutes in milliseconds
    res.setTimeout(25 * 60 * 1000); // 25 minutes in milliseconds
  }
  next();
});

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
