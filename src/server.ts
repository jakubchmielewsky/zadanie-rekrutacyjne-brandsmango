process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught exception:", err);
  process.exit(1);
});

import "./config/zod";
import "./index.docs";
import { env } from "./config/env";
import { connectDB } from "./config/mongo";
import app from "./app";
import { startOrdersSyncJob } from "./jobs/syncOrders.job";
import { syncOrders } from "./features/orders/order.service";

connectDB().then(async () => {
  console.log("🔁 Started initial sync...");
  await syncOrders();
  console.log("✅ Completed initial sync");
  startOrdersSyncJob();
});

const PORT = env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server started listening on port ${PORT}...`);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled rejection:", reason);
  server.close(() => {
    process.exit(1);
  });
});
