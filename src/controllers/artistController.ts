import { ArtistModel } from "../models/artistModel";
import { UserModel } from "../models/userModel";

export const getArtists = async (c: any) => { 
   const artists = await ArtistModel.find();
   return c.json(artists);
}

export const getArtistById = async (c: any) => { 
   const { id } = c.req.param();
   const artist = await ArtistModel.findById(id).populate('userId', 'userName email');
   if (!artist) {
      c.status(404);
      return c.json({ message: "Artist not found" });
   }
   return c.json(artist);
}

export const createArtist = async (c: any) => {
   try {
      const body = await c.req.json();
      const { userId,fullName, bio, styles, socialLinks, location, contactInfo } = body;

      if (!userId || !fullName || !bio || !styles  || !location || !contactInfo) {
         c.status(400);
         return c.json({ message: "FullName, Bio, Styles, SocialLinks, Location, and ContactInfo are required" });
      }

      const existingArtist = await ArtistModel.findOne({ userId });

      if (existingArtist) {
         c.status(400);
         return c.json({ message: "Artist already exists" });
      }

      const user = await UserModel.findById(userId);
      if (user?.role === 'client') {
         c.status(403);
         return c.json({ message: "Clients are not allowed to create artist profiles" });
      }

      console.log("Create Artist Body:", socialLinks);
      const newArtist = await ArtistModel.create({
         userId,
         fullName,
         bio,
         styles,
         socialLinks,
         location,
         contactInfo
      });

      await UserModel.findByIdAndUpdate(userId, { isArtist: true });

   await newArtist.populate('userId');

   c.status(201);
   return c.json({ newArtist });
   } catch (error) {
      console.error("Create Artist Error:", error);
      c.status(500);
      return c.json({ message: "Error creating artist", error });
   }
};

export const updateArtist = async (c: any) => {
   try {
      const { id } = c.req.param();
      const { fullName, bio, styles, socialLinks, location, contactInfo } = await c.req.json();

      const artist = await ArtistModel.findByIdAndUpdate(id, { fullName, bio, styles, socialLinks, location, contactInfo }, { new: true });

      if (!artist) {
         c.status(404);
         return c.json({ message: "Artist not found" });
      }
      return c.json(artist);
   } catch (error) {
      console.error("Update Artist Error:", error);
      c.status(500);
      return c.json({ message: "Error updating artist", error });
   }
};

export const deleteArtist = async (c: any) => {
   try {
      const { id } = c.req.param();
      const artist = await ArtistModel.findByIdAndDelete(id);
      if (!artist) {
         c.status(404);
         return c.json({ message: "Artist not found" });
      }
      return c.json({ message: "Artist deleted successfully" });
   } catch (error) {
      console.error("Delete Artist Error:", error);
      c.status(500);
      return c.json({ message: "Error deleting artist", error });
   }
};