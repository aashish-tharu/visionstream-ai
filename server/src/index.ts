// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from "dotenv";
// import generateRoutes from './routes/generate';
// import { startConsumer } from './services/consumer';
// import { connectProducer } from './services/kafka';

// dotenv.config();

// const app = express();

// // middleware
// app.use(cors());
// app.use(express.json());
// app.use('/api', generateRoutes);

// const PORT = process.env.PORT || 5000;

// mongoose.connect(process.env.MONGODB_URI!)
//     .then(() => { console.log("Database connected successfully") })
//     .catch((err) => { console.log("Database connection error: ", err) });

// // sample test route
// app.get('/health', (req, res) => {
//     res.status(200).json({ message: "Sever is healthy!" });
// })


// const startServer = async () => {
//     await connectProducer();
//     await startConsumer();

//     app.listen(PORT, () => {
//         console.log(`Server is running on http://localhost:${PORT}`);
//     })
// }

// startServer();

// server.ts - FIXED
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from "dotenv";
import generateRoutes from './routes/generate';
import { startConsumer } from './services/consumer';
import { connectProducer } from './services/kafka'; 

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
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
        await startConsumer();

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Startup failed:", err);
        process.exit(1);
    }
};

startServer();