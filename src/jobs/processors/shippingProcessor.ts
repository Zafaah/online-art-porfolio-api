// import { Worker } from 'bullmq';
// import { workerOptions } from '../queue';
// import { OrderModel } from '../../models/orderModel';

// let shippingProcessor: Worker | null = null;

// if (workerOptions) {
//    try {
//       shippingProcessor = new Worker('shipping', async (job) => {
//          const { orderId, action } = job.data;

//          try {
//             if (action === 'generate_label') {
//                console.log(`Generating shipping label for order ${orderId}`);

//                await new Promise(resolve => setTimeout(resolve, 1500));

//                await OrderModel.findByIdAndUpdate(orderId, { order_status: 'Shipped' });

//                console.log(`Shipping label generated for order ${orderId}`);
//                return { success: true, message: 'Shipping label generated' };
//             }

//             throw new Error(`Unknown shipping action: ${action}`);
//          } catch (error) {
//             console.error(`Shipping processing failed for order ${orderId}:`, error);
//             throw error;
//          }
//       }, workerOptions);

//       console.log('✅ Shipping processor initialized');
//    } catch (error) {
//       console.log('🔄 Shipping processor initialization failed - Redis not available');
//    }
// } else {
//    console.log('🔄 Shipping processor not initialized - Redis not available');
// }

// export { shippingProcessor };
