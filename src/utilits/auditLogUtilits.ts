import { AuditLogModel } from "../models/auditLogModel";
import mongoose
   from "mongoose";
import type { Context } from "hono";
import { sendError } from "./apiResponse";
export interface AuditLog {
   userId: mongoose.Types.ObjectId;
   action: string;
   entityId: mongoose.Types.ObjectId;
   entityType: 'ArtsWork' | 'Commission' | 'User' | 'Artist';
}

export const createAuditLog = async (c:Context,log: AuditLog) => {
   try {
      return await AuditLogModel.create({
         ...log,
         timestamp: new Date(),
      });
   } catch (error: any) {
      return sendError(c,501,error.message || "AuditLog Error")
    }
};
