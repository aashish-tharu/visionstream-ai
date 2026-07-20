import mongoose, { Document, Schema } from 'mongoose';

export interface IImage extends Document {
    jobId: string;
    prompt: string;
    author: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    imageUrl: string | null;
    error: string | null;
    timestamp: number;
    completedAt: number | null;
}

const ImageSchema = new Schema<IImage>({
    jobId: { type: String, required: true, unique: true },
    prompt: { type: String, required: true },
    author: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    imageUrl: { type: String, default: null },
    error: { type: String, default: null },
    timestamp: { type: Number },
    completedAt: { type: Number, default: null, index: true },
}, { timestamps: true });

export default mongoose.model<IImage>('Image', ImageSchema);