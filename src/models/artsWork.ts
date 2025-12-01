import mongoose from 'mongoose';

export interface Artswork{
   title: string;
   description: string;
   medium: string;
   price: number;
   image:string
   status: 'For_Sale' | 'Reserved' | 'Sold' | 'Archived';
   artist: mongoose.Types.ObjectId;
   createdAt: Date;
   updatedAt: Date;
   type?: 'Physical' | 'Digital';      
   dimensions?: string;
   
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
   image: {
      type: String,
      required:true
   },
   status: {
      type: String,
      enum: ['For_Sale', 'Reserved', 'Sold', 'Archived'],
      required: true,
   },
   artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
   },
   type: {
      type: String,
      enum: ['Physical', 'Digital'],
      default: 'Digital',
   },
   dimensions: {
      type: String,
   },
  
}, { timestamps: true });

export const ArtsWorkModel = mongoose.model<Artswork>('ArtsWork', artsWorkSchema);