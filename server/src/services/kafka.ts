import { Kafka } from 'kafkajs';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
    clientId: 'visionstream-app',
    brokers: [process.env.KAFKA_BROKER!],
    ssl: {
        rejectUnauthorized: true,
        ca: [fs.readFileSync(process.env.KAFKA_CA_PATH!, 'utf-8')],
        key: fs.readFileSync(process.env.KAFKA_KEY_PATH!, 'utf-8'),
        cert: fs.readFileSync(process.env.KAFKA_CERT_PATH!, 'utf-8'),
    },
});

const producer = kafka.producer();

export const connectProducer = async () => {
    try {
        await producer.connect();
        console.log('✅ Kafka Producer Connected');
    } catch (error) {
        console.error('❌ Kafka Connection Error:', error);
        throw error; // Prevents the server from booting if Kafka is down
    }
};

export const sendMessage = async (topic: string, message: any) => {
    try {
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
    } catch (error) {
        console.error('❌ Error sending message to Kafka:', error);
        throw error; // Lets the Express router know the queue failed
    }
};