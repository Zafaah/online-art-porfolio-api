import mongoose from 'mongoose';

export interface Artswork{
   title: string;
   description: string;
   medium: string;
   price: number;
   status: 'For_Sale' | 'Archived';
   artistId: mongoose.Types.ObjectId;
   createdAt: Date;
   updatedAt: Date;
}

const artsWorkSchema = new mongoose.Schema<Artswork>({
   title: {
      type: String,
      required: true,
      trim: true,
   },
   description: {
      type: String,
      required: true,
      trim: true,
   },
   medium: {
      type: String,
      required: true,
   },
   price: {
      type: Number,
      required: true,
      min: 0,
   },
   status: {
      type: String,
      enum: ['For_Sale', 'Archived'],
      required: true,
   },
   artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
   },
}, { timestamps: true });

export const ArtsWorkModel = mongoose.model<Artswork>('ArtsWork', artsWorkSchema);