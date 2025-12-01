import { ArtistModel } from "../models/artistModel";
import { ArtsWorkModel } from "../models/artsWork";
import { sendError, sendResponse } from "../utilits/apiResponse";
import { createAuditLog } from "../utilits/auditLogUtilits";
import type { Context } from "hono";

export const getArtsWork = async (c: Context) => {

   const artsWorks = await ArtsWorkModel.find().populate('artist');
   return sendResponse(c, 200, "Arts Works fetched successfully", artsWorks);

};

export const getArtsWorkById = async (c: Context) => {
   try {
      const { id } = c.req.param();
      const artsWork = await ArtsWorkModel.findById(id).populate('artist');
      if (!artsWork) {
         return sendError(c, 404, "Arts Work not found");
      }
      if (!artsWork.artist) {
         return sendError(c, 404, "Artist not found for this artwork");
      }
      await createAuditLog(c, {
         userId: artsWork.artist._id,
         action: "Fetched Arts Work",
         entityType: "ArtsWork",
         entityId: artsWork._id
      })
      return sendResponse(c, 200, "Arts Work fetched successfully", artsWork);
   } catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
};

export const createArtsWork = async (c: Context) => {
   try {
      const body = await c.req.json();
      const {
         artist,
         title,
         description,
         medium,
         price,
         image,
         status,
         type,
         dimensions,

      } = body
      if (!title || !description || !medium || !price || !status || !artist || !image) {
         return sendError(c, 400, "Title, Description, Medium, Price, Status, Artist, and Image are required");
      }

      if (type === 'Physical' && (!dimensions )) {
         return sendError(c, 400, "Physical artworks require dimensions and stock quantity");
      }

      const existArtist = await ArtistModel.findById(artist);
      if (!existArtist) {
         return sendError(c, 404, "Artist not found");
      }
      const existArtsWork = await ArtsWorkModel.findOne({ title });
      if (existArtsWork) {
         return sendError(c, 400, "Arts Work already exists");
      }

      const newArtsWork = await ArtsWorkModel.create({
         artist,
         title,
         description,
         medium,
         price,
         image,
         status,
         type: type || 'Digital',
         dimensions,
         
      });

      await ArtistModel.findByIdAndUpdate(artist, { isartsWork: true })

      await newArtsWork.populate("artist");

      await createAuditLog(c, {
         userId: artist,
         action: "Created Artwork",
         entityType: "ArtsWork",
         entityId: newArtsWork._id
      })

      return sendResponse(c, 201, "Arts Work created successfully", newArtsWork);
   } catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
};

export const updateArtsWork = async (c: Context) => {
   try {
      const { id } = c.req.param();
      const { title, description, medium, price, status, type, dimensions, artist } = await c.req.json();
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (medium !== undefined) updateData.medium = medium;
      if (price !== undefined) updateData.price = price;
      if (status !== undefined) updateData.status = status;
      if (type !== undefined) updateData.type = type;
      if (dimensions !== undefined) updateData.dimensions = dimensions;
      

      const artsWork = await ArtsWorkModel.findByIdAndUpdate(id, updateData, { new: true }).populate('artist');
      if (!artsWork) {
         return sendError(c, 404, "Arts Work not found");
      }
      
      await createAuditLog(c, {
         userId: artist._id,
         action: "Updated Arts Work",
         entityType: "ArtsWork",
         entityId: artsWork._id
      })
      return sendResponse(c, 201, "Arts Work updated successfully", artsWork);
   } catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
}

export const deleteArtsWork = async (c: Context) => {
   try {
      const { id } = c.req.param();
      const { artist } = await c.req.json();
     
      const artsWork = await ArtsWorkModel.findByIdAndUpdate(id, { artist }, { new: true }).populate('artist');
      if (!artsWork) {
         return sendError(c, 404, "Arts Work not found");
      }

      await createAuditLog(c, {
         userId: artist._id,
         action: "Deleted Arts Work",
         entityType: "ArtsWork",
         entityId: artsWork._id
      })
      return sendResponse(c, 201, "Arts Work deleted successfully", artsWork);
   }
   catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
}

export const getPhysicalArtworks = async (c: Context) => {
   try {
      const artsWorks = await ArtsWorkModel.find({
         type: 'Physical',
         status: 'For_Sale'
      }).populate('artist');

      return sendResponse(c, 200, "Physical artworks fetched successfully", artsWorks);

   } catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
}