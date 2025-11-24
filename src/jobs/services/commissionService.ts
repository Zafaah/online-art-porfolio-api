import { CommissionModel } from "../../models/commissionModel";
import type { Commission } from "../../models/commissionModel";
import { AppError } from "../../utilits/appError";
import { commissionQueue } from "../queue";

export const commissionService = {
   async getCommissionById(commissionId: string) {
      const commission = await CommissionModel.findById(commissionId);
      if (!commission) {
         throw new AppError('Commission not found', 404);
      }
      return commission;
   },

   async updateStatus(commissionId: string, status: 'Pending_Approval' | 'In_Progress' | 'Completed' | 'Cancelled' | 'Paid') {
      const commission = await CommissionModel.findByIdAndUpdate(commissionId,
         { commission_status: status }, { new: true });
      
      if (!commission) {
         throw new AppError('Commission not found', 404);
      }
      
      return commission;
   },

   
   async addFollowUpJob(commission: Commission & { _id: string }) {
      return commissionQueue.add('follow-up', {
         type: 'commission_follow_up',
         commissionId: commission._id.toString(),
         userId: commission.artistId.toString(),
         message: `reminder to complete the commission "${commission.description}"`,
         roleType: 'artist',
      },
      {
         delay: 1000 * 60 * 60 * 24,
      }
      );
   },


   async addPaymentJob(commission: Commission & { _id: string }) {
      return commissionQueue.add('payment', {
         type: 'commission_payment', 
         commissionId: commission._id.toString(),
         userId: commission.clientId.toString(),
         message: `payment for the commission "${commission.description}" is ready to be paid`,
         roleType: 'client',
      },
      {
         delay: 1000 * 60 * 60 * 24,
      }
      );
   },
};