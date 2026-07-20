import { Kafka } from 'kafkajs';
import fs from 'fs';
import path from 'path';
import { InferenceClient } from '@huggingface/inference';
import dotenv from 'dotenv';
import Image from '../models/Image';
import { uploadImageBuffer, isCloudinaryConfigured } from './cloudinary';

dotenv.config();

if (!process.env.HUGGINGFACE_API_KEY) {
    console.error("CRITICAL: HUGGINGFACE_API_KEY is missing in .env");
    process.exit(1);
}

const kafka = new Kafka({
    clientId: 'visionstream-worker',
    brokers: [process.env.KAFKA_BROKER!],
    ssl: {
        rejectUnauthorized: true,
        ca: [fs.readFileSync(process.env.KAFKA_CA_PATH!, 'utf-8')],
        key: fs.readFileSync(process.env.KAFKA_KEY_PATH!, 'utf-8'),
        cert: fs.readFileSync(process.env.KAFKA_CERT_PATH!, 'utf-8'),
    },
});

const consumer = kafka.consumer({ groupId: 'image-group', sessionTimeout: 90000 });

interface ImageJobMessage {
    jobId: string;
    prompt: string;
    author: string;
    timestamp: number;
}

const isValidJobMessage = (value: unknown): value is ImageJobMessage => {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return typeof v.jobId === 'string' &&
        typeof v.prompt === 'string' &&
        typeof v.author === 'string' &&
        typeof v.timestamp === 'number';
};

const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0';
const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

const generateImage = async (prompt: string): Promise<Buffer> => {
    const MAX_RETRIES = 3;
    const generationParams = {
        num_inference_steps: 20,
        guidance_scale: 7.5,
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Generating image... attempt ${attempt}/${MAX_RETRIES}`);

            const blob: Blob = await client.textToImage({
                model: HF_MODEL,
                inputs: prompt,
                parameters: generationParams,
            }) as unknown as Blob;

            const arrayBuffer = await blob.arrayBuffer();
            return Buffer.from(arrayBuffer);

        } catch (error: any) {
            const isAuthError = error?.message?.toLowerCase().includes('invalid username') ||
                error?.status === 401;

            if (isAuthError) {
                throw new Error("Hugging Face API Key is invalid or lacks permissions.");
            }

            const isLoading = error?.message?.includes('loading') || error?.status === 503;

            if (isLoading && attempt < MAX_RETRIES) {
                console.log(`Model loading, retrying in 15s... (${attempt}/${MAX_RETRIES})`);
                await new Promise((r) => setTimeout(r, 15000));
                continue;
            }

            throw new Error(`HF Error: ${error.message}`);
        }
    }

    throw new Error('HF model failed after all retries');
};

export const startConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({
            topic: 'image_requests',
            fromBeginning: false,
        });

        console.log('Worker is waiting for jobs...');

        await consumer.run({
            eachMessage: async ({ message }) => {
                const rawData = message.value?.toString();
                if (!rawData) return;

                let job: unknown;
                try {
                    job = JSON.parse(rawData);
                } catch (err) {
                    console.error('Skipping message — invalid JSON:', rawData);
                    return;
                }

                if (!isValidJobMessage(job)) {
                    console.error('Skipping message — missing required fields:', job);
                    return;
                }

                const { jobId, prompt, author, timestamp } = job;

                console.log(`Processing Job: ${jobId} | Prompt: "${prompt}"`);

                await Image.findOneAndUpdate(
                    { jobId },
                    { jobId, prompt, author, timestamp, status: 'processing' },
                    { upsert: true }
                );

                try {
                    const imageBuffer = await generateImage(prompt);

                    let imageUrl: string | null = null;

                    if (isCloudinaryConfigured()) {
                        const uploadResult = await uploadImageBuffer(imageBuffer, jobId);
                        imageUrl = uploadResult.secure_url;
                    } else {
                        const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
                        fs.mkdirSync(uploadsDir, { recursive: true });
                        const fileName = `${jobId}.png`;
                        const filePath = path.join(uploadsDir, fileName);
                        fs.writeFileSync(filePath, imageBuffer);
                        imageUrl = `/uploads/${fileName}`;
                        console.log(`Saved image locally: ${filePath} → ${imageUrl}`);
                    }

                    await Image.findOneAndUpdate(
                        { jobId },
                        { status: 'completed', imageUrl, completedAt: Date.now() }
                    );

                    console.log(`Job ${jobId} completed — ${imageBuffer.byteLength} bytes | ${imageUrl}`);

                } catch (err: any) {
                    console.error(`Job ${jobId} failed:`, err.message);

                    await Image.findOneAndUpdate(
                        { jobId },
                        { status: 'failed', error: err.message }
                    );
                }
            },
        });

    } catch (error) {
        console.error('Kafka Consumer Connection Error:', error);
        process.exit(1);
    }
};