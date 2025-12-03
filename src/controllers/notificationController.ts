import type { Context } from 'hono';
import { UserModel } from '../models/userModel';
import { ArtistModel } from '../models/artistModel';
import { NotificationModel } from '../models/notification';
import { sendError, sendResponse } from '../utilits/apiResponse';

export const getNotificationsForCurrentUser = async (c: Context) => {
  try {
    const payload = c.get('user');
    if (!payload) return sendError(c, 401, 'Unauthorized');

    const userName = payload.userName;
    if (!userName) return sendError(c, 400, 'Invalid token payload');

    // Find user by userName
    const user = await UserModel.findOne({ userName });
    let searchId: any = null; // id (User._id or Artist._id) to query notifications by

    if (user) {
      // If this user is an artist, use the artist _id instead of the user _id
      if (user.role === 'artist' || payload.role === 'artist') {
        const artist = await ArtistModel.findOne({ userId: user._id });
        if (artist) searchId = artist._id;
        else searchId = user._id; // fallback
      } else {
        // client or other user types -> use user._id
        searchId = user._id;
      }
    } else {
      // If no user record, try to find artist by populated userId matching userName
      const artist = await ArtistModel.findOne().populate({ path: 'userId', match: { userName }, select: '_id userName' });
      if (artist && (artist as any).userId) {
        searchId = artist._id;
      }
    }

    if (!searchId) return sendError(c, 404, 'User/Artist not found');

    const notifications = await NotificationModel.find({ userId: searchId }).sort({ createdAt: -1 });

    return sendResponse(c, 200, 'Notifications fetched successfully', notifications);
  } catch (error: any) {
    return sendError(c, 500, error.message || 'internal server error');
  }
};
