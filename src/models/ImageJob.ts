import mongoose, { Schema } from 'mongoose';
import { JobStatus, ImageJobType, ImageJobDocument } from '../types';


const ImageJobSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    originalImagePath: { type: String, required: true },
    resultImageUrl: { type: String },
    jobType: {
      type: String,
      enum: Object.values(ImageJobType),
      required: true
    },
    options: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PROCESSING
    },
    progress: { type: Number, default: 0 },
    error: { type: String },
    originalFilename: { type: String }  // Added to store the original filename
  },
  { timestamps: true }
);

export default mongoose.model<ImageJobDocument>('ImageJob', ImageJobSchema);