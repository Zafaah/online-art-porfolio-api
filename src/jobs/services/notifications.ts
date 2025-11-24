
import { UserModel } from "../../models/userModel";
import { AppError } from "../../utilits/appError";


export const sendNotification = {
   async send(userId: string, message: string, roleType: string) {
      try {
         
         const user = await UserModel.findById(userId);
         if (!user) {
             throw new AppError('User not found', 404);
         }

         console.log(`[${roleType}] ${userId}: ${message}`);
         await new Promise(res => setTimeout(res, 1000));
      } catch (error) {
         
      }
  
   }
}