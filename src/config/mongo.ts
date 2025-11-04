import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async () => {
  const connectionString = env.MONGO_URI.replace(
    "<PASSWORD>",
    env.DATABASE_PASSWORD
  );

  try {
    await mongoose.connect(connectionString);
    console.log("🚀 Connected to MongoDB");
  } catch (error) {
    console.error("💥 MongoDB connection failed:", error);
  }

  mongoose.connection.on("error", (error) => {
    console.error("💥 MongoDB error:", error);
  });
};
