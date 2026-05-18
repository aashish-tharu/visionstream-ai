import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('❌ CRITICAL: Cloudinary configuration is missing in .env');
    process.exit(1);
}

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

export const uploadImageBuffer = async (
    buffer: Buffer,
    publicId?: string,
    folder = 'visionstream-ai',
): Promise<UploadApiResponse> => {
    const base64Data = buffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64Data}`;

    return cloudinary.uploader.upload(dataUri, {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        format: 'png',
    });
};
