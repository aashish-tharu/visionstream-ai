import { Kafka } from 'kafkajs';
import fs from 'fs';
import { InferenceClient } from '@huggingface/inference';
import dotenv from 'dotenv';
import Image from '../models/Image';

dotenv.config();

// ---- Kafka Setup ----
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

const consumer = kafka.consumer({ groupId: 'image-group' });

// ---- HuggingFace Setup ----
const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

// ---- Image Generation with Retry ----
const generateImage = async (prompt: string): Promise<Buffer> => {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`🎨 Generating image... attempt ${attempt}/${MAX_RETRIES}`);

            const blob: Blob = await client.textToImage({
                model: 'stabilityai/stable-diffusion-2-1',
                inputs: prompt,
                parameters: {
                    num_inference_steps: 20,
                    guidance_scale: 7.5,
                },
            }) as unknown as Blob; // 👈 force correct type

            const arrayBuffer = await blob.arrayBuffer();
            return Buffer.from(arrayBuffer);

        } catch (error: any) {
            const isLoading = error?.message?.includes('loading') || error?.status === 503;

            if (isLoading && attempt < MAX_RETRIES) {
                console.log(`⏳ Model loading, retrying in 15s... (${attempt}/${MAX_RETRIES})`);
                await new Promise((r) => setTimeout(r, 15000));
                continue;
            }

            throw new Error(`HF Error: ${error.message}`);
        }
    }

    throw new Error('HF model failed after all retries');
};

// ---- Kafka Consumer ----
export const startConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({
            topic: 'image_requests',
            fromBeginning: false,
        });

        console.log('✅ Worker is waiting for jobs...');

        await consumer.run({
            eachMessage: async ({ message }) => {
                const rawData = message.value?.toString();
                if (!rawData) return;

                const job = JSON.parse(rawData);
                const { jobId, prompt, author, timestamp } = job;

                console.log(`🔄 Processing Job: ${jobId} | Prompt: "${prompt}" | Author: ${author}`);

                await Image.findOneAndUpdate(
                    { jobId },
                    { jobId, prompt, author, timestamp, status: 'processing' },
                    { upsert: true, returnDocument: 'after' }
                );

                try {
                    const imageBuffer = await generateImage(prompt);
                    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

                    // Mark job as completed
                    await Image.findOneAndUpdate(
                        { jobId },
                        { status: 'completed', imageUrl: base64Image, completedAt: Date.now() },
                        { returnDocument: 'after' }
                    );

                    console.log(`✅ Job ${jobId} completed — ${imageBuffer.byteLength} bytes`);

                } catch (err: any) {
                    console.error(`❌ Job ${jobId} failed:`, err.message);

                    await Image.findOneAndUpdate(
                        { jobId },
                        { status: 'failed', error: err.message },
                        { returnDocument: 'after' }
                    );
                }
            },
        });

    } catch (error) {
        console.error('❌ Kafka Consumer Connection Error:', error);
        process.exit(1);
    }
};