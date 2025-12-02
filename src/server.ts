import { processLogger } from "./config/logger";
process.on("uncaughtException", (err) => {
  processLogger.fatal({ err }, "Uncaught exception - shutting down");
  process.exit(1);
});

import "./config/zod";
import "./index.docs";
import { env } from "./config/env";
import { connectDB } from "./config/mongo";
import app from "./app";
import { startOrdersSyncJob } from "./jobs/syncOrders.job";

connectDB().then(() => {
  startOrdersSyncJob();
});

const server = app.listen(env.PORT, () => {
  processLogger.info(`Server started listening on port ${env.PORT}`);
});

process.on("unhandledRejection", (reason) => {
  processLogger.error({ reason }, "Unhandled promise rejection");
  server.close(() => {
    process.exit(1);
  });
});
