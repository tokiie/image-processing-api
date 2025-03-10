import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ImageJobOptions, ImageJobType, ImageProcessingParams } from '../types';
import { logger } from '../config/logger';

export class ImageProcessingService {
  async processImage(params: ImageProcessingParams): Promise<string> {
    const outputDir = params.getOutputDirectory();
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let pipeline = sharp(params.inputPath);

    if (params.jobType === ImageJobType.THUMBNAIL) {
      pipeline = pipeline.resize({
        width: params.options.width,
        height: params.options.height,
        fit: 'cover',
        position: 'center'
      });

      // Apply quality if specified
      if (params.options.quality) {
        pipeline = pipeline.jpeg({ quality: params.options.quality });
      }
    } else {
      throw new Error(`Unsupported job type: ${params.jobType}`);
    }

    await pipeline.toFile(params.outputPath);
    logger.info(`Image processed successfully: ${params.outputPath}`);

    return params.outputPath;
  }

  // Check if the image is valid
  async isValidImage(imagePath: string, jobType: ImageJobType): Promise<boolean> {
    switch (jobType) {
      case ImageJobType.THUMBNAIL:
        return await this.isValidThumbnailImage(imagePath);
      default:
        return true;
    }
  }

  // Check if the image is valid for the thumbnail job
  async isValidThumbnailImage(imagePath: string): Promise<boolean> {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      // Return boolean explicitly to avoid undefined
      return !!(metadata && metadata.width && metadata.height && metadata.width > 100 && metadata.height > 100);
    } catch (error) {
      logger.error('Error validating image', error);
      return false;
    }
  }
}


