import mongoose from 'mongoose';

export interface Notification {
  userId: mongoose.Types.ObjectId;
  title?: string;
  message: string;
  type?: string;
  read: boolean;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<Notification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: undefined,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: undefined,
    },
    read: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model<Notification>('Notification', notificationSchema);
