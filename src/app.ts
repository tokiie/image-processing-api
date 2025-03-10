import express, { NextFunction, Request, Response } from 'express';
import imageProcessingRoutes from './routes/imageProcessing';
import { env } from './config/env.config';
import { logger } from './config/logger';

/**
 * Configure request logging middleware
 */
export function setupLogging(app: express.Application): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.httpRequest(req);
    next();
  });
}

/**
 * Configure standard middleware
 */
export function setupMiddleware(app: express.Application): void {
  app.use(express.json());
}

/**
 * Configure static file serving
 */
export function setupStaticFiles(app: express.Application): void {
  app.use('/uploads', express.static(env.UPLOADS_DIR));
}

/**
 * Configure API routes
 */
export function setupRoutes(app: express.Application): void {
  app.use('/api/image-processing', imageProcessingRoutes);
}

/**
 * Configure global error handling
 */
export function setupErrorHandling(app: express.Application): void {
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.errorWithStack(err, 'Error in request handler');

    if (res.headersSent) {
      return next(err);
    }

    res.status(500).json({
      error: err.message || 'Internal Server Error',
      status: 500
    });
  });
}

/**
 * Configure and set up the entire Express application
 */
export function setupApp(): express.Application {
  const app = express();

  // Apply all setup functions in sequence
  setupLogging(app);
  setupMiddleware(app);
  setupStaticFiles(app);
  setupRoutes(app);
  setupErrorHandling(app);

  return app;
}

// Create and export the configured Express application
export const app = setupApp();