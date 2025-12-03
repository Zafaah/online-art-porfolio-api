import { Queue } from "bullmq";
import { connectToRedis } from "../config/redisdb";



export const commissionQueue = new Queue('commission', {
   connection:connectToRedis
})



export const workerOptions = {
   connection: connectToRedis,
   concurrency: 5,
   removeOnComplete: {count:0},
   removeOnFail: {count:0}
}