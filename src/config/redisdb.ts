import IORedis from "ioredis";


export const connectToRedis = new IORedis({
   host: process.env.REDIS_HOST || 'localhost',
   port: parseInt(process.env.REDIS_PORT || '6379'),
   maxRetriesPerRequest: null,
});
console.log('Redis connected successfully ');
 
   
