import { CommissionModel } from "../models/commissionModel";
import type { Commission } from "../models/commissionModel";
import { AppError } from "../utilits/appError";
import { commissionQueue } from "../jobs/queue";
import { auditCommissionStatusChange } from "../utilits/auditLogUtilits";
export const commissionService = {

   async submitCommissionRequest(commissionId: string) {
      const commission = await CommissionModel.findById(commissionId);
      if (!commission) {
         throw new AppError('Commission not found', 404);
      }
      const queue = await commissionQueue();

      try {
         await queue.add('commission-request-submitted', {
            type: 'commission_request',
            commissionId: commission._id,
            userId: commission.artistId,
            message: `New commission request received: "${commission.description}" with budget $${commission.budget}`,
            recipientType: 'artist',
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         });

         return { success: true, message: 'Commission request notification queued successfully' };
      } catch (error: any) {
         console.error('Error queuing commission request notification:', error);
         throw new AppError('Failed to queue commission request notification', 500);
      }
   },

   async getCommissionById(commissionId: string) {
      const commission = await CommissionModel.findById(commissionId);
      if (!commission) {
         throw new AppError('Commission not found', 404);
      }
      return commission;
   },

   async updateStatus(commissionId: string, status: string) {
      try {
         const commission = await CommissionModel.findById(commissionId);
         if (!commission) {
            throw new AppError('Commission not found', 404);
         }

         const oldStatus = commission.commission_status;
         commission.commission_status = status as any
         await commission.save();
         

         await auditCommissionStatusChange(
            commission._id,
            oldStatus,
            status,
            commission.artistId || commission.clientId,
            'user',
            'Commission status updated'
         );
         return commission;
      } catch (error: any) {
         console.error('Error updating commission status:', error);
         throw new AppError('Failed to update commission status', 500);
      }
   },

   async completeCommission(commissionId: string) { 
      const commission = await CommissionModel.findById(commissionId);
      if (!commission) {
         throw new AppError('Commission not found', 404);
      }
      try {
         const queue = await commissionQueue();
         await queue.add('commission-completed', {
            type: 'commission_complete',
            commissionId: commission._id.toString(),
            userId: commission.clientId.toString(),
            message: `Your commission "${commission.description}" has been completed by the artist`,
            recipientType: 'client',
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         });
      } catch (jobError) {
         console.log('Job creation failed, but commission was completed:', jobError);
      }

   return commission;
},
   async addFollowUpJob(commission: Commission & { _id: string }) {
      const queue = await commissionQueue();
      return queue.add('follow-up', {
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

      const queue = await commissionQueue();
      return queue.add('payment', {
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

   async paymentNotification(commission: Commission & { _id: string }) { 
      try {
         const queue = await commissionQueue();
         await queue.add('commission-payment-confirmed', {
            type: 'payment_confirm',
            commissionId: commission._id.toString(),
            message: `Payment confirmed for commission "${commission.description}". The commission is now active.`,
            userId: commission.artistId.toString(),
            roleType: 'artist',
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         });
      } catch (jobError) {
         console.log('Job creation failed, but payment was processed:', jobError);
         throw new AppError('Failed to queue payment confirmation notification', 500);
      }

   },

   async acceptCommission(commissionId: string) {
      const commission = await CommissionModel.findById(commissionId);
      if (!commission) {
         throw new AppError('Commission not found', 404);
      }
      const queue = await commissionQueue();

      try {
         await queue.add('commission-accepted', {
            type: 'commission_accept',
            commissionId: commission._id.toString(),
            userId: commission.clientId.toString(),
            message: `Your commission request "${commission.description}" has been accepted by the artist`,
            recipientType: 'client',
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         });

         return { success: true, message: 'Commission acceptance job queued successfully' };
      } catch (error: any) {
         console.error('Error queuing commission acceptance job:', error);
         throw new AppError('Failed to queue commission acceptance notification', 500);
      }
   },
   async cancelCommission(commissionId: string, roleType: 'client' | 'artist') {
      const commission = await CommissionModel.findById(commissionId);
      if (!commission) {
         throw new AppError('Commission not found', 404);
      }
   
      const queue = await commissionQueue();
      try{
      await queue.add('commission-cancel', {
         type: 'commission_cancel',
         commissionId: commission._id.toString(),
         roleType: roleType,
         message: `The commission "${commission.description}" has been cancelled by the ${roleType }`,
         commissionData: {
            description: commission.description,
            budget: commission.budget,
            dueDate: commission.due_date
         }
      });
      } catch (error: any) {
         console.error('Error queuing commission cancellation job:', error);
         throw new AppError('Failed to queue commission cancellation notification', 500);
      }



      return commission;
   },

   async renegotiateCommission(commission: Commission & { _id: string, roleType: 'client' | 'artist' }) {
      const queue = await commissionQueue();

      try {
         await queue.add('renegotiation-started', {
            type: 'renegotiation_started',
            commissionId: commission._id.toString(),
            roleType: commission.roleType,
            message: `Renegotiation initiated for commission "${commission.description}"`,
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         });
      } catch (error: any) {
         console.error('Error queuing commission renegotiation job:', error);
         throw new AppError('Failed to queue commission renegotiation notification', 500);
      }
    
      try {
         await queue.add('renegotiation-reminder-1', {
            type: 'renegotiation_reminder',
            commissionId: commission._id.toString(),
            roleType: commission.roleType,
            reminderLevel: 1,
            message: `REMINDER: Please respond to the renegotiation request for commission "${commission.description}". You have 12 hours remaining.`,
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         }, {
            delay: 1000 * 60 * 60 * 12
         });
      } catch (error: any) {
         console.error('Error queuing commission renegotiation reminder job:', error);
         throw new AppError('Failed to queue commission renegotiation reminder notification', 500);
      }
      
      try {
      
         await queue.add('renegotiation-deadline', {
            type: 'renegotiation_deadline',
            commissionId: commission._id.toString(),
            roleType: commission.roleType,
            message: `Renegotiation deadline reached for commission "${commission.description}". Proceeding with current terms.`,
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         }, {
            delay: 1000 * 60 * 60 * 24,
         });
      } catch (error: any) {
         console.error('Error queuing commission renegotiation deadline job:', error);
         throw new AppError('Failed to queue commission renegotiation deadline notification', 500);
      }
   
      return commission;
   },

   async resolveRenegotiation(commission: Commission & { _id: string, accepted: boolean, newBudget?: number, newDueDate?: Date }) {
      const queue = await commissionQueue();
  try{
      if (commission.accepted) {
        
         const updateData: any = {};
         if (commission.newBudget) updateData.budget = commission.newBudget;
         if (commission.newDueDate) updateData.due_date = commission.newDueDate;

         if (Object.keys(updateData).length > 0) {
            await CommissionModel.findByIdAndUpdate(commission._id, updateData);
         }

        
         await queue.add('renegotiation-resolved', {
            type: 'renegotiation_resolved',
            commissionId: commission._id.toString(),
            accepted: commission.accepted,
            message: `Renegotiation accepted! Commission "${commission.description}" updated with new terms.`,
            commissionData: {
               description: commission.description,
               newBudget: commission.newBudget,
               newDueDate: commission.newDueDate
            }
         });
      } else {
        

         await queue.add('renegotiation-resolved', {
            type: 'renegotiation_resolved',
            commissionId: commission._id.toString(),
            accepted: false,
            message: `Renegotiation rejected. Commission "${commission.description}" will proceed with original terms.`,
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         });
      }
   } catch (error: any) {
      console.error('Error queuing commission renegotiation resolved job:', error);
      throw new AppError('Failed to queue commission renegotiation resolved notification', 500);
   }
      return commission;
   },

   async addRenegotiateJob(commission: Commission & { _id: string, roleType: 'client' | 'artist' }) {
      const queue = await commissionQueue();
      await queue.add('commission-renegotiate', {
         type: 'commission_renegotiate',
         commissionId: commission._id.toString(),
         roleType: commission.roleType,
         message: `The commission "${commission.description}" has been renegotiated by the ${commission.roleType}`,
      });
   }
};