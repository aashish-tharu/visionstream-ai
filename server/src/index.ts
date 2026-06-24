import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import dotenv from "dotenv";
import generateRoutes from './routes/generate';
import { startConsumer } from './services/consumer';
import { connectProducer } from './services/kafka';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', generateRoutes);

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
    res.status(200).json({ message: "Server is healthy!" }); // fixed typo "Sever"
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log("Database connected successfully");

        await connectProducer();

        // IMPORTANT: startConsumer() internally calls consumer.run(), whose
        // returned promise never resolves (it's a long-running message loop).
        // Awaiting it here blocks app.listen() forever. Fire-and-forget it
        // instead, but still catch errors so a consumer crash doesn't get lost.
        startConsumer().catch((err) => {
            console.error("❌ Kafka consumer crashed:", err);
        });

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Startup failed:", err);
        process.exit(1);
    }
};

startServer();