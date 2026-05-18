import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sendMessage } from '../services/kafka';
import Image from '../models/Image';

const router = express.Router();

// POST /api/generate
router.post('/generate', async (req: Request, res: Response) => {
    const { prompt, author } = req.body;

    if (!prompt || !author) {
        return res.status(400).json({ error: "Prompt and Author are required." });
    }

    const jobId = uuidv4();
    const timestamp = Date.now();

    try {
        // 1. Save initial job to MongoDB
        await Image.create({
            jobId,
            prompt,
            author,
            timestamp,
            status: 'pending',
        });

        // 2. Send to Kafka
        await sendMessage('image_requests', { jobId, prompt, author, timestamp });
        console.log(`✅ Job ${jobId} queued successfully`);

        return res.status(202).json({
            message: "Image generation started",
            jobId,
        });

    } catch (error) {
        console.error(`❌ Failed to queue job ${jobId}:`, error);

        // 3. Prevent DB job from getting permanently stuck if Kafka fails
        await Image.findOneAndUpdate(
            { jobId },
            { status: 'failed', error: 'Failed to reach message queue' }
        );

        return res.status(500).json({ error: "Failed to queue image request" });
    }
});

// GET /api/status/:jobId
router.get('/status/:jobId', async (req: Request, res: Response) => {
    const jobId = req.params.jobId;

    if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
    }

    try {
        const job = await Image.findOne({ jobId });

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        return res.status(200).json({
            jobId: job.jobId,
            status: job.status,
            prompt: job.prompt,
            author: job.author,
            imageUrl: job.imageUrl || null,
            error: job.error || null,
            timestamp: job.timestamp,
            completedAt: job.completedAt || null,
        });

    } catch (error) {
        console.error("❌ Failed to fetch job status:", error);
        return res.status(500).json({ error: "Failed to fetch job status" });
    }
});

export default router;

// GET /api/images
router.get('/images', async (req: Request, res: Response) => {
    try {
        const images = await Image.find({ status: 'completed' }).sort({ completedAt: -1 });

        return res.status(200).json(images.map(img => ({
            _id: img._id,
            prompt: img.prompt,
            author: img.author,
            imageUrl: img.imageUrl,
            createdAt: img.completedAt,
        })));

    } catch (error) {
        console.error("❌ Failed to fetch images:", error);
        return res.status(500).json({ error: "Failed to fetch images" });
    }
});