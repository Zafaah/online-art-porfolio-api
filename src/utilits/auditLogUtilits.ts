import { AuditLogModel } from "../models/auditLogModel";
import mongoose from "mongoose";
import type { Context } from "hono";
import { sendError } from "./apiResponse";

export interface AuditLog {
   userId?: mongoose.Types.ObjectId; 
   action: string;
   entityId: mongoose.Types.ObjectId;
   entityType: 'ArtsWork' | 'Commission' | 'User' | 'Artist' | 'Job';
   oldValue?: any;
   newValue?: any;
   metadata?: any;
}

export interface CommissionStatusChangeAudit extends AuditLog {
   entityType: 'Commission';
   oldValue: string; 
   newValue: string; 
   metadata?: {
      changedBy: 'user' | 'system' | 'job';
      reason?: string;
   };
}

export interface JobProcessingAudit extends AuditLog {
   entityType: 'Job';
   metadata: {
      jobType: string;
      commissionId: string;
      success: boolean;
      errorMessage?: string;
      retryCount?: number;
   };
}


export const createAuditLog = async (c: Context, log: AuditLog) => {
   try {
      return await AuditLogModel.create({
         ...log,
         timestamp: new Date(),
      });
   } catch (error: any) {
      return sendError(c, 501, error.message || "AuditLog Error")
   }
};

export const auditCommissionStatusChange = async (
   commissionId: mongoose.Types.ObjectId,
   oldStatus: string,
   newStatus: string,
   userId?: mongoose.Types.ObjectId,
   changedBy: 'user' | 'system' | 'job' = 'user',
   reason?: string
) => {
   try {
      const auditLog: CommissionStatusChangeAudit = {
         userId,
         action: 'STATUS_CHANGE',
         entityId: commissionId,
         entityType: 'Commission',
         oldValue: oldStatus,
         newValue: newStatus,
         metadata: {
            changedBy,
            reason
         }
      };

      return await AuditLogModel.create(auditLog);
   } catch (error: any) {
      console.error('Failed to create commission status change audit log:', error);
      
   }
};

export const auditJobProcessing = async (
   jobId: string,
   jobType: string,
   commissionId: string,
   success: boolean,
   errorMessage?: string,
   retryCount?: number
) => {
   try {
      const auditLog: JobProcessingAudit = {
         action: success ? 'JOB_COMPLETED' : 'JOB_FAILED',
         entityId: new mongoose.Types.ObjectId(jobId),
         entityType: 'Job',
         metadata: {
            jobType,
            commissionId,
            success,
            errorMessage,
            retryCount
         }
      };

      return await AuditLogModel.create(auditLog);
   } catch (error: any) {
      console.error('Failed to create job processing audit log:', error);
   }
};

export const auditSystemEvent = async (
   action: string,
   entityId: mongoose.Types.ObjectId,
   entityType: 'Commission' | 'Job',
   metadata?: any
) => {
   try {
      const auditLog: AuditLog = {
         action,
         entityId,
         entityType,
         metadata
      };

      return await AuditLogModel.create(auditLog);
   } catch (error: any) {
      console.error('Failed to create system event audit log:', error);
      
   }
};
