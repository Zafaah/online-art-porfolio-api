import  mongoose from "mongoose";


export interface Commission {
   artsWorkId: mongoose.Types.ObjectId | null;
   clientId: mongoose.Types.ObjectId;
   artistId: mongoose.Types.ObjectId;
   description:string;
   budget: number;
   due_date: Date;
   commission_status: 'Pending_Approval' | 'In_Progress' | 'Completed' | 'Cancelled'| 'Paid';
   createdAt: Date;
   updatedAt: Date;
}

const commissionSchema = new mongoose.Schema<Commission>({
   artsWorkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ArtsWork',
      default: null,
   },
   clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      
   },
   description: {
      type: String,
      required: true,
   },
   budget: {
      type: Number,
      required: true,
   },
   due_date: {
      type: Date,
      required: true,
   }, 
   commission_status: {
      type: String,
      enum: ['Pending_Approval',
         'In_Progress', 
         'Completed', 
         'Cancelled', 
         'Paid',
      ],
      required: true,
   },
}, { timestamps: true });

export const CommissionModel = mongoose.model<Commission>('Commission', commissionSchema);