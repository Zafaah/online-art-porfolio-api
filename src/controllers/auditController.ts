import { AuditLogModel } from "../models/auditLogModel";
import type { Context } from "hono";
import { sendError, sendResponse } from "../utilits/apiResponse";

export const getAuditLogs = async (c: Context) => {
   try {
      const { entityType, entityId, userId, action, limit = 50, skip = 0 } = c.req.query();

      const filter: any = {};

      if (entityType) filter.entityType = entityType;
      if (entityId) filter.entityId = entityId;
      if (userId) filter.userId = userId;
      if (action) filter.action = action;

      const auditLogs = await AuditLogModel.find(filter)
         .populate('userId', 'userName email')
         .sort({ timestamp: -1 })
         .limit(parseInt(limit as string))
         .skip(parseInt(skip as string));

      const total = await AuditLogModel.countDocuments(filter);

      return sendResponse(c, 200, "Audit logs retrieved successfully", {
         logs: auditLogs,
         pagination: {
            total,
            limit: parseInt(limit as string),
            skip: parseInt(skip as string),
            hasMore: total > parseInt(skip as string) + auditLogs.length
         }
      });

   } catch (error: any) {
      return sendError(c, 500, error.message || 'Failed to retrieve audit logs');
   }
};

export const getCommissionAuditLogs = async (c: Context) => {
   try {
      const { commissionId } = c.req.param();

      if (!commissionId) {
         return sendError(c, 400, 'Commission ID is required');
      }

      const auditLogs = await AuditLogModel.find({
         entityType: 'Commission',
         entityId: commissionId
      })
      .populate('userId', 'userName email')
      .sort({ timestamp: -1 });

      return sendResponse(c, 200, "Commission audit logs retrieved successfully", auditLogs);

   } catch (error: any) {
      return sendError(c, 500, error.message || 'Failed to retrieve commission audit logs');
   }
};
