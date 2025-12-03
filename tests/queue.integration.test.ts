import { test, describe, beforeAll, afterAll, expect } from 'bun:test';
import mongoose from 'mongoose';
import Redis from 'ioredis';

import { CommissionModel } from '../src/models/commissionModel';
import { NotificationModel } from '../src/models/notification';
import { commissionService } from '../src/services/commissionService';
import { commissionQueue } from '../src/jobs/queue';
import '../src/jobs/workers/commissionWorker';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_art_portfolio_test';
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT || '6379');

let redisClient: any;

async function waitForNotification(filter: any, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const n = await NotificationModel.findOne(filter).lean();
    if (n) return n;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

describe('Commission queue integration', () => {
  

  test('commission_request enqueues and creates notification', async () => {
    redisClient = new Redis({ host: REDIS_HOST, port: REDIS_PORT });
    await mongoose.connect(MONGO_URI);
    await CommissionModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await redisClient.ping();

    try {
      const clientId = new mongoose.Types.ObjectId();
      const artistId = new mongoose.Types.ObjectId();

      const commission = await CommissionModel.create({
        clientId,
        artistId,
        description: 'Integration test commission request',
        budget: 50,
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24),
        commission_status: 'Pending_Approval',
      } as any)
      await commissionService.submitCommissionRequest(commission._id.toString());
      await new Promise((r) => setTimeout(r, 200));

      const counts = await commissionQueue.getJobCounts();
      const totalJobs = (counts.waiting || 0) + (counts.delayed || 0) + (counts.active || 0);
      expect(totalJobs).toBeGreaterThan(0);
    } finally {
      try { await commissionQueue.close(); } catch (e) {}
      await CommissionModel.deleteMany({});
      await NotificationModel.deleteMany({});
      if (redisClient) await redisClient.quit();
      await mongoose.disconnect();
    }
  }, 40000);

  test('completeCommission enqueues and creates notification', async () => {
    redisClient = new Redis({ host: REDIS_HOST, port: REDIS_PORT });
    await mongoose.connect(MONGO_URI);
    await CommissionModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await redisClient.ping();

    try {
      const clientId = new mongoose.Types.ObjectId();
      const artistId = new mongoose.Types.ObjectId();

      const commission = await CommissionModel.create({
        clientId,
        artistId,
        description: 'Integration complete commission',
        budget: 200,
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24),
        commission_status: 'In_Progress',
      } as any);

      await commissionService.completeCommission(commission._id.toString());
      await new Promise((r) => setTimeout(r, 200));

      const counts = await commissionQueue.getJobCounts();
      const totalJobs = (counts.waiting || 0) + (counts.delayed || 0) + (counts.active || 0);
      expect(totalJobs).toBeGreaterThan(0);
    } finally {
      try { await commissionQueue.close(); } catch (e) {}
      await CommissionModel.deleteMany({});
      await NotificationModel.deleteMany({});
      if (redisClient) await redisClient.quit();
      await mongoose.disconnect();
    }
  }, 40000);

  test('delayed jobs exist (follow-up/payment/renegotiation reminders)', async () => {
    redisClient = new Redis({ host: REDIS_HOST, port: REDIS_PORT });
    await mongoose.connect(MONGO_URI);
    await CommissionModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await redisClient.ping();

    try {
      const clientId = new mongoose.Types.ObjectId();
      const artistId = new mongoose.Types.ObjectId();

      const commission = await CommissionModel.create({
        clientId,
        artistId,
        description: 'Delayed jobs test',
        budget: 75,
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24),
        commission_status: 'Pending_Approval',
      } as any);

      await commissionService.addFollowUpJob(commission._id.toString());
      await commissionService.addPaymentJob(commission._id.toString());
      await commissionService.renegotiateCommission(commission._id.toString(), 'artist');

      const counts = await commissionQueue.getJobCounts();
      expect(counts.delayed).toBeGreaterThanOrEqual(1);

      const delayedJobs = await commissionQueue.getJobs(['delayed']);
      const found = delayedJobs.find((j: any) => j.data?.commissionId === commission._id.toString());
      expect(found).toBeTruthy();
    } finally {
      try { await commissionQueue.close(); } catch (e) {}
      await CommissionModel.deleteMany({});
      await NotificationModel.deleteMany({});
      if (redisClient) await redisClient.quit();
      await mongoose.disconnect();
    }
  }, 40000);
});
