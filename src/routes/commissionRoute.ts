import { Hono } from "hono";
import { authMiddleware } from "../middleWare/auth";
import {
  submitCommissionRequest,
  getArtistCommission,
  artistAcceptCommission,
  artistCompleteCommission,
  paymentSimulation,
  cancelCommission,
  renegotiateCommission,
  respondToRenegotiation
} from "../controllers/commissionController";

const commissionRoute = new Hono();

commissionRoute.use('*', authMiddleware);

commissionRoute.post('/submit', submitCommissionRequest);
commissionRoute.get('/artist', getArtistCommission);
commissionRoute.put('/:commissionId/accept', artistAcceptCommission);
commissionRoute.put('/:commissionId/complete', artistCompleteCommission);
commissionRoute.put('/:commissionId/payment', paymentSimulation);
commissionRoute.put('/:commissionId/cancel', cancelCommission);
commissionRoute.put('/:commissionId/renegotiate', renegotiateCommission);
commissionRoute.put('/:commissionId/renegotiate/respond', respondToRenegotiation);

export default commissionRoute;

