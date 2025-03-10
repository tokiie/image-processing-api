import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapp';

class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('🟢 Using existing database connection');
      return;
    }

    try {
      await mongoose.connect(MONGO_URI);

      this.isConnected = true;
      logger.info('✅ MongoDB Connected...');
    } catch (error) {
      logger.error('❌ MongoDB Connection Failed:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.info('⚠️ No active database connection to close.');
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('🔴 MongoDB Disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting from MongoDB:', error);
    }
  }
}

export const db = Database.getInstance();