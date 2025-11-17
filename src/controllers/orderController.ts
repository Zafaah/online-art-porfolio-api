// import { OrderModel } from "../models/orderModel";
// import { ArtsWorkModel } from "../models/artsWork";
// import { paymentQueue, notificationQueue, shippingQueue, isRedisAvailable } from "../jobs";

// export const createOrder = async (c: any) => {
//    try {
//       const user = c.get("user");
//       const body = await c.req.json();
//       const { artworkId, address, paymentMethod } = body;

//       if (!artworkId || !address || !paymentMethod) {
//          c.status(400);
//          return c.json({ message: "ArtworkId, address, and paymentMethod are required" });
//       }

//       const artwork = await ArtsWorkModel.findById(artworkId);
//       if (!artwork) {
//          c.status(404);
//          return c.json({ message: "Artwork not found" });
//       }

//       if (artwork.status !== 'For_Sale' || (artwork.stock && artwork.stock <= 0)) {
//          c.status(400);
//          return c.json({ message: "Artwork is not available for purchase" });
//       }

//       const newOrder = new OrderModel({
//          artworkId,
//          clientId: user.id,
//          price: artwork.price,
//          address,
//          paymentMethod,
//          order_status: 'Pending'
//       });

//       await newOrder.save();

//       if (isRedisAvailable() && paymentQueue) {
//          await paymentQueue.add('process-payment', {
//             orderId: newOrder._id.toString()
//          });

//          await notificationQueue?.add('order-confirmation', {
//             type: 'order_created',
//             orderId: newOrder._id.toString(),
//             userId: user.id,
//             message: 'Your order has been created and payment is being processed.'
//          });

//          c.status(201);
//          return c.json({
//             message: "Order created successfully",
//             order: newOrder,
//             note: "Payment processing started in background"
//          });
//       } else {
//          console.log('🔄 Processing payment synchronously (Redis not available)');

//          await new Promise(resolve => setTimeout(resolve, 2000));
//          const paymentSuccess = Math.random() > 0.1;

//          if (paymentSuccess) {
//             await OrderModel.findByIdAndUpdate(newOrder._id, { order_status: 'Paid' });
//             await ArtsWorkModel.findByIdAndUpdate(newOrder.artworkId, { status: 'Reserved' });

//             console.log('Payment processed synchronously');
//          } else {
//             console.log('Payment failed synchronously');
//             await OrderModel.findByIdAndUpdate(newOrder._id, { order_status: 'Pending' });
//          }

//          c.status(201);
//          return c.json({
//             message: "Order created successfully (synchronous mode)",
//             order: newOrder,
//             note: "Payment processed immediately (Redis not available)"
//          });
//       }
//    } catch (error) {
//       console.error('Error creating order:', error);
//       c.status(500);
//       return c.json({ message: "Error creating order", error });
//    }
// };

// export const getOrderById = async (c: any) => {
//    try {
//       const user = c.get("user");
//       const { id } = c.req.param();

//       const order = await OrderModel.findById(id)
//          .populate('artworkId')
//          .populate('clientId', 'name email');

//       if (!order) {
//          c.status(404);
//          return c.json({ message: "Order not found" });
//       }

//       if (order.clientId.toString() !== user.id) {
//          c.status(403);
//          return c.json({ message: "Access denied" });
//       }

//       return c.json(order);
//    } catch (error) {
//       c.status(500);
//       return c.json({ message: "Error fetching order", error });
//    }
// };

// export const getUserOrders = async (c: any) => {
//    try {
//       const user = c.get("user");
//       const orders = await OrderModel.find({ clientId: user.id })
//          .populate('artworkId')
//          .sort({ createdAt: -1 });

//       return c.json(orders);
//    } catch (error) {
//       c.status(500);
//       return c.json({ message: "Error fetching orders", error });
//    }
// };

// export const markOrderDelivered = async (c: any) => {
//    try {
//       const user = c.get("user");
//       const { id } = c.req.param();

//       const order = await OrderModel.findById(id);
//       if (!order) {
//          c.status(404);
//          return c.json({ message: "Order not found" });
//       }

//       if (order.clientId.toString() !== user.id) {
//          c.status(403);
//          return c.json({ message: "Access denied" });
//       }

//       if (order.order_status !== 'Shipped') {
//          c.status(400);
//          return c.json({ message: "Order must be in Shipped status to mark as delivered" });
//       }

//       await OrderModel.findByIdAndUpdate(id, { order_status: 'Completed' });

//       await ArtsWorkModel.findByIdAndUpdate(order.artworkId, { status: 'Sold' });

//       if (isRedisAvailable() && notificationQueue) {
//          await notificationQueue.add('order-delivered', {
//             type: 'order_delivered',
//             orderId: id,
//             userId: user.id,
//             message: 'Your order has been delivered successfully.'
//          });
//       } else {
//          console.log('✅ Order marked as delivered (synchronous mode - no notification sent)');
//       }

//       return c.json({ message: "Order marked as delivered successfully" });
//    } catch (error) {
//       c.status(500);
//       return c.json({ message: "Error updating order", error });
//    }
// };

// export const getArtistOrders = async (c: any) => {
//    try {
//       const user = c.get("user");

//       const orders = await OrderModel.find()
//          .populate({
//             path: 'artworkId',
//             match: { artistId: user.id }
//          })
//          .populate('clientId', 'name email')
//          .sort({ createdAt: -1 });

//       const artistOrders = orders.filter(order => order.artworkId);

//       return c.json(artistOrders);
//    } catch (error) {
//       c.status(500);
//       return c.json({ message: "Error fetching artist orders", error });
//    }
// };

// export const shipOrder = async (c: any) => {
//    try {
//       const user = c.get("user");
//       const { id } = c.req.param();

//       const order = await OrderModel.findById(id).populate('artworkId');
//       if (!order) {
//          c.status(404);
//          return c.json({ message: "Order not found" });
//       }

//       if ((order.artworkId as any).artistId.toString() !== user.id) {
//          c.status(403);
//          return c.json({ message: "Access denied - not your artwork" });
//       }

//       if (order.order_status !== 'Paid') {
//          c.status(400);
//          return c.json({ message: "Order must be in Paid status to ship" });
//       }

//       if (isRedisAvailable() && shippingQueue) {
//          await shippingQueue.add('generate-shipping-label', {
//             orderId: id,
//             action: 'generate_label'
//          });

//          await notificationQueue?.add('order-shipped', {
//             type: 'order_shipped',
//             orderId: id,
//             userId: order.clientId.toString(),
//             message: 'Your order is being prepared for shipment.'
//          });

//          return c.json({ message: "Shipping process started" });
//       } else {
//          console.log('🔄 Processing shipping synchronously (Redis not available)');

//          await OrderModel.findByIdAndUpdate(id, { order_status: 'Shipped' });

//          console.log('✅ Order marked as shipped synchronously');
//          return c.json({ message: "Order shipped (synchronous mode)" });
//       }
//    } catch (error) {
//       c.status(500);
//       return c.json({ message: "Error processing shipment", error });
//    }
// };
