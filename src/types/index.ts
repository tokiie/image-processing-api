// Job Status and Types
export enum JobStatus {
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export enum ImageJobType {
    THUMBNAIL = 'thumbnail',
    // RESIZE = 'resize',
    // CROP = 'crop',
    // WATERMARK = 'watermark',
}

// Image Processing Types
export interface ImageJobOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
}

export interface ImageProcessingJobData {
    jobId: string;
    imagePath: string;
    userId: string;
    options: ImageJobOptions;
    jobType: ImageJobType;
}

export class ImageProcessingParams {
    constructor(
        public readonly inputPath: string,
        public readonly outputPath: string,
        public readonly jobType: ImageJobType,
        public readonly options: ImageJobOptions
    ) {
        // Validate required parameters
        if (!inputPath) throw new Error('Input path is required');
        if (!outputPath) throw new Error('Output path is required');
        if (!jobType) throw new Error('Job type is required');

        // Set default options if not provided
        this.options = {
            width: options?.width || parseInt(process.env.THUMBNAIL_WIDTH || '100'),
            height: options?.height || parseInt(process.env.THUMBNAIL_HEIGHT || '100'),
            quality: options?.quality || 80,
            format: options?.format || 'jpeg',
            ...options
        };
    }

    // Helper methods
    getOutputDirectory(): string {
        return require('path').dirname(this.outputPath);
    }

    getOutputFilename(): string {
        return require('path').basename(this.outputPath);
    }

    // Factory methods
    static createThumbnail(inputPath: string, outputPath: string, options?: Partial<ImageJobOptions>): ImageProcessingParams {
        return new ImageProcessingParams(
            inputPath,
            outputPath,
            ImageJobType.THUMBNAIL,
            options || {}
        );
    }
}

// Database Types
export interface ImageJob {
    userId: string;
    originalImagePath: string;
    resultImageUrl?: string;
    jobType: ImageJobType;
    options: ImageJobOptions;
    status: JobStatus;
    progress: number;
    error?: string;
    createdAt?: Date;
    updatedAt?: Date;
    originalFilename?: string;
}

export interface ImageJobDocument extends Document, ImageJob {}

// Queue Types
export interface QueueJobOptions {
    attempts?: number;
    backoff?: {
        type: 'exponential' | 'fixed';
        delay: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
    delay?: number;
    jobId?: string;
    priority?: number;
}

// File Types
export interface FileUploadOptions {
    maxSize?: number;
    allowedMimeTypes?: string[];
    supportedFormats?: string[];
}
// Pagination Types
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}