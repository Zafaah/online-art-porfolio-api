import { SignJWT } from "jose"
import { UserModel } from "../models/userModel";
import bcrypt from "bcrypt"

export const registerUser = async (c: any) => {
   try {
      const body = await c.req.json();
      const { userName, email, password, role } = body;

      if (!userName || !email || !password || !role) {
         c.status(400);
         return c.json({ message: 'All fields are required' });
      }

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
         c.status(409);
         return c.json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);


      const newUser = new UserModel({
         userName,
         email,
         password: hashedPassword,
         role,
      });
      await newUser.save();

      const token = await new SignJWT({ userName: newUser.userName, role: newUser.role })
         .setProtectedHeader({ alg: 'HS256' })
         .setIssuedAt()
         .setExpirationTime('2h')
         .sign(new TextEncoder().encode("your-secret-key"));

      // Store the issued token on the user record
      newUser.lastToken = token;
      await newUser.save();

      c.status(201);
      return c.json({
         message: 'User registered successfully',
         user: {
            userName: newUser.userName,
            email: newUser.email,
            role: newUser.role,
         },
         token,
      });
   } catch (error) {
      console.error("Register Error:", error);
      c.status(500);
      return c.json({ message: "Error registering user", error })
   }
};

export const loginUser = async (c: any) => {
   try {
      const { userName, password } = await c.req.json();

      if (!userName || !password) {
         c.status(400);
         return c.json({ message: 'UserName and password are required' });
      }
      const user = await UserModel.findOne({ userName });
      if (!user) {
         c.status(401);
         return c.json({ message: 'Invalid userName or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
         c.status(401);
         return c.json({ message: 'Invalid  password' });
      }

      const token = await new SignJWT({ userName: user.userName, role: user.role })
         .setProtectedHeader({ alg: 'HS256' })
         .setIssuedAt()
         .setExpirationTime('2h')
         .sign(new TextEncoder().encode("your-secret-key"));

      // Store the issued token on the user record
      user.lastToken = token as string;
      await user.save();

      c.status(200);
      return c.json({
         message: 'User logged in successfully',
         token,
      });
   } catch (error) {
      console.error("login Error:", error);
      c.status(500);
      return c.json({ message: "Error logging in user", error })
   }
}