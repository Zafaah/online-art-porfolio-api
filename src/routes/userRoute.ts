import { Hono } from "hono";
import {
   getUser,
   loginUser,
   registerUser,
   getUserById,
   updateUser,
   deleteUser
} from "../controllers/userController";
import { authMiddleware } from "../middleWare/auth";


const userRoute = new Hono();

userRoute.post("/reg", registerUser);
userRoute.post("/login", loginUser);
userRoute.get("/", authMiddleware,  getUser);
userRoute.get("/:id", authMiddleware, getUserById);
userRoute.put("/:id", authMiddleware, updateUser);
userRoute.delete("/:id", authMiddleware, deleteUser);

export default userRoute;