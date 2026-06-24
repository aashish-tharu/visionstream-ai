import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

type CloudinaryConfig = {
    cloud_name: string;
    api_key: string;
    api_secret: string;
};

const parseCloudinaryUrl = (url: string): CloudinaryConfig | null => {
    const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) {
        return null;
    }

    const [, api_key, api_secret, cloud_name] = match;
    if (!api_key || !api_secret || !cloud_name) {
        return null;
    }

    return {
        cloud_name,
        api_key,
        api_secret,
    };
};

const cloudinaryCloudName = CLOUDINARY_CLOUD_NAME ?? '';
const cloudinaryApiKey = CLOUDINARY_API_KEY ?? '';
const cloudinaryApiSecret = CLOUDINARY_API_SECRET ?? '';

const cloudinaryConfig: CloudinaryConfig | null = CLOUDINARY_URL
    ? parseCloudinaryUrl(CLOUDINARY_URL)
    : (cloudinaryCloudName || cloudinaryApiKey || cloudinaryApiSecret)
        ? {
            cloud_name: cloudinaryCloudName,
            api_key: cloudinaryApiKey,
            api_secret: cloudinaryApiSecret,
        }
        : null;

const configured = Boolean(cloudinaryConfig && cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret);

if (configured && cloudinaryConfig) {
    cloudinary.config(cloudinaryConfig);
} else {
    console.warn('⚠️ Cloudinary not configured. Uploads will fall back to local storage.');
}

export const isCloudinaryConfigured = () => configured;

export const uploadImageBuffer = async (
    buffer: Buffer,
    publicId?: string,
    folder = 'visionstream-ai',
): Promise<UploadApiResponse> => {
    const base64Data = buffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64Data}`;

    const uploadOptions: Record<string, unknown> = {
        folder,
        overwrite: true,
        resource_type: 'image',
        format: 'png',
    };

    if (publicId) {
        uploadOptions.public_id = publicId;
    }

    return cloudinary.uploader.upload(dataUri, uploadOptions);
};
