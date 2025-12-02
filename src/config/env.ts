import dotenv from "dotenv";
import { processLogger } from "./logger";
dotenv.config();

const required = [
  "NODE_ENV",
  "PORT",
  "MONGO_URI",
  "DATABASE_PASSWORD",
  "SYNC_INTERVAL_IN_MINUTES",
  "API_KEY",
  "IDOSELL_API_KEY",
];

for (const key of required) {
  if (!process.env[key]) {
    processLogger.fatal(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV!,
  PORT: Number(process.env.PORT),
  MONGO_URI: process.env.MONGO_URI!,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD!,
  SYNC_INTERVAL_IN_MINUTES: process.env.SYNC_INTERVAL_IN_MINUTES!,
  API_KEY: process.env.API_KEY!,
  IDOSELL_API_KEY: process.env.IDOSELL_API_KEY!,
};
