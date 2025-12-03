import { Hono } from 'hono';
import { getNotificationsForCurrentUser } from '../controllers/notificationController';
import { authMiddleware } from '../middleWare/auth';

const notificationsRoute = new Hono();


notificationsRoute.get('/', authMiddleware, getNotificationsForCurrentUser);

export default notificationsRoute;
