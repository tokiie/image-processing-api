import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { env } from '../config/env.config';

const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);

export class StorageService {
  async uploadFile(sourcePath: string, destinationKey: string): Promise<string> {
    const targetDir = path.join(env.UPLOADS_DIR, path.dirname(destinationKey));
    await mkdir(targetDir, { recursive: true });

    const destPath = path.join(env.UPLOADS_DIR, destinationKey);
    await copyFile(sourcePath, destPath);

    return `${env.BASE_URL}/uploads/${destinationKey}`;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(env.UPLOADS_DIR, key);
    if (fs.existsSync(filePath)) {
      await promisify(fs.unlink)(filePath);
    }
  }
}
