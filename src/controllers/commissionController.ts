
import { CommissionModel, type Commission } from "../models/commissionModel";
import { ArtsWorkModel } from "../models/artsWork";
import { UserModel } from "../models/userModel";
import { ArtistModel, type Artist } from "../models/artistModel";
import { createAuditLog, auditCommissionStatusChange } from "../utilits/auditLogUtilits"
import type { Context } from "hono";
import { sendError, sendResponse } from "../utilits/apiResponse";
import { commissionService } from "../services/commissionService";


export const getAllCommission = async (c: Context) => {
   const commissions = await CommissionModel.find()
      .populate('artsWorkId', ' title description medium price imag status')
      .populate('clientId', 'userName email')
      .populate('artistId', 'fullname')

   return sendResponse(c,200, "fetch all commission successfully...",commissions)
} 


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
      } = body;


      if (!artsWorkId || !description || !budget || !due_date) {
         return sendError(c, 400, 'All fields are required');
      };


      
 
      const clientUser = await UserModel.findOne({ userName: user.userName });
      if (!clientUser) {
         return sendError(c, 404, 'User not found');
      };

      

      if (clientUser.role !== 'client') {
         return sendError(c, 403, 'Only clients can submit commission requests');
      };

      const art = await ArtsWorkModel.findById(artsWorkId);
      if (!art) {
         return sendError(c, 404, 'Artwork not found');
      };


      if (!art.artist) {
         return sendError(c, 400, 'Artwork does not have an associated artist');
      };
      if (budget <= 0) {
         return sendError(c, 400, 'Budget must be greater than 0');
      }


      // if (budget >= art.price) {
      //    return sendError(c, 400, 'Budget must be less than the artwork price');
      // }

      if (due_date < new Date()) {
         return sendError(c, 400, 'Due date must be in the future');
      };

      const existdata = await CommissionModel.findOne({ artsWorkId, clientId: clientUser._id });
      if (existdata) {
         return sendError(c, 400, 'Commission request already exists for this artwork');
      };

      const newCommission = await CommissionModel.create({
         artsWorkId,
         clientId: clientUser._id,
         artistId: art.artist._id,
         description,
         budget,
         due_date,
         commission_status: 'Pending_Approval'
      });
      await newCommission.populate('clientId');
      await newCommission.populate('artsWorkId');
      await newCommission.populate('artistId');

      const checkPhysicalArtwork = await ArtsWorkModel.findById(artsWorkId);
      if (checkPhysicalArtwork?.type === 'Physical') {
         return sendError(c, 400, 'Physical artworks are not allowed for commission requests');
      }

      const updatedCommission = await commissionService.updateStatus(newCommission._id.toString(), 'Pending_Approval');

      await createAuditLog(c, {
         userId: clientUser._id,
         action: "Submitted Commission Request",
         entityType: "Commission",
         entityId: newCommission._id,
         metadata: {
            artsWorkId: artsWorkId,
            clientId: clientUser._id.toString(),
            artistId: art.artist._id.toString(),
            budget: budget,
            dueDate: due_date,
            description: description
         }
      })

      await commissionService.submitCommissionRequest(updatedCommission._id.toString());

      return sendResponse(c, 201, "Commission request submitted successfully", updatedCommission);

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
         .populate('artsWorkId',' title description medium price imag status')
         .populate('clientId', 'userName email')
         .populate('artistId', 'fullname')

      if(!commissions || commissions.length === 0) {
         return sendError(c, 404, 'No commissions found');
      }

      return sendResponse(c, 200, "Commissions fetched successfully", commissions);
   }catch(error:any){
      return sendError(c, 500, error.message || 'internal server error');
   }
}



export const artistAcceptCommission = async (c: Context) => {
   try {
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
      
      if (commission.artistId.toString() !== artist._id.toString()) {
         return sendError(c, 403, 'You are not authorized to accept this commission');
      }
      if (commission.commission_status === 'In_Progress') {
         return sendError(c, 400, 'Commission is already in progress');
      }
      
     if(commission.commission_status !== 'Pending_Approval') {
         return sendError(c, 400, 'Only commissions that are Pending Approval can be accepted');
      }
     

      await createAuditLog(c, {
         userId: artistUser._id,
         action: "Accepted Commission",
         entityType: "Commission",
         entityId: commission._id,
         metadata: {
            commissionId: commission._id.toString(),
            artistId: artist._id.toString(),
            clientId: commission.clientId.toString(),
            artsWorkId: commission.artsWorkId?.toString() ,
            budget: commission.budget,
            dueDate: commission.due_date,
            description: commission.description
         }
      })
      const updatedCommission = await commissionService.updateStatus(commission._id.toString(), 'In_Progress');

      await commissionService.acceptCommission(updatedCommission._id.toString());
      
      return sendResponse(c, 200, 'Commission accepted successfully', updatedCommission);  
  } catch (error: any) {
    return sendError(c, 500, error.message || 'internal server error');
  }
  
   
};

export const artistCompleteCommission = async (c: Context) => {
   try {
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
      if (commission.artistId.toString() !== artist._id.toString()) {
         return sendError(c, 403, 'You are not authorized to complete this commission');
      }
      if (commission.commission_status === 'Completed') {
         return sendError(c, 400, 'Commission is already completed');
      }
      if (commission.commission_status !== 'In_Progress') {
         return sendError(c, 400, 'Only commissions that are In Progress can be completed');
      };
     
   

   await createAuditLog(c, {
      userId: artistUser._id,
      action: "Completed Commission",
      entityType: "Commission",
      entityId: commission._id,
      metadata: {
         commissionId: commission._id.toString(),
         artistId: artist._id.toString(),
         clientId: commission.clientId.toString(),
         artsWorkId: commission.artsWorkId?.toString() ,
         budget: commission.budget,
         dueDate: commission.due_date,
         description: commission.description
      }
   });
  const updatedCommission = await commissionService.updateStatus(commission._id.toString(), 'Completed');

  await commissionService.addFollowUpJob(updatedCommission._id.toString());

  await commissionService.completeCommission(updatedCommission._id.toString());
   return sendResponse(c, 200, 'Commission completed successfully', updatedCommission);
} catch (error: any) {
   return sendError(c, 500, error.message || 'internal server error');
}
};


export const paymentSimulation = async (c: Context) => {
   try {
      const user = c.get("user");
      if (!user) {
         return sendError(c, 401, 'Unauthorized');
      }

      const clientUser = await UserModel.findOne({ userName: user.userName });
      if (!clientUser) return sendError(c, 404, 'client User not found');
      if (clientUser.role !== 'client') return sendError(c, 403, 'Only clients can process payments');

      
      const { commissionId } = c.req.param();
      const commission = await CommissionModel.findById(commissionId);
      if (!commission) {
         return sendError(c, 404, 'Commission not found');
      }
      if (commission.clientId.toString() !== clientUser._id.toString()) {
         return sendError(c, 403, 'You are not authorized to pay for this commission');
      }
      if (commission.commission_status === 'Paid') {
         return sendError(c, 400, 'Commission is already paid');
      }
      if (commission.commission_status !== 'Completed') {
         return sendError(c, 400, 'Only completed commissions can be paid for');
      }

      const updatedCommission = await commissionService.updateStatus(commission._id.toString(), 'Paid');
      await commissionService.paymentNotification(updatedCommission._id.toString());
         await commissionService.addPaymentJob(updatedCommission._id.toString())
      

      return sendResponse(c, 200, 'Payment simulated successfully', updatedCommission);
   } catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
};



export const cancelCommission = async (c: Context) => {
   try {
      const userPayload = c.get("user");
      if (!userPayload) return sendError(c, 401, 'Unauthorized');

      const authenticatedUser = await UserModel.findOne({ userName: userPayload.userName });
      if (!authenticatedUser) return sendError(c, 401, 'User not found');

      const { commissionId } = c.req.param();

      const commission = await CommissionModel.findById(commissionId)
         .populate('clientId artistId');
      if (!commission) return sendError(c, 404, 'Commission not found');

      
      
      let artistUserIdStr: string | null = null;
      if (commission.artistId) {
         const maybePopulated = commission.artistId as any;
         if (maybePopulated.userId) {
            artistUserIdStr = maybePopulated.userId?.toString();
         } else {
            const artistDoc = await ArtistModel.findById(commission.artistId as any);
            artistUserIdStr = artistDoc?.userId?.toString() ?? null;
         }
      }
      const isClient = commission.clientId._id.toString() === authenticatedUser._id.toString();
      console.log('isClient:', isClient);
      const isArtist = artistUserIdStr === authenticatedUser._id.toString();

      
      if (!isClient && !isArtist) {
         return sendError(c, 403, 'You can only cancel your own commissions');
      }

    


      if (commission.commission_status === 'Completed' ||
         commission.commission_status === 'Paid') {
         return sendError(c, 400, 'Cannot cancel a completed or paid commission');
      }

      

      const roleType = isClient ? 'client' : isArtist ? 'artist' : null;
  
      const updatedCommission = await commissionService.updateStatus(commission._id.toString(), 'Cancelled');

      await commissionService.cancelCommission(updatedCommission._id.toString(), roleType as 'client' | 'artist');
      return sendResponse(c, 200, 'Commission cancelled successfully', updatedCommission);

   } catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
};


export const renegotiateCommission = async (c: Context) => { 
   const userPayload = c.get("user");
   if (!userPayload) return sendError(c, 401, 'Unauthorized');

   const authenticatedUser = await UserModel.findOne({ userName: userPayload.userName });
   if (!authenticatedUser) return sendError(c, 401, 'User not found');

   const { commissionId } = c.req.param();
   const commission = await CommissionModel.findById(commissionId);
   if (!commission) return sendError(c, 404, 'Commission not found');


   const isClient = commission.clientId.toString() === authenticatedUser._id.toString();

   
   let artistUserIdStr2: string | null = null;
   if (commission.artistId) {
      const maybePopulated = commission.artistId as any;
      if (maybePopulated.userId) {
         artistUserIdStr2 = maybePopulated.userId?.toString?.() ?? maybePopulated.userId?.toString();
      } else {
         const artistDoc = await ArtistModel.findById(commission.artistId as any);
         artistUserIdStr2 = artistDoc?.userId?.toString() ?? null;
      }
   }

   const isArtist = artistUserIdStr2 === authenticatedUser._id.toString();

   if (!isClient && !isArtist) {
      return sendError(c, 403, 'You can only renegotiate your own commissions');
   }
   
   if (commission.commission_status === 'Paid') {
      return sendError(c, 400, 'Cannot renegotiate a  paid commission');
   }
   const roleType = isClient ? 'client' : isArtist ? 'artist' : null;

   const updatedCommission = await commissionService.updateStatus(commission._id.toString(), 'Pending_Approval');

   await commissionService.renegotiateCommission(updatedCommission._id.toString(),roleType as 'client' | 'artist');

    return sendResponse(c, 200, 'Commission renegotiated successfully', commission);
}
 


export const respondToRenegotiation = async (c: Context) => {
   try {
      const userPayload = c.get("user");
      if (!userPayload) return sendError(c, 401, 'Unauthorized');

      const authenticatedUser = await UserModel.findOne({ userName: userPayload.userName });
      if (!authenticatedUser) return sendError(c, 401, 'User not found');

      const { commissionId } = c.req.param();
      const { accepted, newBudget, newDueDate } = await c.req.json();

      const commission = await CommissionModel.findById(commissionId);
      if (!commission) return sendError(c, 404, 'Commission not found');

     
      const isClient = commission.clientId.toString() === authenticatedUser._id.toString();

      
      let artistUserIdStr3: string | null = null;
      if (commission.artistId) {
         const maybePopulated = commission.artistId as any;
         if (maybePopulated.userId) {
            artistUserIdStr3 = maybePopulated.userId?.toString();
         } else {
            const artistDoc = await ArtistModel.findById(commission.artistId as any);
            artistUserIdStr3 = artistDoc?.userId?.toString() ?? null;
         }
      }

      const isArtist = artistUserIdStr3 === authenticatedUser._id.toString();

      if (!isClient && !isArtist) {
         return sendError(c, 403, 'You can only respond to renegotiations for your own commissions');
      }

      
      if (typeof accepted !== 'boolean') {
         return sendError(c, 400, 'Acceptance status must be true or false');
      }

      if (accepted) {
         
         if (newBudget && (newBudget <= 0 || !Number.isFinite(newBudget))) {
            return sendError(c, 400, 'Invalid budget amount');
         }

         if (newDueDate && isNaN(Date.parse(newDueDate))) {
            return sendError(c, 400, 'Invalid due date format');
         }
      }

     
      await commissionService.resolveRenegotiation({
         ...commission.toObject(),
         _id: commission._id.toString(),
         accepted,
         newBudget,
         newDueDate: newDueDate ? new Date(newDueDate) : undefined
      } as Commission & { _id: string, accepted: boolean, newBudget?: number, newDueDate?: Date });

    
      await auditCommissionStatusChange(
         commission._id,
         commission.commission_status,
         commission.commission_status,
         authenticatedUser._id,
         'user',
         `Renegotiation ${accepted ? 'accepted' : 'rejected'} by ${isClient ? 'client' : 'artist'}`
      );

      return sendResponse(c, 200, `Renegotiation ${accepted ? 'accepted' : 'rejected'} successfully`, {
         commissionId: commission._id,
         accepted,
         newBudget,
         newDueDate
      });

   } catch (error: any) {
      return sendError(c, 500, error.message || 'internal server error');
   }
};