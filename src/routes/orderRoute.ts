// import { Hono } from "hono";
// import { authMiddleware } from "../middleWare/auth";
// import { createOrder, getOrderById, getUserOrders, markOrderDelivered, getArtistOrders, shipOrder } from "../controllers/orderController";

// const orderRoute = new Hono();


// orderRoute.use('*', authMiddleware);


// orderRoute.post('/', createOrder);
// orderRoute.get('/', getUserOrders);
// orderRoute.get('/:id', getOrderById);
// orderRoute.post('/:id/delivered', markOrderDelivered);


// orderRoute.get('/artist/orders', getArtistOrders);
// orderRoute.post('/:id/ship', shipOrder);

// export default orderRoute;
