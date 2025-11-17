import { Hono } from "hono";
import { connectDB } from "./src/config/db";
import { serve } from "bun";
import userRoute from "./src/routes/userRoute";
import artistRoute from "./src/routes/artistRoute";
import artsworkRouter from "./src/routes/arttsWorkRouter";
import commissionRoute from "./src/routes/commissionRoute";
// import orderRoute from "./src/routes/orderRoute";
import "./src/jobs";

const app = new Hono();
 

await connectDB();

const PORT = Number(Bun.env.PORT) || 8000;

app.get("/", (c) => c.text("Online Art Portfolio API is running"));

app.route("/api/users", userRoute);
app.route('/api/artists', artistRoute);
app.route('/api/artswork', artsworkRouter);
app.route('/api/commission',commissionRoute);
// app.route('/api/orders', orderRoute);

serve({
   fetch: app.fetch,
   port: PORT,
   hostname: '0.0.0.0',
});


console.log(`Server is running on http://localhost:${PORT}`);