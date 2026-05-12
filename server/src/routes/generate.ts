// import express from 'express';
// import { v4 as uuidv4 } from 'uuid';
// import { sendMessage } from '../services/kafka';

// const router = express.Router();

// router.post('/generate', async (req, res) => {
//     const {prompt, author } = req.body;

//     if (!prompt || !author) {
//         return res.status(400).json({error: "Prompt and Author are required."});
//     }

//     //unique id for the generation and date when started.
//     const jobId = uuidv4();
//     const timestamp = Date.now();

//     const jobData = {
//         jobId,
//         prompt,
//         author,
//         timestamp,
//         status: 'pending'
//     }

//     //sendind order to kafka
//     try {
//         await sendMessage('image_requests', jobData);
//         console.log(`Job ${jobId} sent to kafka`);

//         //response
//         res.status(202).json({
//             message: "Generation started",
//             jobId,
//         });
//     } catch (error) {
//         console.log("Kafka Producer Error:", error);
//         res.status(500).json({error: `Failed to queue image request`});
//     }
// })

// export default router;

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
        // Save initial job to MongoDB
        await Image.create({
            jobId,
            prompt,
            author,
            timestamp,
            status: 'pending',
        });

        // Send to Kafka
        await sendMessage('image_requests', { jobId, prompt, author, timestamp });
        console.log(`✅ Job ${jobId} queued successfully`);

        return res.status(202).json({
            message: "Image generation started",
            jobId,
        });

    } catch (error) {
        console.error("❌ Failed to queue job:", error);
        return res.status(500).json({ error: "Failed to queue image request" });
    }
});

// GET /api/status/:jobId
router.get('/status/:jobId', async (req: Request, res: Response) => {
    const jobIdParam = req.params.jobId;
    const jobId = Array.isArray(jobIdParam) ? jobIdParam[0] : jobIdParam;

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