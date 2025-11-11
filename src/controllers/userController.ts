import { UserModel } from "../models/userModel"


export const getUser = async (c: any) => {
   const user = await UserModel.find();
   return c.json(user);
}

export const getUserById = async (c: any) => {
   const { id } = c.req.param();
   const user = await UserModel.findById(id);
   if (!user) {
      return c.status(404).json({ message: "User not found" });
   }
   return c.json(user);
};

export const updateUser = async (c: any) => {
   const { id } = c.req.param();
   const { userName, email, password, role, profile } = await c.req.json();

   const user = await UserModel.findByIdAndUpdate(id, { userName, email, password, role, profile}, { new: true });

   if (!user) {
      return c.status (404).json({ message: "User not found" });
   }
   return c.json({ message: "User updated successfully", user });
}

export const deleteUser = async (c: any) => {
   const { id } = c.req.param();
   const user = await UserModel.findByIdAndDelete(id);
   if (!user) {
      return c.status(404).json({ message: "User not found" });
   }
   return c.json({ message: "User deleted successfully" });
}