import { Queue, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { logger } from '../config/logger';

// Define allowed queue names for type safety
export type QueueName = 'image-processing' | 'test';

export class QueueError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'QueueError';
  }
}

export class QueueServiceWrapper {
  private static instance: QueueServiceWrapper;
  private queues: Map<string, Queue>;
  private isInitialized: boolean;

  private constructor() {
    this.queues = new Map();
    this.isInitialized = false;
    this.initialize();
    logger.info('QueueServiceWrapper instance created');
  }

  private initialize() {
    try {
      logger.info('Initializing QueueServiceWrapper...');
      // Initialize the image processing queue
      const imageProcessingQueue = new Queue('image-processing', { connection: redisConnection });
      this.queues.set('image-processing', imageProcessingQueue);
      this.isInitialized = true;
      logger.info('QueueServiceWrapper initialized successfully with image-processing queue');
    } catch (error) {
      this.isInitialized = false;
      logger.error('Failed to initialize QueueServiceWrapper:', { error });
      throw new QueueError('Failed to initialize queue service', error);
    }
  }

  public static getInstance(): QueueServiceWrapper {
    if (!QueueServiceWrapper.instance) {
      logger.info('Creating new QueueServiceWrapper instance');
      QueueServiceWrapper.instance = new QueueServiceWrapper();
    }
    return QueueServiceWrapper.instance;
  }

  private validateInitialization() {
    if (!this.isInitialized) {
      logger.error('Queue service not initialized');
      throw new QueueError('Queue service not initialized. Check Redis connection.');
    }
  }

  public getQueue(queueName: QueueName): Queue {
    logger.info('Getting queue', { queueName });

    try {
      this.validateInitialization();

      let queue = this.queues.get(queueName);

      if (!queue) {
        logger.info('Creating new queue', { queueName });
        queue = new Queue(queueName, { connection: redisConnection });
        this.queues.set(queueName, queue);
        logger.info('Queue created successfully', { queueName });
      }

      return queue;
    } catch (error) {
      const message = `Failed to get or create queue: ${queueName}`;
      logger.error(message, { error });
      throw new QueueError(message, error);
    }
  }

  public async addJob<T>(queueName: QueueName, jobName: string, data: T, opts = {}): Promise<Job<T>> {
    logger.info('Adding job to queue', { queueName, jobName, data, opts });

    try {
      this.validateInitialization();

      const queue = this.getQueue(queueName);
      const job = await queue.add(jobName, data, opts);
      logger.info('Job added successfully', { queueName, jobName, jobId: job.id });
      return job;
    } catch (error) {
      const message = `Failed to add job to queue ${queueName}`;
      logger.error(message, { error, queueName, jobName });
      throw new QueueError(message, error);
    }
  }

  public async getJobStatus(queueName: QueueName, jobId: string): Promise<string | null> {
    logger.info('Getting job status', { queueName, jobId });

    try {
      this.validateInitialization();

      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);

      if (!job) {
        logger.warn('Job not found', { queueName, jobId });
        return null;
      }

      const [isCompleted, isFailed, isActive, isDelayed, isWaiting] = await Promise.all([
        job.isCompleted(),
        job.isFailed(),
        job.isActive(),
        job.isDelayed(),
        job.isWaiting()
      ]);

      let status = 'unknown';
      if (isFailed) status = 'failed';
      else if (isCompleted) status = 'completed';
      else if (isActive) status = 'active';
      else if (isDelayed) status = 'delayed';
      else if (isWaiting) status = 'waiting';

      logger.info('Job status retrieved', { queueName, jobId, status });
      return status;
    } catch (error) {
      const message = `Failed to get job status for jobId: ${jobId} in queue: ${queueName}`;
      logger.error(message, { error, queueName, jobId });
      throw new QueueError(message, error);
    }
  }
}

// Export a Singleton instance of QueueServiceWrapper
export const QueueService = QueueServiceWrapper.getInstance();