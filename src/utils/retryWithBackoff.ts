import { externalApiLogger } from "../config/logger";

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 5
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      externalApiLogger.error({ error }, "Fetch attempt failed");

      if (i === retries - 1) {
        externalApiLogger.error({ error }, "All fetch retries failed");
        throw error;
      }

      const delay = Math.pow(2, i) * 1000;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("Unexpected retry logic exit");
};
