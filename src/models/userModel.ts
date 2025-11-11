import mongoose from "mongoose";

export interface User{
   userName: string;
   email: string;
   password: string;
   role: 'admin' | 'artist' | 'client';
   lastToken?: string;
   createdAt: Date;
   updatedAt: Date;
};

const userSchema = new mongoose.Schema<User>({
   userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
   },
   email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
   },
   password: {
      type: String,
      required: true,
      trim: true,
   },
   role: {
      type: String,
      enum: [ 'artist', 'client'],
      required: true,
   },

   lastToken: {
      type: String,
      default: undefined,
   },

   createdAt: {
      type: Date,
      default: Date.now,
   },
   updatedAt: {
      type: Date,
      default: Date.now,
   },
}, {
   timestamps: true,
});


export const UserModel = mongoose.model<User>('User', userSchema);