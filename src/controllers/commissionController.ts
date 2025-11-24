
import { CommissionModel } from "../models/commissionModel";
import { ArtsWorkModel } from "../models/artsWork";
import { UserModel } from "../models/userModel";
import { ArtistModel } from "../models/artistModel";
import { createAuditLog, auditCommissionStatusChange } from "../utilits/auditLogUtilits";
import { commissionQueue } from "../jobs";
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
         artsWorkId,
         budget,
         due_date,
         description,
      }=body;

      if (!artsWorkId || !description || !budget || !due_date) {
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
      await newCommission.populate('artistId');

     const  checkPhysicalArtwork = await ArtsWorkModel.findById(artsWorkId);
      if (checkPhysicalArtwork?.type === 'Physical') {
        return sendError(c, 400, 'Physical artworks are allowed for commission requests');
     }   
      
      await createAuditLog(c,{
         userId: clientUser._id,
         action: "Submitted Commission Request",
         entityType: "Commission",
         entityId: newCommission._id
      })

     
      try {
         await commissionQueue.add('commission-request-submitted', {
            type: 'commission_request',
            commissionId: newCommission._id.toString(),
            userId: newCommission.artistId.toString(),
            message: `New commission request received: "${newCommission.description}" with budget $${newCommission.budget}`,
            recipientType: 'artist',
            commissionData: {
               description: newCommission.description,
               budget: newCommission.budget,
               dueDate: newCommission.due_date
            }
         });
      } catch (jobError) {
         console.log('Job creation failed, but commission was created:', jobError);
      }

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


export const artistAcceptCommission = async (c: Context) => {
   const user = c.get("user");
   if (!user) {
      return sendError(c, 401, 'Unauthorized');
   }
   const artistUser = await UserModel.findOne({ userName: user.userName });
   if (!artistUser) {
      return sendError(c, 404, 'User not found');
   }
   const artist = await ArtistModel.findOne({ userId: artistUser._id });
   if (!artist) {
      return sendError(c, 404, 'Artist profile not found');
   }
   if (artistUser.role !== 'artist') {
      return sendError(c, 403, 'Only artists can accept commissions');
   }
   const { commissionId } = c.req.param();
   const commission = await CommissionModel.findById(commissionId);
   if (!commission) {
      return sendError(c, 404, 'Commission not found');
   }
   if (commission.artistId !== artist._id) {
      return sendError(c, 403, 'You are not authorized to accept this commission');
   }

   const oldStatus = commission.commission_status;
   commission.commission_status = 'In_Progress';
   await commission.save();

   
   await auditCommissionStatusChange(
      commission._id,
      oldStatus,
      'In_Progress',
      artistUser._id,
      'user',
      'Artist accepted commission'
   );

   
   try {
      await commissionQueue.add('commission-accepted', {
         type: 'commission_accepted',
         commissionId: commission._id.toString(),
         userId: commission.clientId.toString(),
         message: `Your commission request "${commission.description}" has been accepted by the artist`,
         recipientType: 'client',
         commissionData: {
            description: commission.description,
            budget: commission.budget,
            dueDate: commission.due_date
         }
      });
   } catch (jobError) {
      console.log('Job creation failed, but commission was accepted:', jobError);
   }

   return sendResponse(c, 200, 'Commission accepted successfully', commission);
};

export const artistCompleteCommission = async (c: Context) => {
   const user = c.get("user");
   if (!user) {
      return sendError(c, 401, 'Unauthorized');
   }
   const artistUser = await UserModel.findOne({ userName: user.userName });
   if (!artistUser) {
      return sendError(c, 404, 'User not found');
   }
   const artist = await ArtistModel.findOne({ userId: artistUser._id });
   if (!artist) {
      return sendError(c, 404, 'Artist profile not found');
   };
   if (artistUser.role !== 'artist') {
      return sendError(c, 403, 'Only artists can complete commissions');
   }
   const { commissionId } = c.req.param();
   const commission = await CommissionModel.findById(commissionId);
   if (!commission) {
      return sendError(c, 404, 'Commission not found');
   }
   if (commission.artistId !== artist._id) {
      return sendError(c, 403, 'You are not authorized to complete this commission');
   }

   const oldStatus = commission.commission_status;
   commission.commission_status = 'Completed';
   await commission.save();

   await auditCommissionStatusChange(
      commission._id,
      oldStatus,
      'Completed',
      artistUser._id,
      'user',
      'Artist marked commission as completed'
   );

   try {
      await commissionQueue.add('commission-completed', {
         type: 'commission_completed',
         commissionId: commission._id.toString(),
         userId: commission.clientId.toString(),
         message: `Your commission "${commission.description}" has been completed by the artist`,
         recipientType: 'client',
         commissionData: {
            description: commission.description,
            budget: commission.budget,
            dueDate: commission.due_date
         }
      });
   } catch (jobError) {
      console.log('Job creation failed, but commission was completed:', jobError);
   }

   return sendResponse(c, 200, 'Commission completed successfully', commission);
};


export const paymentSimulation = async (c: Context) => {
   const user = c.get("user");
   if (!user) {
      return sendError(c, 401, 'Unauthorized');
   }
   const clientUser = await UserModel.findOne({ userName: user.userName });
   if (!clientUser) {
      return sendError(c, 404, 'User not found');
   }
   if (clientUser.role !== 'client') {
      return sendError(c, 403, 'Only clients can simulate payments');
   }
   const { commissionId } = c.req.param();
   const commission = await CommissionModel.findById(commissionId);
   if (!commission) {
      return sendError(c, 404, 'Commission not found');
   }
   if (commission.clientId !== clientUser._id) {
      return sendError(c, 403, 'You are not authorized to simulate this payment');
   }

   const oldStatus = commission.commission_status;
   commission.commission_status = 'Paid';
   await commission.save();

   await auditCommissionStatusChange(
      commission._id,
      oldStatus,
      'Paid',
      clientUser._id,
      'user',
      'Client simulated payment'
   );

   try {
      await commissionQueue.add('commission-payment-confirmed', {
         type: 'payment_confirmed',
         commissionId: commission._id.toString(),
         userId: commission.artistId.toString(),
         message: `Payment confirmed for commission "${commission.description}". The commission is now active.`,
         recipientType: 'artist',
         commissionData: {
            description: commission.description,
            budget: commission.budget,
            dueDate: commission.due_date
         }
      });
   } catch (jobError) {
      console.log('Job creation failed, but payment was processed:', jobError);
   }

   return sendResponse(c, 200, 'Payment simulated successfully', commission);
};

