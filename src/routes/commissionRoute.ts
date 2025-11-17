import { Hono } from "hono";
import { authMiddleware } from "../middleWare/auth";
import { submitCommissionRequest ,getArtistCommission} from "../controllers/commissionController";

const commissionRoute = new Hono();

commissionRoute.use('*', authMiddleware);

commissionRoute.post('/submit', submitCommissionRequest);
commissionRoute.get('/artist', getArtistCommission);

export default commissionRoute;
