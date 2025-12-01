import IORedis from "ioredis";


export const connectToRedis = async () => {
   try {
   const redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
      lazyConnect: true,
   });

   await redis.connect();
   console.log('Redis connected successfully ');
   return redis;
   
} catch (error) {
   console.log('Redis connection error:', error);
   process.exit(1);
}
}