import mongoose from "mongoose";
import { env } from "./env";
import { dbLogger } from "./logger";

export const connectDB = async () => {
  const connectionString = env.MONGO_URI.replace(
    "<PASSWORD>",
    env.DATABASE_PASSWORD
  );

  try {
    await mongoose.connect(connectionString);
    dbLogger.info("Connected to MongoDB");
  } catch (error) {
    dbLogger.error({ error }, "MongoDB connection failed");
  }

  mongoose.connection.on("error", (error) => {
    dbLogger.error({ error }, "MongoDB error");
  });
};
