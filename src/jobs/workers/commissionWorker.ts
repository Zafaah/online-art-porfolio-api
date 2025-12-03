import { Worker } from "bullmq";
import { workerOptions, commissionQueue } from "../queue";
import { commissionService } from "../../services/commissionService";
import { sendNotification } from "../../services/notifications";

export const commissionWorker = new Worker(
  "commission",
  async (job) => {
    const { type, commissionId, message, } = job.data;

      try {
        const commission = await commissionService.getCommissionById(commissionId);
        console.log(`Processing job ${commission} `);
      switch (type) {
        case "commission_request": {
          const res = await sendNotification.send(
            commission.artistId.toString(),
            message,
            
            "artist",
            { title: "New commission request", type: type, meta: { commissionId } }
          );
          console.log(`Notification result: ${JSON.stringify(res)}`);
          break;
        }

        case "commission_accept": {
          await sendNotification.send(
            commission.clientId.toString(),
            message,
            "client",
            { title: "Commission accepted", type: type, meta: { commissionId } }
          );
          break;
        }

        case "commission_complete": {
          await sendNotification.send(
            commission.clientId.toString(),
            message,
            "client",
            { title: "Commission complete", type: type, meta: { commissionId } }
          );
          break;
        }

        case "commission_payment": {
          await sendNotification.send(
            commission.artistId.toString(),
            message,
            "artist",
            { title: "Payment received", type: type, meta: { commissionId } }
          );
          break;
        }

        case "commission_cancel": {
          await sendNotification.send(
            commission.artistId.toString(),
            message,
            "artist",
            { title: "Commission canceled", type: type, meta: { commissionId } }
          );
          await sendNotification.send(
            commission.clientId.toString(),
            message,
            "client",
            { title: "Commission canceled", type: type, meta: { commissionId } }
          );
          break;
        }

        case "renegotiation_started": {
          await sendNotification.send(
            commission.artistId.toString(),
            message,
            "artist",
            { title: "Renegotiation started", type: type, meta: { commissionId } }
          );
          await sendNotification.send(
            commission.clientId.toString(),
            message,
            "client",
            { title: "Renegotiation started", type: type, meta: { commissionId } }
          );
          break;
        }

        case 'renegotiation_reminder': {
          const role = job.data?.roleType || 'artist';
          const recipient = role === 'artist' ? commission.artistId : commission.clientId;
          await sendNotification.send(
            recipient.toString(),
            job.data?.message || message,
            role,
            { title: 'Renegotiation reminder', type: type, meta: { commissionId, reminderLevel: job.data?.reminderLevel } }
          );
          break;
        }

        case 'renegotiation_deadline': {
          await sendNotification.send(
            commission.artistId.toString(),
            message,
            'artist',
            { title: 'Renegotiation deadline', type: type, meta: { commissionId } }
          );
          await sendNotification.send(
            commission.clientId.toString(),
            message,
            'client',
            { title: 'Renegotiation deadline', type: type, meta: { commissionId } }
          );
          break;
        }

        case 'renegotiation_resolved': {
          await sendNotification.send(
            commission.artistId.toString(),
            job.data?.message || message,
            'artist',
            { title: 'Renegotiation result', type: type, meta: { commissionId, accepted: job.data?.accepted } }
          );
          await sendNotification.send(
            commission.clientId.toString(),
            job.data?.message || message,
            'client',
            { title: 'Renegotiation result', type: type, meta: { commissionId, accepted: job.data?.accepted } }
          );
          break;
        }

        default:
          console.log(`Unknown job type: ${type}`);
      }

      return { success: true };
    } catch (err: any) {
      console.error(`Job ${job.id} failed:`, err.message);
      return { success: false, error: err.message };
    }
  },
  workerOptions
);

commissionWorker.on("completed", (job) => console.log(` Job ${job.id} completed`));
commissionWorker.on("failed", (job, err) => console.error(` Job ${job?.id} failed: ${err.message}`));
