import { Hono } from "hono";
import { authMiddleware } from "../middleWare/auth";
import { getAuditLogs, getCommissionAuditLogs } from "../controllers/auditController";

const auditRoute = new Hono();

auditRoute.use('*', authMiddleware);

auditRoute.get('/', getAuditLogs);


auditRoute.get('/commission/:commissionId', getCommissionAuditLogs);

export default auditRoute;
