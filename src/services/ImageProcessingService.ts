import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ImageJobOptions, ImageJobType } from '../types';
import { logger } from '../config/logger';

export class ImageProcessingService {
  async processImage(
    inputPath: string,
    outputPath: string,
    jobType: ImageJobType,
    options: ImageJobOptions
  ): Promise<string> {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
//
    let pipeline = sharp(inputPath);

    if (jobType === ImageJobType.THUMBNAIL) {
      pipeline = pipeline.resize({
        width: options.width || parseInt(process.env.THUMBNAIL_WIDTH || '100'),
        height: options.height || parseInt(process.env.THUMBNAIL_HEIGHT || '100'),
        fit: 'cover',
        position: 'center'
      });
    } else {
      throw new Error(`Unsupported job type: ${jobType}`);
    }

    await pipeline.toFile(outputPath);

    return outputPath;
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


