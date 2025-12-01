import mongoose from 'mongoose';
export interface Artist{
   userId:mongoose.Types.ObjectId;
   fullName: string;
   bio: string;
   
   location?: string;
   contactInfo?: string;
   socialLinks: {
      LinkedIn?: string;
      Facebook?: string;
   };
   createdAt: Date;
   updatedAt: Date;
}

const artistSchema = new mongoose.Schema<Artist>({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
   },
   fullName: {
      type: String,
      required: true,
      trim: true,

   },
   bio: {
      type: String,
      required: true,
   },
   
   location: {
      type: String,
      default: '',
   },
   contactInfo: {
      type: String,
      default: '',
   },
   socialLinks: {
      type: {
         LinkedIn: { type: String, default: '',},
         Facebook: { type: String, default: '',}
      },
      default:{}
   }
   }, { timestamps: true });

export const ArtistModel = mongoose.model<Artist>('Artist', artistSchema);
