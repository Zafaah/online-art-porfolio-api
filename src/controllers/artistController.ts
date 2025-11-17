import { ArtistModel } from "../models/artistModel";
import { UserModel } from "../models/userModel";
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
      const { userId,fullName, bio, styles, socialLinks,LinkedIn,Facebook, location, contactInfo } = body;

      if (!userId || !fullName || !bio || !styles || !location || !contactInfo) {
         return sendError(c, 404,"FullName, Bio, Styles, SocialLinks, Location, and ContactInfo are required")
         
      }

      const existingArtist = await ArtistModel.findOne({ userId });

      if (existingArtist) {
         return sendError(c, 400,"Artist already exists")
      }

      const user = await UserModel.findById(userId);
      if (user?.role === 'client') {
         return sendError(c, 404,"Clients are not allowed to create artist profiles")
      }


      const newArtist = await ArtistModel.create({
         userId,
         fullName,
         bio,
         styles,
         socialLinks,
         LinkedIn,
         Facebook,
         
         location,
         contactInfo
      });

      await UserModel.findByIdAndUpdate(userId, { isArtist: true });

   await newArtist.populate('userId');

   await createAuditLog(c,{
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
      const { fullName, bio, styles, socialLinks, location, contactInfo } = await c.req.json();

      const artist = await ArtistModel.findByIdAndUpdate(id, { fullName, bio, styles, socialLinks, location, contactInfo }, { new: true });

      if (!artist) {
         return sendError(c, 404, "Artist not found")
      }
      
      await createAuditLog(c, {
         userId: artist.userId,
         action: "Updated Artist",
         entityType: "Artist",
         entityId: artist._id
      });
      await UserModel.findByIdAndUpdate(artist.userId, { isArtist: true });

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
         return sendError(c, 404, "Artist not found")
      }
      await createAuditLog(c,{
         userId: artist.userId,
         action: "Deleted Artist",
         entityType: "Artist",
         entityId: artist._id
      })
      return sendResponse(c,201,"Artist deleted successfully" ,artist);
   } catch (error: any) {
      return sendError(c, 505, error.message || 'internal server error')
   }
};