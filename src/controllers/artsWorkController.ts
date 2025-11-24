import { ArtistModel } from "../models/artistModel";
import { ArtsWorkModel } from "../models/artsWork";
import { sendError, sendResponse } from "../utilits/apiResponse";
import { createAuditLog } from "../utilits/auditLogUtilits";
import type { Context } from "hono";

export const getArtsWork = async (c: Context) => {
  
      const artsWorks = await ArtsWorkModel.find().populate('artistId');
      return sendResponse(c, 200, "Arts Works fetched successfully", artsWorks);
  
};

export const getArtsWorkById = async (c: Context) => {
   try {
      const { id } = c.req.param();
      const artsWork = await ArtsWorkModel.findById(id).populate('artistId');
      if (!artsWork) {
         return sendError(c, 404, "Arts Work not found");
      }
      await createAuditLog(c,{
         userId: artsWork.artistId,
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
      const{
         artistId,
         title,
         description,
         medium,
         price,
         imag,
         status,
         type,
         dimensions,
         stock 
      }=body
      if (!title || !description || !medium || price  || !status || !artistId || !imag) {
         return sendError(c, 400, "Title, Description, Medium, Price, Status, ArtistId, and Image are required");
      }

      if (type === 'Physical' && (!dimensions || stock == null)) {
         return sendError(c, 400, "Physical artworks require dimensions and stock quantity");
      }
      
      
      const newArtsWork = await ArtsWorkModel.create({
         artistId,
         title,
         description,
         medium,
         price,
         imag,
         status,
         type: type || 'Digital', 
         dimensions,
         stock: stock !== undefined ? stock : 1
      });
      
      await ArtistModel.findByIdAndUpdate(artistId, {isartsWork:true})

      await newArtsWork.populate("artistId");

      await createAuditLog(c,{
         userId:artistId,
         action: "Created Artwork",
         entityType: "ArtsWork",
         entityId: newArtsWork._id
      })

      return sendResponse(c, 201, "Arts Work created successfully", newArtsWork);
   } catch (error:any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
};

export const updateArtsWork = async (c: Context) => {
   try {
      const { id } = c.req.param();
      const { title, description, medium, price, status, type, dimensions, stock } = await c.req.json();
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (medium !== undefined) updateData.medium = medium;
      if (price !== undefined) updateData.price = price;
      if (status !== undefined) updateData.status = status;
      if (type !== undefined) updateData.type = type;
      if (dimensions !== undefined) updateData.dimensions = dimensions;
      if (stock !== undefined) updateData.stock = stock;

      const artsWork = await ArtsWorkModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!artsWork) {
         return sendError(c, 404, "Arts Work not found");
      }
      await createAuditLog(c,{
         userId: artsWork.artistId,
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
      const artsWork = await ArtsWorkModel.findByIdAndDelete(id);
      if (!artsWork) {
         return sendError(c, 404, "Arts Work not found");
      }
      await createAuditLog(c,{
         userId: artsWork.artistId,
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
      }).populate('artistId');

      return sendResponse(c, 200, "Physical artworks fetched successfully", artsWorks);

   } catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
}