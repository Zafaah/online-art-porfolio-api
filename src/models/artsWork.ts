import mongoose from 'mongoose';

export interface Artswork{
   title: string;
   description: string;
   medium: string;
   price: number;
   imag:string
   status: 'For_Sale' | 'Reserved' | 'Sold' | 'Archived';
   artistId: mongoose.Types.ObjectId;
   createdAt: Date;
   updatedAt: Date;
   type?: 'Physical' | 'Digital';
   dimensions?: string;
   stock?: number;
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
   imag: {
      type: String,
      required:true
   },
   status: {
      type: String,
      enum: ['For_Sale', 'Reserved', 'Sold', 'Archived'],
      required: true,
   },
   artistId: {
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
   stock: {
      type: Number,
      default: 1,
      min: 0,
   },
}, { timestamps: true });

export const ArtsWorkModel = mongoose.model<Artswork>('ArtsWork', artsWorkSchema);