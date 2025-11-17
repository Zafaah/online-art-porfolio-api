// import { Queue, Worker } from 'bullmq';
// import IORedis from 'ioredis';

// let redisConnected = false;
// let paymentQueue: Queue | null = null;
// let notificationQueue: Queue | null = null;
// let shippingQueue: Queue | null = null;
// let workerOptions: any = null;

// try {
//    const testConnection = new IORedis({
//       host: process.env.REDIS_HOST || 'localhost',
//       port: parseInt(process.env.REDIS_PORT || '6379'),
//       maxRetriesPerRequest: null,
//       lazyConnect: true,
//       connectTimeout: 1000,
//       commandTimeout: 1000,
//    });

//    testConnection.on('connect', () => {
//       redisConnected = true;
//       console.log('✅ Redis connected successfully');

//       const connection = new IORedis({
//          host: process.env.REDIS_HOST || 'localhost',
//          port: parseInt(process.env.REDIS_PORT || '6379'),
//          maxRetriesPerRequest: null,
//          lazyConnect: false,
//       });

//       paymentQueue = new Queue('payment-processing', { connection });
//       notificationQueue = new Queue('notifications', { connection });
//       shippingQueue = new Queue('shipping', { connection });

//       workerOptions = {
//          connection,
//          concurrency: 5,
//          removeOnComplete: { count: 50 },
//          removeOnFail: { count: 100 },
//       };
//    });

//    testConnection.on('error', () => {
//       redisConnected = false;
//       console.warn('⚠️  Redis not available, running in synchronous mode');
//       testConnection.disconnect();
//    });

//    setTimeout(() => {
//       if (!redisConnected) {
//          testConnection.disconnect();
//          console.log('🔄 Redis connection timeout - operating in synchronous mode');
//       }
//    }, 1500);

// } catch (error) {
//    console.log('🔄 Redis completely unavailable - operating in synchronous mode');
// }

// export { paymentQueue, notificationQueue, shippingQueue };

// export const isRedisAvailable = () => redisConnected;

// export { workerOptions };
