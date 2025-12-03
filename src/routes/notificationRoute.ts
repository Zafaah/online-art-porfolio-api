import { Hono } from 'hono';
import { getNotificationsForCurrentUser } from '../controllers/notificationController';
import { authMiddleware } from '../middleWare/auth';

const notificationsRoute = new Hono();

// GET /api/notifications/ -> returns notifications for the logged-in user
notificationsRoute.get('/', authMiddleware, getNotificationsForCurrentUser);

export default notificationsRoute;
