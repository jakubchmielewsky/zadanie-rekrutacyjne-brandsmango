import dotenv from "dotenv";
dotenv.config();

const required = ["NODE_ENV", "PORT", "MONGO_URI", "DATABASE_PASSWORD"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV!,
  PORT: Number(process.env.PORT),
  MONGO_URI: process.env.MONGO_URI!,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD!,
};
