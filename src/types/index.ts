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