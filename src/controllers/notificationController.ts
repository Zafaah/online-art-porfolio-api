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

    
    const user = await UserModel.findOne({ userName });
    let searchId: any = null; 

    if (user) {
    
      if (user.role === 'artist' || payload.role === 'artist') {
        const artist = await ArtistModel.findOne({ userId: user._id });
        if (artist) searchId = artist._id;
        else searchId = user._id; 
      } else {
      
        searchId = user._id;
      }
    } else {
  
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
