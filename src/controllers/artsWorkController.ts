import { ArtsWorkModel } from "../models/artsWork";

export const getArtsWork = async (c: any) => {
   try {
      const artsWorks = await ArtsWorkModel.find().populate('artistId');
      return c.json(artsWorks);
   } catch (error) {
      c.status(500);
      return c.json({ message: "Error fetching arts works", error });
   }
};

export const getArtsWorkById = async (c: any) => {
   try {
      const { id } = c.req.param();
      const artsWork = await ArtsWorkModel.findById(id).populate('artistId');
      if (!artsWork) {
         c.status(404);
         return c.json({ message: "Arts Work not found" });
      }
      return c.json(artsWork);
   } catch (error) {
      c.status(500);
      return c.json({ message: "Error fetching arts work", error });
   }
};

export const createArtsWork = async (c: any) => {
   try {
      const body = await c.req.json();
      const { title, description, medium, price, status, artistId } = body;
      if (!title || !description || !medium || price == null || !status || !artistId) {
         c.status(400);
         return c.json({ message: "Title, Description, Medium, Price, Status, and ArtistId are required" });
      }
      const newArtsWork = new ArtsWorkModel({
         title,
         description,
         medium,
         price,
         status,
         artistId,
      });
      await newArtsWork.save();
      c.status(201);
      return c.json(newArtsWork);
   } catch (error) {
      c.status(500);
      return c.json({ message: "Error creating arts work", error });
   }
};

export const updateArtsWork = async (c: any) => { 
   try {
      const { id } = c.req.param();
      const { title, description, medium, price, status } = await c.req.json();
      const artsWork = await ArtsWorkModel.findByIdAndUpdate(id, { title, description, medium, price, status }, { new: true });  
      if (!artsWork) {
         c.status(404)
         return c.json({ message: "Arts Work not found" });
      }  
      return c.json(artsWork);
   } catch (error) {
      c.status(500)
      return c.json({ message: "Error updating arts work", error });
   }
}