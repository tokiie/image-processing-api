import { Request, Response } from 'express';
import { ImageProcessingService } from '../services/ImageProcessingService';
import { QueueServiceWrapper } from '../services/QueueService';
import ImageJobModel from '../models/ImageJob';
import { JobStatus, ImageJobType, ImageProcessingJobData } from '../types';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { env } from '../config/env.config';

export class ImageProcessingController {
  private queueServiceInstance: QueueServiceWrapper;
  private imageProcessingService: ImageProcessingService;

  constructor(queueService: QueueServiceWrapper) {
    this.queueServiceInstance = queueService;
    this.imageProcessingService = new ImageProcessingService();
    this.createJob = this.createJob.bind(this);
    this.getJobStatus = this.getJobStatus.bind(this);
    this.getUserJobs = this.getUserJobs.bind(this);
    logger.info('ImageProcessingController initialized');
  }

  async createJob(req: Request, res: Response): Promise<void> {
    try {
      const validationError = await this.validateCreateJobRequest(req);
      if (validationError) {
        res.status(400).json(validationError);
        return;
      }

      const imageJob = await this.createImageJobRecord(req);
      await this.queueImageProcessingJob(imageJob);

      res.status(201).json({
        jobId: imageJob._id,
        status: JobStatus.PROCESSING,
        originalFilename: req.file?.originalname
      });
    } catch (error) {
      logger.error('Error creating job:', error);
      res.status(500).json({
        error: 'Failed to create job',
        status: 500
      });
    }
  }

  private async validateCreateJobRequest(req: Request): Promise<{ error: string } | null> {
    const { userId } = req.body;

    if (!userId) {
      logger.warn('Missing userId in request');
      return { error: 'Missing required fields' };
    }

    if (!req.file) {
      logger.warn('No file uploaded in request');
      return { error: 'No file uploaded' };
    }

    // Check if image is valid
    const isValid = await this.imageProcessingService.isValidImage(req.file.path, ImageJobType.THUMBNAIL);
    if (!isValid) {
      return { error: 'Invalid image' };
    }

    return null;
  }

  private async createImageJobRecord(req: Request) {
    const { userId, options = {} } = req.body;
    const imageJob = new ImageJobModel({
      userId,
      originalImagePath: req.file?.path,
      originalFilename: req.file?.originalname,
      jobType: ImageJobType.THUMBNAIL,
      options: options || {},
      status: JobStatus.PROCESSING,
      progress: 0
    });

    await imageJob.save();
    logger.info('Image job record created', { jobId: imageJob._id });
    return imageJob;
  }

  private async queueImageProcessingJob(imageJob: any) {
    logger.debug('Adding job to queue', {
      jobId: imageJob._id,
      queueName: env.QUEUE_NAME,
      jobType: 'thumbnail'
    });

    await this.queueServiceInstance.addJob<ImageProcessingJobData>('image-processing', 'thumbnail', {
      jobId: imageJob._id.toString(),
      imagePath: imageJob.originalImagePath,
      userId: imageJob.userId,
      options: imageJob.options,
      jobType: imageJob.jobType
    });

    logger.info('Job successfully queued', { jobId: imageJob._id });
  }

  async getJobStatus(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params;
    logger.info(`Getting job status for jobId: ${jobId}`);

    try {
      if (!this.isValidJobId(jobId)) {
        res.status(404).json({ error: 'Invalid job ID format' });
        return;
      }

      const job = await this.findJob(jobId);
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      const queueStatus = await this.getQueueStatus(jobId);
      res.status(200).json(this.formatJobResponse(job, queueStatus));
    } catch (error: any) {
      logger.error(`Failed to get job status for jobId: ${jobId}`, { error });
      res.status(500).json({ error: 'Failed to get job status', message: error.message });
    }
  }

  private isValidJobId(jobId: string): boolean {
    return mongoose.Types.ObjectId.isValid(jobId);
  }

  private async findJob(jobId: string) {
    return await ImageJobModel.findById(jobId);
  }

  private async getQueueStatus(jobId: string) {
    logger.debug('Fetching queue status', { jobId });
    return await this.queueServiceInstance.getJobStatus('image-processing', jobId);
  }

  private formatJobResponse(job: any, queueStatus: any) {
    return {
      jobId: job._id.toString(),
      userId: job.userId,
      originalFilename: job.originalFilename,
      resultImageUrl: job.resultImageUrl,
      jobType: job.jobType,
      options: job.options,
      status: job.status,
      progress: job.progress,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      queueInfo: queueStatus
    };
  }

  async getUserJobs(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { status, limit = '20', page = '1' } = req.query || {};

    logger.info('Getting user jobs', { userId, status, limit, page });

    try {
      const query = this.buildUserJobsQuery(userId, status as JobStatus);
      const { jobs, total } = await this.fetchUserJobs(query, Number(page), Number(limit));

      res.status(200).json({
        jobs,
        pagination: this.buildPaginationResponse(Number(page), Number(limit), total)
      });
    } catch (error: any) {
      logger.error('Error getting user jobs:', { userId, error });
      res.status(500).json({ error: 'Failed to get user jobs', message: error.message });
    }
  }

  private buildUserJobsQuery(userId: string, status?: JobStatus) {
    const query: any = { userId };
    if (status && Object.values(JobStatus).includes(status)) {
      query.status = status;
    }
    return query;
  }

  private async fetchUserJobs(query: any, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      ImageJobModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ImageJobModel.countDocuments(query)
    ]);

    return { jobs, total };
  }

  private buildPaginationResponse(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
  }
}
