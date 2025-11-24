import { Worker } from 'bullmq';
import {  workerOptions } from '../queue';
import { commissionService } from '../services/commissionService';
import { sendNotification } from '../services/notifications';
import { auditCommissionStatusChange, auditJobProcessing } from '../../utilits/auditLogUtilits';
import mongoose from 'mongoose';

export const commissionWorker = new Worker(
  'commission_worker',
  async (job) => {
    const { type, commissionId, userId, message } = job.data;

    try {
      const commission = await commissionService.getCommissionById(commissionId);

      switch (type) {
        case 'commission_follow_up':
          if (commission.commission_status === 'Pending_Approval') {
            await sendNotification.send(userId, message, 'artist');
          }
          break;

        case 'commission_payment':
          if (commission.commission_status === 'In_Progress') {
            await sendNotification.send(userId, message, 'client');
          }
          break;

        case 'commission_complete':
          const oldStatusComplete = commission.commission_status;
          await commissionService.updateStatus(commissionId, 'Completed');

          await auditCommissionStatusChange(
            new mongoose.Types.ObjectId(commissionId),
            oldStatusComplete,
            'Completed',
            undefined,
            'job',
            'Job processed commission completion'
          );

          await sendNotification.send(commission.artistId.toString(), 'Commission completed!', 'artist');
          await sendNotification.send(commission.clientId.toString(), 'Commission completed!', 'client');
          break;

        case 'commission_paid':
          const oldStatusPaid = commission.commission_status;
          await commissionService.updateStatus(commissionId, 'Paid');

          await auditCommissionStatusChange(
            new mongoose.Types.ObjectId(commissionId),
            oldStatusPaid,
            'Paid',
            undefined,
            'job',
            'Job processed payment confirmation'
          );

          await sendNotification.send(commission.artistId.toString(), 'Payment confirmed!', 'artist');
          break;

        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      await auditJobProcessing(
        job.id || 'unknown',
        type,
        commissionId,
        true,
        undefined,
        job.attemptsMade
      );

      return { success: true };

    } catch (err: any) {
      console.error(`Job ${job.id} failed:`, err.message);

   
      await auditJobProcessing(
        job.id || 'unknown',
        type,
        commissionId,
        false,
        err.message,
        job.attemptsMade
      );

      throw err; 
    }
  }, workerOptions);

commissionWorker.on('completed', (job) => console.log(` Job ${job.id} completed`));
commissionWorker.on('failed', (job, err) => console.error(` Job ${job?.id} failed: ${err.message}`));