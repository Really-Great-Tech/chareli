import 'reflect-metadata';
import express, { Express } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import { sanitizeInput } from './middlewares/sanitizationMiddleware';
import {
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
} from './config/sentry';
import logger from './utils/logger';
import { specs } from './config/swagger';
import config from './config/config';
import { authenticate } from './middlewares/authMiddleware';

const app: Express = express();

// Request logging middleware
app.use(requestLogger);

// Initialize Sentry request handler (only in production)
app.use(sentryRequestHandler());

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://yourfrontenddomain.com'] // Restrict in production
        : '*', // Allow all in development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

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

// if (process.env.NODE_ENV === 'development') {
//   app.use(
//     '/uploads',
//     authenticate,
//     express.static(path.join(process.cwd(), 'uploads'))
//   );
//   logger.info(
//     `Serving local uploads securely from: ${path.join(
//       process.cwd(),
//       'uploads'
//     )}`
//   );
// }

// if (process.env.NODE_ENV === 'development') {
//   // --- THIS IS THE FIX ---
//   // We want to serve EVERYTHING from the 'uploads' directory at the root.
//   // A request to '/games/...' will look for a file in './uploads/games/...'
//   // A request to '/thumbnails/...' will look for a file in './uploads/thumbnails/...'
//   app.use(
//     '/', // Use the root path
//     (req, res, next) => {
//       // This middleware will skip API calls, so they can be handled later.
//       if (req.path.startsWith('/api/') || req.path.startsWith('/api-docs')) {
//         return next();
//       }
//       // For all other requests, run authentication first.
//       return authenticate(req, res, next);
//     },
//     // If authentication passes, serve the static file.
//     express.static(path.join(process.cwd(), 'uploads'))
//   );
//   logger.info(
//     `Serving local uploads securely from: ${path.join(
//       process.cwd(),
//       'uploads'
//     )}`
//   );
//   // -----------------------
// }

// if (process.env.NODE_ENV === 'development') {
//   // --- THIS IS THE FIX ---
//   // The first argument to app.use is the URL prefix. The second is the middleware.
//   // We want to serve files from the './uploads' directory whenever a request
//   // hits a path that isn't the API.

//   const uploadsPath = path.join(process.cwd(), 'uploads');
//   logger.info(`Serving local uploads securely from: ${uploadsPath}`);

//   // This middleware will now handle all requests that are NOT for the API.
//   app.use((req, res, next) => {
//     // If the request is for the API, skip the file server logic.
//     if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
//       return next();
//     }

//     // For everything else (e.g., /thumbnails/..., /games/...),
//     // first run authentication.
//     authenticate(req, res, (err) => {
//       if (err) {
//         // If authentication fails, pass the error to the global error handler.
//         return next(err);
//       }
//       // If authentication succeeds, serve the file from the root of the 'uploads' directory.
//       express.static(uploadsPath)(req, res, next);
//     });
//   });
//   // -----------------------
// }

// if (process.env.NODE_ENV === 'development') {
//   const uploadsPath = path.join(process.cwd(), 'uploads');
//   logger.info(`Serving local uploads securely from: ${uploadsPath}`);

//   // This custom middleware will act as our secure file server.
//   app.use(async (req, res, next) => {
//     // 1. Let API requests pass through immediately.
//     if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
//       return next();
//     }

//     // 2. For any other request, first run authentication.
//     // We'll wrap `authenticate` in a promise to handle its async nature.
//     try {
//       await new Promise<void>((resolve, reject) => {
//         authenticate(req, res, (err) => {
//           if (err) return reject(err);
//           resolve();
//         });
//       });
//     } catch (authError) {
//       // If authentication fails, pass the error to the global error handler.
//       return next(authError);
//     }

//     // 3. If authentication succeeds, try to serve the file.
//     // The path needs to be decoded to handle spaces or special characters, e.g., 'My%20Game'.
//     const filePath = path.join(uploadsPath, decodeURIComponent(req.path));

//     try {
//       // Check if the file exists and is accessible.
//       await fs.access(filePath);

//       // If it exists, send the file. This stops the request chain.
//       res.sendFile(filePath);
//     } catch (fileError) {
//       // If fs.access throws, the file does not exist.
//       // Send a 404 response immediately. Do NOT call next().
//       // This prevents the request from falling through to the API router.
//       res.status(404).send('File not found');
//     }
//   });
// }

if (process.env.NODE_ENV === 'development') {
  const uploadsPath = path.join(process.cwd(), 'uploads');
  logger.info(`Serving local uploads securely from: ${uploadsPath}`);

  // This custom middleware will act as our secure file server.
  app.use(async (req, res, next) => {
    // 1. Let API requests pass through immediately.
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
      return next();
    }

    // 2. Only handle requests that start with /uploads
    if (!req.path.startsWith('/uploads')) {
      return next();
    }

    // 3. For upload requests, first run authentication.
    try {
      await new Promise<void>((resolve, reject) => {
        authenticate(req, res, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    } catch (authError) {
      // If authentication fails, pass the error to the global error handler.
      return next(authError);
    }

    // 4. If authentication succeeds, try to serve the file.
    // Strip the '/uploads' prefix from the path before joining with uploadsPath
    const relativePath = req.path.replace('/uploads', '');
    const filePath = path.join(uploadsPath, decodeURIComponent(relativePath));

    try {
      // Check if the file exists and is accessible.
      await fs.access(filePath);

      // If it exists, send the file. This stops the request chain.
      res.sendFile(filePath);
    } catch (fileError) {
      // If fs.access throws, the file does not exist.
      // Send a 404 response immediately. Do NOT call next().
      res.status(404).send('File not found');
    }
  });
}

// Input sanitization middleware
app.use(sanitizeInput);

// Initialize Sentry tracing (only in production)
app.use(sentryTracingHandler());

// Swagger documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'none',
    },
  })
);

// API Routes
app.use('/api', routes);

// Sentry error handler must be before other error middleware (only in production)
app.use(sentryErrorHandler());

// Error handling middleware
app.use(errorHandler);
logger.info(`Express application initialized in ${config.env} mode`);

export default app;
