import mongoose from 'mongoose';
import { app } from './app';
import { env } from './config/env.config';
import { createImageProcessingWorker } from './workers/workerFactory';
import { redisConnection } from './config/redis';
import { logger } from './config/logger';

/**
 * Connect to the MongoDB database
 */
export async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('✅ Connected to MongoDB');
  } catch (err) {
    logger.error('❌ MongoDB connection error:', err);
    throw err; // Allow caller to handle this
  }
}

/**
 * Start the image processing worker if enabled in config
 */
export function startWorker(concurrency: number = 5): void {
  if (env.START_WORKER) {
    const worker = createImageProcessingWorker(
      'image-processing',
      redisConnection,
      concurrency
    );

    logger.info('⚡ Image processing worker started');
  }
}

/**
 * Start the HTTP server
 */
export function startServer(port: number = env.PORT ? Number(env.PORT) : 3000): void {
  app.listen(port, () => {
    logger.info(`🚀 Server running on port ${port}`);
  });
}

/**
 * Bootstrap the entire application
 */
export async function bootstrap(): Promise<void> {
  try {
    await connectToDatabase();
    startWorker(env.WORKER_CONCURRENCY || 5);
    startServer();
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application if this file is executed directly
if (require.main === module) {
  bootstrap();
}