
import { CommissionModel } from "../models/commissionModel";
import { ArtsWorkModel } from "../models/artsWork";
import { UserModel } from "../models/userModel";
import { ArtistModel } from "../models/artistModel";
import { createAuditLog } from "../utilits/auditLogUtilits";
import type { Context } from "hono";
import { sendError, sendResponse } from "../utilits/apiResponse";


export const submitCommissionRequest = async (c: Context) => { 
   try {
      const user = c.get("user");
      if (!user) {
         return sendError(c, 401, 'Unauthorized');
      }

      const body = await c.req.json();
      const {
         clientId,
         artsWorkId,
         budget,
         due_date,
         description,
      }=body;

      if (!clientId || !artsWorkId || !description || !budget || !due_date) {
         return sendError(c, 400, 'All fields are required');
      };

      if (budget <= 0) {
         return sendError(c, 400, 'Budget must be greater than 0');
      };

      if(due_date < new Date()) {
         return sendError(c, 400, 'Due date must be in the future');
      };

      const clientUser = await UserModel.findOne({ userName: user.userName });
      if (!clientUser) {
         return sendError(c, 404, 'User not found');
      };

      if(clientUser.role !== 'client') {
         return sendError(c, 403, 'Only clients can submit commission requests');
      };

      const art = await ArtsWorkModel.findById(artsWorkId);
      if (!art) {
         return sendError(c, 404, 'Artwork not found');
      };

      if (!art.artistId) {
         return sendError(c, 400, 'Artwork does not have an associated artist');
      };

      const existdata=await CommissionModel.findOne({artsWorkId,clientId: clientUser._id});
      if(existdata) {
         return sendError(c, 400, 'Commission request already exists for this artwork');
      };

      const newCommission = await CommissionModel.create({
         artsWorkId,
         clientId: clientUser._id,
         artistId: art.artistId,
         description,
         budget,
         due_date,
         commission_status: 'Pending_Approval'
      });
      await newCommission.populate('clientId');
      await newCommission.populate('artsWorkId');
      
      await createAuditLog(c,{
         userId: clientUser._id,
         action: "Submitted Commission Request",
         entityType: "Commission",
         entityId: newCommission._id
      })
      return sendResponse(c, 201, "Commission request submitted successfully", newCommission);
      
   } catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
}

export const getArtistCommission = async (c: Context) => { 
   try {

      const user = c.get("user");
      if(!user) {
         return sendError(c, 401, 'Unauthorized');
      }
      const artistUser = await UserModel.findOne({ userName: user.userName });
      if(!artistUser) {
         return sendError(c, 404, 'User not found');
      }
      
      const artist = await ArtistModel.findOne({ userId: artistUser._id });
      if(!artist) {
         return sendError(c, 404, 'Artist profile not found');
      }
      if(artistUser.role !== 'artist') {
         return sendError(c, 403, 'Only artists can view their commissions');
      }
      
      const commissions = await CommissionModel.find({ artistId: artist._id })
         .populate('artsWorkId','title description medium price imag status')
         .populate('clientId','userName email');

      if(!commissions || commissions.length === 0) {
         return sendError(c, 404, 'No commissions found');
      }

      return sendResponse(c, 200, "Commissions fetched successfully", commissions);
   }catch(error:any){
      return sendError(c, 500, error.message || 'internal server error');
   }
}
