import cron from "node-cron";
import { syncOrders } from "../features/orders/order.service";
import { env } from "../config/env";

export const startOrdersSyncJob = () => {
  cron.schedule(`*/${env.SYNC_INTERVAL_IN_MINUTES} * * * *`, async () => {
    try {
      await syncOrders();
      console.log("✅ Scheduled sync completed.");
    } catch (err) {
      console.error("❌ Scheduled sync failed:", err);
    }
  });
};
