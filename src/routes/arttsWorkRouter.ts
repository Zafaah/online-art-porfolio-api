import { Hono } from "hono";
import { getArtsWork, getArtsWorkById, createArtsWork, updateArtsWork,  } from "../controllers/artsWorkController";

const artsworkRouter = new Hono();
artsworkRouter.get('/', getArtsWork);
artsworkRouter.get('/:id', getArtsWorkById);
artsworkRouter.post('/', createArtsWork);
artsworkRouter.put('/:id', updateArtsWork);
export default artsworkRouter;