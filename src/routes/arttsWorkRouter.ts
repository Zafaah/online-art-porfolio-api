import { Hono } from "hono";
import {
   getArtsWork,
   getArtsWorkById,
   createArtsWork,
   updateArtsWork,
   getPhysicalArtworks,
   deleteArtsWork
} from "../controllers/artsWorkController";

const artsworkRouter = new Hono();
artsworkRouter.get('/', getArtsWork);
artsworkRouter.get('/physical', getPhysicalArtworks);
artsworkRouter.get('/:id', getArtsWorkById);
artsworkRouter.post('/', createArtsWork);
artsworkRouter.put('/:id', updateArtsWork);
artsworkRouter.delete('/:id', deleteArtsWork);
export default artsworkRouter;