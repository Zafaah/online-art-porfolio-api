import { Worker } from 'bullmq';
import {  workerOptions, commissionQueue } from '../queue';
import { commissionService } from '../../services/commissionService';
import { sendNotification } from '../../services/notifications';
import { auditCommissionStatusChange, auditJobProcessing } from '../../utilits/auditLogUtilits';
import mongoose from 'mongoose';
import type { Commission } from '../../models/commissionModel';

export const commissionWorker = new Worker(
  'commission',
  async (job) => {
    const { type, commissionId, userId, message, roleType, commissionData } = job.data;

    try {
      const commission = await commissionService.getCommissionById(commissionId);
      
      switch (type) {
        case 'commission_request':
          await sendNotification.send(commission.artistId.toString(), message, 'artist');
          break;
        case 'commission_accept':
          await sendNotification.send(commission.clientId.toString(), message, 'client');
          break;
        
        case 'commission_complete':
        
          await sendNotification.send(commission.clientId.toString(), message, 'client');
          break;
        
        case 'commission_paid':
          const updatedCommission = await commissionService.updateStatus(commissionId, 'Paid');
          await commissionService.paymentNotification({
            ...updatedCommission.toObject(),
            _id: updatedCommission._id.toString()
          } as Commission & { _id: string });
          await sendNotification.send(commission.artistId.toString(), message, 'artist');
          break;
        case 'commission_payment': {
          await commissionService.addPaymentJob({
            ...commission.toObject(),
            _id: commission._id.toString()
          } as Commission & { _id: string });
          await commissionService.addPaymentJob({ ...commission.toObject(), _id: commission._id.toString() } as Commission & { _id: string });
         
          break;
        }

        case 'commission_follow_up': {
          await commissionService.addFollowUpJob({ ...commission.toObject(), _id: commission._id.toString() } as Commission & { _id: string });
          
          break;
        }
        // case 'commission_cancel': {
        //   await commissionService.cancelCommission({ ...commission.toObject(), _id: commission._id.toString(), roleType: job.data.roleType } as Commission & { _id: string, roleType: 'client' | 'artist' });
        //   await sendNotification.send(commission.artistId.toString(), job.data.message, 'artist');
        //   await sendNotification.send(commission.clientId.toString(), job.data.message, 'client');

        //   break;
        // }
        // case 'renegotiation_started': {
          
        //   await sendNotification.send(commission.artistId.toString(), job.data.message, 'artist');
        //   await sendNotification.send(commission.clientId.toString(), job.data.message, 'client');

        //   await auditCommissionStatusChange(
        //     commission._id,
        //     commission.commission_status,
        //     commission.artistId.toString(),
        //     commission.artistId,
        //     `Renegotiation initiated by ${job.data.roleType} for commission "${commission.description}"`
        //   );
        //   break;
        // }

        // case 'renegotiation_reminder': {
         
        //   if (!['Completed', 'Cancelled', 'Paid'].includes(commission.commission_status)) {
        //     await sendNotification.send(commission.artistId.toString(), job.data.message, 'artist');
        //     await sendNotification.send(commission.clientId.toString(), job.data.message, 'client');

        //     await auditCommissionStatusChange(
        //       commission._id,
        //       commission.commission_status,
        //       commission.commission_status,
        //       commission.artistId.toString(),
        //       commission.artistId,
        //       'job',
        //       `Renegotiation reminder ${job.data.reminderLevel} sent - ${24 - (job.data.reminderLevel * 6)} hours remaining`
        //     );
        //   }
        //   break;
        // }

        // case 'renegotiation_deadline': {
          
        //   const currentCommission = await commissionService.getCommissionById(commissionId);

        //   if (!['Completed', 'Cancelled', 'Paid'].includes(currentCommission.commission_status)) {
          
        //     await sendNotification.send(commission.artistId.toString(),
        //       `Renegotiation deadline reached. Commission "${commission.description}" will proceed with original terms.`, 'artist');
        //     await sendNotification.send(commission.clientId.toString(),
        //       `Renegotiation deadline reached. Commission "${commission.description}" will proceed with original terms.`, 'client');

        //     await auditCommissionStatusChange(
        //       commission._id,
        //       currentCommission.commission_status,
        //       commission.artistId.toString(),
        //       commission.clientId.toString(),
        //       'Renegotiation deadline reached - proceeding with original terms'
        //     );

            
        //     const queue = await commissionQueue();
        //     await queue.add('renegotiation-followup', {
        //       type: 'renegotiation_followup',
        //       commissionId: commission._id.toString(),
        //       message: `FOLLOW-UP: Commission "${commission.description}" renegotiation deadline passed. Status check.`,
        //       commissionData: job.data.commissionData
        //     }, {
        //       delay: 1000 * 60 * 60 * 24 
        //     });
        //   }
        //   break;
        // }

        // case 'renegotiation_followup': {
         
        //   const currentCommission = await commissionService.getCommissionById(commissionId);

        //   if (!['Completed', 'Cancelled', 'Paid'].includes(currentCommission.commission_status)) {
         
        //     await auditCommissionStatusChange(
        //       commission._id,
        //       currentCommission.commission_status,
        //       commission.artistId.toString(),
        //       commission.clientId.toString(),
        //       'Renegotiation follow-up: Commission still pending after deadline'
        //     );

          
        //     console.log(`Commission ${commissionId} requires manual intervention - renegotiation overdue`);
        //   }
        //   break;
        // }

        // case 'renegotiation_resolved': {
          
        //   await sendNotification.send(commission.artistId.toString(), job.data.message, 'artist');
        //   await sendNotification.send(commission.clientId.toString(), job.data.message, 'client');

        //   const resolution = job.data.accepted ? 'accepted' : 'rejected';
        //   await auditCommissionStatusChange(
        //     commission._id,
        //     commission.commission_status,,
        //     commission.artistId.toString(),
        //     commission.artistId,
        //     `Renegotiation ${resolution} - commission "${commission.description}"`
        //   );
        //   break;
        // }
      } 

      return { success: true };
    } catch (err:any) {
      console.error(`Job ${job.id} failed:`, err.message);

      await auditJobProcessing(
        job.data.type,
        commissionId,
        false,
        err.message,
        job.attemptsMade
      )
      return { success: false, error: err.message };
    }
  }, workerOptions);

  commissionWorker.on('completed', (job) => console.log(` Job ${job.id} completed`));
  commissionWorker.on('failed', (job, err) => console.error(` Job ${job?.id} failed: ${err.message}`));