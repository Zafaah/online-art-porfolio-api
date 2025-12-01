import type { Context } from "hono";
import { UserModel } from "../models/userModel"
import { sendError, sendResponse } from "../utilits/apiResponse";
import bcrypt from "bcrypt"
import { generalToken } from "./auth";
import { createAuditLog } from "../utilits/auditLogUtilits";
export const registerUser = async (c: Context) => {
   try {
      const body = await c.req.json();
      const { userName, email, password, role } = body;

      if (!userName || !email || !password || !role) {
         sendError(c, 404, 'All fields are required');
        
      }

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
         sendError(c,404,"User already exists")
         
      }

      const hashedPassword = await bcrypt.hash(password, 10);


      const newUser = new UserModel({
         userName,
         email,
         password: hashedPassword,
         role,
      });
      await newUser.save();

      const token = await generalToken({userName:newUser.userName,role:newUser.role})

      newUser.lastToken = token;

      await newUser.save();
      await createAuditLog(c,{
         userId: newUser._id,
         action: "Created User",
         entityType: "User",
         entityId: newUser._id
      })
      return sendResponse(c, 201, 'User registered successfully',
         {
            user: {
               userName: newUser.userName,
               email: newUser.email,
               role: newUser.role,
            },
            token
         })
   
   }catch (error: any) {
      return sendError(c, 505, error.message || 'internal server error')
   }
};

export const loginUser = async (c: Context) => {
   try {
      const { userName, password } = await c.req.json();

      if (!userName || !password) {
         return sendError(c,404, 'UserName and password are required' );
      }
      const user = await UserModel.findOne({ userName });
      if (!user) {
         c.status(401);
         return sendError(c,404, 'Invalid userName or password' );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
         return sendError(c, 404, 'Invalid  password')
      
      }

      const token = await generalToken ({ userName: user.userName, role: user.role });
      user.lastToken = token;
      
      user.lastToken = token as string;
      await user.save();

      await createAuditLog(c,{
         userId: user._id,
         action: "Logged in User",
         entityType: "User",
         entityId: user._id
      })

      return sendResponse(c, 200, "User logged in successfull", {
         token
      });
   } catch (error: any) {
      return sendError(c,500, error.message || 'internal server error' )
   }
}

export const getUser = async (c: Context) => {
   try {
      const user = await UserModel.find();
      return sendResponse(c, 200, "All users fetched successfully", user);
   } catch (error: any) {
      return sendError(c, 505, error.message || 'internal server error')
   }
}


export const getUserById = async (c: Context) => {

   try {
      const { id }  = c.req.param();
      const user = await UserModel.findById(id);
      if (!user) {
         return sendError(c, 404, "user not found")
      }
      return sendResponse(c, 201, "you get single user", user);
   } catch (error: any) {
      return sendError(c, 505, error.message || 'internal server error')
   }

};

export const updateUser = async (c: Context) => {
   try {
      const id  = c.req.param('id');
      const { userName, email, password, role, profile } = await c.req.json();

      const user = await UserModel.findByIdAndUpdate(id, { userName, email, password, role, profile }, { new: true });

      if (!user) {
         return sendError(c, 404, "user not found")
      }
      await createAuditLog(c,{
         userId: user._id,
         action: "Updated User",
         
         entityType: "User",
         entityId: user._id
      })
      return sendResponse(c, 201, "User updated successfully", user);
   } catch (error: any) {
      return sendError(c, 505, error.message || 'internal server error')
   }
}

export const deleteUser = async (c: Context) => {
   try {
      const id = c.req.param('id');
      const user = await UserModel.findByIdAndDelete(id);
      if (!user) {
         return sendError(c, 404, "user not found")
      }
      await createAuditLog(c,{
         userId: user._id,
         action: "Deleted User",
         entityType: "User",
         entityId: user._id
      })
      return sendResponse(c, 200, "user deleted successfully.....", user)
   } catch (error: any) {
      return sendError(c, 505, error.message || 'internal server error')
   }
}