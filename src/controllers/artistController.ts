import { ArtistModel } from "../models/artistModel";
import { UserModel } from "../models/userModel";
import auditRoute from "../routes/auditRoute";
import { sendError, sendResponse } from "../utilits/apiResponse";
import { createAuditLog } from "../utilits/auditLogUtilits";
import type { Context } from "hono";


export const getArtists = async (c: Context) => { 
   const artists = await ArtistModel.find();
   return sendResponse(c, 200, "Artists fetched successfully", artists);
}

export const getArtistById = async (c: Context) => { 
   try {
      const { id } = c.req.param();
      const artist = await ArtistModel.findById(id).populate('userId', 'userName email');
      if (!artist) {
         return sendError(c, 404,"Artist not found")
         
      }
      await UserModel.findByIdAndUpdate(artist.userId, { isArtist: true });
      await artist.populate('userId');
      return sendResponse(c, 201, "get Artist By successfully....", artist)
   }catch (error: any) {
         return sendError(c, 505, error.message || 'internal server error')
   }
}


export const createArtist = async (c: Context) => {
   try {
      const body = await c.req.json();
      const { userId, fullName, bio, socialLinks = {LinkedIn: '', Facebook: ''}, location, contactInfo } = body;

      if (!userId || !fullName || !bio || !location || !contactInfo) {
         return sendError(c, 404, "FullName, Bio, Location, and ContactInfo are required")

      }

      const existingArtist = await ArtistModel.findOne({ userId });

      if (existingArtist) {
         return sendError(c, 400, "Artist already exists")
      }

      const user = await UserModel.findById(userId);
      if (user?.role === 'client') {
         return sendError(c, 404, "Clients are not allowed to create artist profiles")
      }
      const existUser = await UserModel.findById(userId);
      if (!existUser) {
         return sendError(c, 404, "User not found")
      }


      const newArtist = await ArtistModel.create({
         userId,
         fullName,
         bio,
         socialLinks,
         linkedin: socialLinks.LinkedIn,
         facebook: socialLinks.Facebook,
         location,
         contactInfo
      });

      await UserModel.findByIdAndUpdate(userId, { isArtist: true });

      await newArtist.populate('userId');

      await createAuditLog(c, {
         userId: userId,
         action: "Created Artist",
         entityType: "Artist",
         entityId: newArtist._id
      })

      return sendResponse(c, 201, "new Artist created successfully....", newArtist)
   } catch (error: any) {
      return sendError(c, 505, error.message || 'internal server error')
   }
};



export const updateArtist = async (c: Context) => {
   try {
      const { id } = c.req.param();
      const body = await c.req.json();
      const { fullName, bio,  socialLinks, location,contactInfo } = body;

      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (bio !== undefined) updateData.bio = bio;
      if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
      if (location !== undefined) updateData.location = location;
      if (contactInfo !== undefined) updateData.contactInfo = contactInfo;

      const artist = await ArtistModel.findByIdAndUpdate(
         id,
         { $set: updateData },
         { new: true, runValidators: true }
      );

      if (!artist) {
         return sendError(c, 404, "Artist not found");
      }
      
      
      await UserModel.findByIdAndUpdate(artist.userId, { isArtist: true });
      await createAuditLog(c,{
         userId: artist.userId,
         action: "Updated Artist",
         entityType: "Artist",
         entityId: artist._id,
         oldValue: artist,
         newValue: artist
      })
      return sendResponse(c, 201, "updated successfully...", artist);
   } catch (error: any) {
      return sendError(c, 505, error.message || 'internal server error')
   }
};

export const deleteArtist = async (c: Context) => {
   try {
      const { id } = c.req.param();
      const artist = await ArtistModel.findByIdAndDelete(id);
      if (!artist) {
         return sendError(c, 404, "artist not found")
      }
      await createAuditLog(c, {
         userId: artist._id,
         action: "Deleted Artist",
         entityType: "Artist",
         entityId: artist._id
      })
      return sendResponse(c, 200, "artist deleted successfully.....", artist)
   } catch (error: any) {
      return sendError(c, 505, error.message || 'internal server error')
   }
}