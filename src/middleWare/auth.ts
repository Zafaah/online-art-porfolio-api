
import { verifyToken } from "../controllers/auth";
import type { Context } from "hono";

export const authMiddleware = async (c: Context, next: any) => {
   const authHeader = c.req.header("authorization");
   if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ message: "Token missing. Please login." }, 401);
   }

   const token = authHeader.split(" ")[1];
   try {
      const { payload } = await verifyToken(token!);
      c.set("user", payload);
      await next();
   } catch (error) {
      return c.json({ message: "Invalid or expired token" }, 401);
   }
};
