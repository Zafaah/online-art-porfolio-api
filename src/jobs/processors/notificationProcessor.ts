// import { Worker } from 'bullmq';
// import { workerOptions } from '../queue';

// let notificationProcessor: Worker | null = null;

// if (workerOptions) {
//    try {
//       notificationProcessor = new Worker('notifications', async (job) => {
//          const { type, orderId, userId, message } = job.data;

//          try {
//             console.log(`Sending ${type} notification for order ${orderId}`);

//             await new Promise(resolve => setTimeout(resolve, 1000));

//             console.log(`Notification sent: ${message} to user ${userId}`);
//             return { success: true, message: 'Notification sent successfully' };
//          } catch (error) {
//             console.error(`Notification failed for order ${orderId}:`, error);
//             throw error;
//          }
//       }, workerOptions);

//       console.log(' Notification processor initialized');
//    } catch (error) {
//       console.log(' Notification processor initialization failed - Redis not available');
//    }
// } else {
//    console.log(' Notification processor not initialized - Redis not available');
// }

// export { notificationProcessor };
