import { Queue } from "bullmq";
import { connectToRedis } from "../config/redisdb";


export const commissionQueue = async () => {
   const redis = await connectToRedis();
   return new Queue('commission', {
      connection: redis,
   });
}

export const workerOptions = {
   connection: await connectToRedis(), 
   concurrency: 5,
   removeOnComplete: { count: 50 },
   removeOnFail: { count: 100 },
}