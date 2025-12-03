import { CommissionModel } from "../models/commissionModel";
import type { Commission } from "../models/commissionModel";
import { AppError } from "../utilits/appError";
import { commissionQueue } from "../jobs/queue";
import { auditCommissionStatusChange } from "../utilits/auditLogUtilits";


const queue = commissionQueue
 

export const commissionService = {
   async getCommissionById(commissionId: string) {
      const commission = await CommissionModel.findById(commissionId);
      if (!commission) {
         throw new AppError('Commission not found', 404);
      }
      return commission;
   },
   
   async submitCommissionRequest(commissionId: string) {
      try {
         const commission = await CommissionModel.findById(commissionId);
         if (!commission) throw new AppError("Commission not found", 404);

         await commissionQueue.add("commission_request", {
            type: "commission_request",
            commissionId: commission._id.toString(),
            userId: commission.clientId.toString(),
            message: `New commission request received: "${commission.description}" with budget $${commission.budget}`,
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date,
            },
         });

         return { success: true, message: "Commission request notification queued successfully" };
      } catch (error: any) {
         console.error("Error queuing commission request notification:", error);
         throw new AppError("Failed to queue commission request notification", 500);
      }
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
   async addFollowUpJob(commissionId:string) {
      try {
         const commission = await CommissionModel.findById(commissionId);
         if (!commission) {
            throw new AppError('Commission not found', 404);
         };
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
         )
      }  catch(error: any) {
         console.error('Error queuing commission renegotiation reminder job:', error);
         throw new AppError('Failed to queue commission renegotiation reminder notification', 500);
      }
   },


   async addPaymentJob(commissionId: string) {
      try {
         const commission = await CommissionModel.findById(commissionId);
         if (!commission) {
            throw new AppError('Commission not found', 404);
         };
      
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
         )
      } catch(error: any) {
         console.error('Error queuing commission payment reminder job:', error);
      throw new AppError('Failed to queue commission commission_payment  notification', 500);
      };
   },

   async paymentNotification(commissionId: string) { 
      try {
         const commission = await CommissionModel.findById(commissionId);
         if (!commission) {
            throw new AppError('Commission not found', 404);
         };
         
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
   
      
      try{
         const oldStatus = commission.commission_status;
         commission.commission_status = 'Cancelled' as any;
         await commission.save();

         await auditCommissionStatusChange(
            commission._id,
            oldStatus,
            'Cancelled',
            commission.artistId || commission.clientId,
            roleType,
            'Commission cancelled'
         );

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

   async renegotiateCommission(commissionId:string, roleType: 'client' | 'artist' ) {
      try {
         const commission = await CommissionModel.findById(commissionId);
         if (!commission) {
            throw new AppError('Commission not found', 404);
         };
         const oldStatus = commission.commission_status;
         commission.commission_status = 'Pending_Approval' as any;
         await commission.save();

         await auditCommissionStatusChange(
            commission._id,
            oldStatus,
            'Pending_Approval',
            commission.artistId || commission.clientId,
            roleType,
            'Renegotiation started'
         );

         await queue.add('renegotiation-started', {
            type: 'renegotiation_started',
            commissionId: commission._id.toString(),
            roleType: roleType,
            message: `Renegotiation initiated for commission "${commission.description}"`,
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         });
      
   
         await queue.add('renegotiation-reminder-1', {
            type: 'renegotiation_reminder',
            commissionId: commission._id.toString(),
            roleType:roleType,
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
     

         await queue.add('renegotiation-deadline', {
            type: 'renegotiation_deadline',
            commissionId: commission._id.toString(),
            roleType: roleType,
            message: `Renegotiation deadline reached for commission "${commission.description}". Proceeding with current terms.`,
            commissionData: {
               description: commission.description,
               budget: commission.budget,
               dueDate: commission.due_date
            }
         }, {
            delay: 1000 * 60 * 60 * 24,
         });
         return commission;
      } catch (error: any) {
         console.error('Error queuing commission renegotiation deadline job:', error);
         throw new AppError('Failed to queue commission renegotiation deadline notification', 500);
      }
   
      
   },

   async resolveRenegotiation(commission: Commission & { _id: string, accepted: boolean, newBudget?: number, newDueDate?: Date }) {
      try {
         const commissionDoc = await CommissionModel.findById(commission._id);
         if (!commissionDoc) throw new AppError('Commission not found', 404);

         const oldStatus = commissionDoc.commission_status;

         if (commission.accepted) {
            const updateData: any = {};
            if (commission.newBudget) updateData.budget = commission.newBudget;
            if (commission.newDueDate) updateData.due_date = commission.newDueDate;

            if (Object.keys(updateData).length > 0) {
               await CommissionModel.findByIdAndUpdate(commission._id, updateData);
            }

            commissionDoc.commission_status = 'In_Progress' as any;
            await commissionDoc.save();

            await auditCommissionStatusChange(
               commissionDoc._id,
               oldStatus,
               'In_Progress',
               commissionDoc.artistId || commissionDoc.clientId,
               'system',
               'Renegotiation accepted'
            );

            await queue.add('renegotiation-resolved', {
               type: 'renegotiation_resolved',
               commissionId: commission._id.toString(),
               accepted: commission.accepted,
               message: `Renegotiation accepted! Commission "${commissionDoc.description}" updated with new terms.`,
               commissionData: {
                  description: commissionDoc.description,
                  newBudget: commission.newBudget,
                  newDueDate: commission.newDueDate
               }
            });
         } else {
            
            commissionDoc.commission_status = oldStatus;
            await commissionDoc.save();

            await queue.add('renegotiation-resolved', {
               type: 'renegotiation_resolved',
               commissionId: commission._id.toString(),
               accepted: false,
               message: `Renegotiation rejected. Commission "${commissionDoc.description}" will proceed with original terms.`,
               commissionData: {
                  description: commissionDoc.description,
                  budget: commissionDoc.budget,
                  dueDate: commissionDoc.due_date
               }
            });
         }

         return commissionDoc;
      } catch (error: any) {
         console.error('Error processing renegotiation resolution:', error);
         throw new AppError('Failed to process renegotiation resolution', 500);
      }
   },

   async addRenegotiateJob(commission: Commission & { _id: string, roleType: 'client' | 'artist' }) {
      
      await queue.add('commission-renegotiate', {
         type: 'commission_renegotiate',
         commissionId: commission._id.toString(),
         roleType: commission.roleType,
         message: `The commission "${commission.description}" has been renegotiated by the ${commission.roleType}`,
      });
   }
};