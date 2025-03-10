import { cleanEnv, str, port, num, bool, url } from 'envalid';

export function validateEnv() {
  return cleanEnv(process.env, {
    // Server Configuration
    PORT: port({ default: 3000 }),
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    BASE_URL: url({ default: 'http://localhost:3000' }),

    // MongoDB Configuration
    MONGO_URI: str({ default: 'mongodb://localhost:27017/image-processing' }),
    MONGO_DB_NAME: str({ default: 'image-processing' }),

    // Redis Configuration
    REDIS_HOST: str({ default: 'localhost' }),
    REDIS_PORT: port({ default: 6379 }),
    REDIS_PASSWORD: str({ default: '' }),
    REDIS_TLS: bool({ default: false }),
    REDIS_URL: str({ default: 'redis://redis:6379' }),

    // File Upload Configuration
    MAX_FILE_SIZE: num({ default: 10485760 }), // 10MB in bytes
    ALLOWED_MIME_TYPES: str({ default: 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff' }),
    SUPPORTED_IMAGE_FORMATS: str({ default: 'jpeg,jpg,png,gif,webp,bmp,tiff' }),

    // Thumbnail Configuration
    THUMBNAIL_WIDTH: num({ default: 100 }),
    THUMBNAIL_HEIGHT: num({ default: 100 }),
    THUMBNAIL_MEDIUM_WIDTH: num({ default: 300 }),
    THUMBNAIL_MEDIUM_HEIGHT: num({ default: 300 }),
    THUMBNAIL_LARGE_WIDTH: num({ default: 600 }),
    THUMBNAIL_LARGE_HEIGHT: num({ default: 600 }),

    // Worker Configuration
    WORKER_CONCURRENCY: num({ default: 5 }),
    QUEUE_NAME: str({ default: 'image-processing' }),
    START_WORKER: bool({ default: true }),

    // Storage Configuration
    UPLOADS_DIR: str({ default: './uploads' }),
    TEMP_DIR: str({ default: './temp' }),

    // Logging Configuration
    LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'debug'], default: 'debug' }),
    LOG_ERROR_FILE: str({ default: './logs/error.log' }),
    LOG_COMBINED_FILE: str({ default: './logs/combined.log' }),
  });
}

export type Env = ReturnType<typeof validateEnv>;

// Create a singleton instance of the validated environment
export const env = validateEnv();