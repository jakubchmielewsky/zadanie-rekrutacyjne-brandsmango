import cron from "node-cron";
import { syncOrders } from "../features/orders/order.service";
import { env } from "../config/env";
import { jobLogger } from "../config/logger";

export const startOrdersSyncJob = async () => {
  jobLogger.info("Initial orders sync started");
  try {
    const start = Date.now();
    await syncOrders();
    const duration = Date.now() - start;

    jobLogger.info({ duration }, "Initial orders sync completed");
  } catch (err) {
    jobLogger.error({ err }, "Initial orders sync failed");
  }

  const cronExpr = `*/${env.SYNC_INTERVAL_IN_MINUTES} * * * *`;
  jobLogger.info(`Scheduling recurring orders sync: "${cronExpr}"`);

  cron.schedule(cronExpr, async () => {
    jobLogger.info("Scheduled orders sync started");
    try {
      const start = Date.now();
      await syncOrders();
      const duration = Date.now() - start;

      jobLogger.info({ duration }, "Scheduled orders sync completed");
    } catch (err) {
      jobLogger.error({ err }, "Scheduled orders sync failed");
    }
  });
};
