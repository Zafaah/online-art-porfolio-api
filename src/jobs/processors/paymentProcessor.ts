// import { Worker } from 'bullmq';
// import { workerOptions, notificationQueue } from '../queue';
// import { OrderModel } from '../../models/orderModel';
// import { ArtsWorkModel } from '../../models/artsWork';

// let paymentProcessor: Worker | null = null;

// if (workerOptions) {
//    try {
//       paymentProcessor = new Worker('payment-processing', async (job) => {
//          const { orderId } = job.data;

//          try {
//             console.log(`Processing payment for order ${orderId}`);

//             await new Promise(resolve => setTimeout(resolve, 2000));

//             const paymentSuccess = Math.random() > 0.1;

//             if (paymentSuccess) {
//                await OrderModel.findByIdAndUpdate(orderId, { order_status: 'Paid' });

//                const order = await OrderModel.findById(orderId).populate('artworkId');
//                if (order) {
//                   await ArtsWorkModel.findByIdAndUpdate(order.artworkId, { status: 'Reserved' });

//                   if (notificationQueue) {
//                      await notificationQueue.add('artist-shipment-prep', {
//                         type: 'artist_prepare_shipment',
//                         orderId: orderId,
//                         userId: (order.artworkId as any).artistId.toString(),
//                         message: `New order received for "${(order.artworkId as any).title}". Please prepare for shipment.`
//                      });

//                      await notificationQueue.add('payment-successful', {
//                         type: 'payment_successful',
//                         orderId: orderId,
//                         userId: order.clientId.toString(),
//                         message: 'Your payment has been processed successfully. Your order is being prepared.'
//                      });
//                   }
//                }

//                console.log(`Payment successful for order ${orderId}`);
//                return { success: true, message: 'Payment processed successfully' };
//             } else {
//                console.log(`Payment failed for order ${orderId}`);
//                await OrderModel.findByIdAndUpdate(orderId, { order_status: 'Pending' });
//                throw new Error('Payment failed');
//             }
//          } catch (error) {
//             console.error(`Payment processing failed for order ${orderId}:`, error);
//             throw error;
//          }
//       }, workerOptions);

//       console.log(' Payment processor initialized');
//    } catch (error) {
//       console.log(' Payment processor initialization failed - Redis not available');
//    }
// } else {
//    console.log(' Payment processor not initialized - Redis not available');
// }

// export { paymentProcessor };
