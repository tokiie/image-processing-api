//  isValidImage

import sharp from "sharp";
import { ImageJobType } from "../types";

export async function isValidImage(imagePath: string, jobType: ImageJobType): Promise<boolean> {
  // Depending on the job type, we need to check the image size
  if (jobType === ImageJobType.THUMBNAIL) {
    // check the resolution of the image
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      // Convert to explicit boolean with !! to avoid undefined
      return !!(metadata && metadata.width && metadata.height && metadata.width >= 100 && metadata.height >= 100);
    } catch (error) {
      return false;
    }
  }

  return true;
}
