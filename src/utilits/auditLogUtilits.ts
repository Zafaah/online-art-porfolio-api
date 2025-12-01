import { AuditLogModel } from "../models/auditLogModel";
import mongoose from "mongoose";
import type { Context } from "hono";
import { sendError } from "./apiResponse";
import { UserModel } from "../models/userModel";

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
      changedBy: mongoose.Types.ObjectId;
      reason?: string;
   }
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
      return AuditLogModel.create({
         ...log,
         
         timestamp: new Date(),
      })
   } catch (error: any) {
      return sendError(c, 501, error.message || "AuditLog Error");
   }
};
export const auditSystemEvent = (
   c: Context,
   action: string,   
   entityId: mongoose.Types.ObjectId,
   entityType: 'Commission' | 'Job',
   metadata?: any
) => {
   return createAuditLog(c ,{ action, entityId, entityType, metadata });
};




export const auditCommissionStatusChange = async (
   commissionId: mongoose.Types.ObjectId,
   oldStatus: string,
   newStatus: string,
   userId?: mongoose.Types.ObjectId,
   changedBy: string = 'userName',
   reason?: string
) => {
   try {
      let changedByName = changedBy;
      if (userId) {
         const user = await UserModel.findById(userId).select("userName");
         if (user) {
            changedByName = user.userName; 
         }
      }

      const auditLog = {
         userId,
         action: "STATUS_CHANGE",
         entityId: commissionId,
         entityType: "Commission" as const,
         oldValue: oldStatus,
         newValue: newStatus,
         metadata: {
            changedBy: changedByName, 
            reason
         },
         timestamp: new Date()
      };

      return await AuditLogModel.create(auditLog);

   } catch (error) {
      console.error("Failed to create commission status change audit log:", error);
   }
};

export const auditJobProcessing = async (
   jobType: string,
   commissionId: string,
   success: boolean,
   errorMessage?: string,
   retryCount?: number
) => {
   try {
      const auditLog: JobProcessingAudit = {
         action: success ? 'JOB_COMPLETED' : 'JOB_FAILED',
         entityId: new mongoose.Types.ObjectId(), 
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

