import  mongoose  from "mongoose";



export const connectDB = async () => {
   try {
      const dbURL = Bun.env.MONGODB_URL || "mongodb://mongo:27017/online-art-portfolio";
      if (!dbURL) {
         return console.error("MongoDB connection URL is not defined");
      }
      await mongoose.connect(dbURL);
      
      console.log("MongoDB connected successfully");
   } catch (error) {
      console.error("MongoDB connection failed:", error);
      process.exit(1);
   }
 }