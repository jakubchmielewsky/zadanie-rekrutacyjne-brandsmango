import dotenv from "dotenv";
import { processLogger } from "./logger";
import z from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().min(1).max(65535),
  MONGO_URI: z.url().or(z.string().startsWith("mongodb")),
  DATABASE_PASSWORD: z.string().min(1),
  SYNC_INTERVAL_IN_MINUTES: z.coerce.number().min(1),
  API_KEY: z.string().min(1),
  IDOSELL_API_KEY: z.string().min(1),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  processLogger.fatal(
    { issues: parsed.error.issues },
    "Invalid environment variables"
  );
  process.exit(1);
}

export const env = parsed.data;
