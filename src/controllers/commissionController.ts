import { ChangeStream } from "mongodb";
import { CommissionModel } from "../models/commissionModel";
export const getCommissionById = async (c: any) => {
   try {
      const { id } = c.req.param();
      const commission = await CommissionModel.findById(id).populate('artistId').populate('clientId');
      if (!commission) {
         return c.status(404).json({ message: "Commission not found" });
      }
      return c.json(commission);
   } catch (error) {
      c.status(500).json({ message: "Error fetching commission", error });
   }

}

export const getCommissions = async (c: any) => {
   try {
      const commissions = await CommissionModel.find().populate('artistId').populate('clientId');
      return c.json(commissions);
   } catch (error) {
      c.status(500);
      return c.json({ message: "Error fetching commissions", error });
   }
}

export const createCommission = async (c: any) => { 

   try {
      const body = await c.req.json();
      const { artsWorkId, clientId, artistId, description, budget, due_date, commission_status } = body;
      if (!clientId || !artistId || !description || budget == null || !due_date || !commission_status) {
         c.status(400);
         return c.json({ message: "ClientId, ArtistId, Description, Budget, Due_date, and Commission_status are required" });
      }
      const newCommission = await CommissionModel.create({
         artsWorkId,
         clientId,
         artistId,
         description,
         budget,
         due_date,
         commission_status
      });
      c.status(201);
      return c.json(newCommission, "commission created successfully");
   } catch (error) {
      c.status(500);
      
      return c.json({ message: "Error creating commission", error });
   }

}

export const updateCommission = async (c: any) => {
   try {
      const { id } = c.req.param();
      const { artsWorkId, clientId, artistId, description, budget, due_date, commission_status } = await c.req.json();
      const commission = await CommissionModel.findByIdAndUpdate(id, { artsWorkId, clientId, artistId, description, budget, due_date, commission_status }, { new: true });
      if (!commission) {
         c.status(404)
         return c.json({ message: "Commission not found" });
      }
      return c.json(commission);
   } catch (error) {
      c.status(500)
      return c.json({ message: "Error updating commission", error });
   }
}