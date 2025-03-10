import { Worker, Queue, Job } from 'bullmq';
import { ImageProcessingService } from '../services/ImageProcessingService';
import { StorageService } from '../services/StorageService';
import ImageJobModel from '../models/ImageJob';
import { JobStatus } from '../types';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.config';
import { logger } from '../config/logger';
import { ImageProcessingJobData, ImageProcessingParams } from '../types';

/**
 * Creates and configures a BullMQ worker for image processing
 */
export async function createImageProcessingWorker(
  queueName: string,
  redisConnection: any,
  concurrency: number = 5
): Promise<Worker> {
  // Initialize services
  const imageService = new ImageProcessingService();
  const storageService = new StorageService();
  const queue = new Queue(queueName, { connection: redisConnection });

  // Find and retry stuck jobs before starting the worker
  await retryStuckJobs(queue);

  // Create and configure the worker
  const worker = new Worker(
    queueName,
    async (job) => await processImageJob(job, imageService, storageService),
    {
      connection: redisConnection,
      concurrency,
      autorun: true,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 }
    }
  );

  // Register event handlers
  registerWorkerEventHandlers(worker);

  return worker;
}

/**
 * Process an individual image job
 */
async function processImageJob(
  job: Job,
  imageService: ImageProcessingService,
  storageService: StorageService
) {
  try {
    const imageJobData: ImageProcessingJobData = job.data;

    // Update job status to processing and set initial progress
    await updateJobStatus(imageJobData.jobId, JobStatus.PROCESSING, 30);
    await job.updateProgress(30);

    // Create temporary directory for processing
    const tempDir = createTempDirectory(imageJobData.jobId);

    logger.info(`Temp directory created ${tempDir}`);
    logger.info(`Trying to process image ${imageJobData.imagePath} with arguments ${imageJobData.jobId} ${imageJobData.jobType} ${imageJobData.options}`);
    // Process the image
    const outputPath = await processImage(
      imageService,
      tempDir,
      imageJobData
    );

    logger.info(`Processing image ${outputPath}`);
    // Update progress after processing
    await job.updateProgress(70);
    await updateJobStatus(imageJobData.jobId, null, 70);

    // Upload the processed image
    const resultImageUrl = await uploadProcessedImage(
      storageService,
      outputPath,
      imageJobData.userId,
    );

    logger.info(`Uploading processed image ${resultImageUrl}`);

    // Complete the job
    await job.updateProgress(100);
    await updateJobStatus(
      imageJobData.jobId,
      JobStatus.COMPLETED,
      100,
      { resultImageUrl }
    );

    logger.info(`Job completed ${imageJobData.jobId}`);

    // Clean up temporary files
    cleanupTempFiles(tempDir, imageJobData.jobId);

    logger.info(`Job cleaned up ${imageJobData.jobId}`);

    return {
      jobId: imageJobData.jobId,
      resultImageUrl
    };
  } catch (error: any) {
    // Update job status to failed
    await updateJobStatus(
      job.data.jobId,
      JobStatus.FAILED,
      null,
      { error: error.message }
    );

    throw error;
  }
}

/**
 * Update job status in the database
 */
async function updateJobStatus(
  jobId: string,
  status: JobStatus | null,
  progress: number | null = null,
  additionalData: Record<string, any> = {}
) {
  const updateData: Record<string, any> = {};

  if (status !== null) {
    updateData.status = status;
  }

  if (progress !== null) {
    updateData.progress = progress;
  }

  // Merge any additional data
  Object.assign(updateData, additionalData);

  await ImageJobModel.findByIdAndUpdate(jobId, updateData);
}

/**
 * Create a temporary directory for image processing
 */
function createTempDirectory(jobId: string): string {
  const tempDir = path.join(env.TEMP_DIR, jobId);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Process the image using the image service
 */
async function processImage(
  imageService: ImageProcessingService,
  tempDir: string,
  imageJobData: ImageProcessingJobData
): Promise<string> {
  const { jobId, imagePath, options } = imageJobData;
  const outputFileName = `${jobId}_thumbnail${path.extname(imagePath)}`;
  const outputPath = path.join(tempDir, outputFileName);

  // Create processing params using the factory method
  const processingParams = ImageProcessingParams.createThumbnail(
    imagePath,
    outputPath,
    options
  );

  // Process the image with the params object
  return await imageService.processImage(processingParams);
}

/**
 * Upload the processed image to storage
 */
async function uploadProcessedImage(
  storageService: StorageService,
  outputPath: string,
  userId: string,
): Promise<string> {
  const outputFileName = path.basename(outputPath);
  return await storageService.uploadFile(
    outputPath,
    `thumbnails/${userId}/${outputFileName}`
  );
}

/**
 * Clean up temporary files after processing
 */
function cleanupTempFiles(tempDir: string, jobId: string): void {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (cleanupError) {
    logger.warn(`Failed to clean up temp directory for job ${jobId}:`, cleanupError);
  }
}

/**
 * Register event handlers for the worker
 */
function registerWorkerEventHandlers(worker: Worker): void {
  worker.on('completed', async (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', async (job, error) => {
    logger.error(`Job ${job?.id} failed with error: ${error.message}`);
  });
}

/**
 * Find and retry jobs that are stuck in PROCESSING status
 */
async function retryStuckJobs(queue: Queue) {
  const processingJobs = await ImageJobModel.find({ status: JobStatus.PROCESSING });
  logger.info(`Found ${processingJobs.length} jobs in PROCESSING status that need to be retried`);

  for (const job of processingJobs) {
    logger.info(`Re-queueing job ${job._id}`);
    try {
      await queue.add('process-image', {
        jobId: job._id,
        originalImagePath: job.originalImagePath,
        jobType: job.jobType,
        options: job.options,
        userId: job.userId
      }, {
        jobId: `retry-${job._id}`,
        removeOnComplete: true,
        removeOnFail: true
      });

      logger.info(`Successfully re-queued job ${job._id}`);
    } catch (error) {
      logger.error(`Failed to re-queue job ${job._id}:`, error);
    }
  }
}