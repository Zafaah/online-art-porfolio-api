import mongoose from 'mongoose';

export interface Order {
   artworkId: mongoose.Types.ObjectId;
   clientId: mongoose.Types.ObjectId;
   price: number;
   address: string;
   paymentMethod: string;
   order_status: 'Pending' | 'Paid' | 'Shipped' | 'Completed';
   createdAt: Date;
   updatedAt: Date;
}

const orderSchema = new mongoose.Schema<Order>({
   artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ArtsWork',
      required: true,
   },
   clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   price: {
      type: Number,
      required: true,
      min: 0,
   },
   address: {
      type: String,
      required: true,
   },
   paymentMethod: {
      type: String,
      required: true,
   },
   order_status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Completed'],
      default: 'Pending',
      required: true,
   },
}, { timestamps: true });

export const OrderModel = mongoose.model<Order>('Order', orderSchema);
