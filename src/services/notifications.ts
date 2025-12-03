
import { UserModel } from "../models/userModel";
import { NotificationModel } from "../models/notification";
import { AppError } from "../utilits/appError";

export const sendNotification = {

   async send(
      userId: string,
      message: string,
      roleType: string,
      options?: { title?: string; type?: string; meta?: Record<string, any> }
   ) {
      try {

         
         const notification = new NotificationModel({
            userId: userId,
            title: options?.title,
            message,
            type: options?.type,
            meta: options?.meta,
         });
         await notification.save();

         console.log(`[${roleType}] Notification queued for ${userId}: ${message}`);

         return notification;
      } catch (error: any) {
         console.error('sendNotification error:', error?.message ?? error);
         throw error;
      }
   },
};