import { Queue } from "bullmq";
import IORedis from "ioredis";


const connectToRedis = new IORedis({
   host: process.env.REDIS_HOST || 'localhost',
   port: parseInt(process.env.REDIS_PORT || '6379'),
   maxRetriesPerRequest: null, 
   lazyConnect: true,
});

connectToRedis.on('connect', () => {
   console.log('Redis connected successfully');
});

connectToRedis.on('error', (error) => {
   console.log('Redis connection error:', error);
});

export const commissionQueue = new Queue('commission', 
   {
   connection: connectToRedis
});

export const workerOptions = {
   connection: connectToRedis,
   concurrency: 5,
   removeOnComplete: { count: 50 },
   removeOnFail: { count: 100 },
}