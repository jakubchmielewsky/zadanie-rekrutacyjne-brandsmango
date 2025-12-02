import { env } from "../../config/env";
import { externalApiLogger } from "../../config/logger";
import { APIOrder } from "../../types/APIOrder";
import { retryWithBackoff } from "../../utils/retryWithBackoff";

const fetchOrders = async (
  resultsPage: number,
  resultsLimit: number,
  dateBegin: string,
  dateType: "add" | "modified",
  timeoutMs = 20000
): Promise<APIOrder[]> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      "https://zooart6.yourtechnicaldomain.com/api/admin/v7/orders/orders/search",
      {
        method: "POST",
        headers: {
          "X-API-KEY": env.IDOSELL_API_KEY,
        },

        body: JSON.stringify({
          params: {
            ordersRange: {
              ordersDateRange: {
                ordersDateType: dateType,
                ordersDateBegin: dateBegin,
              },
            },
            resultsPage,
            resultsLimit,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok)
      throw new Error(`IdoSell returned error response: ${res.status}`);

    const orders: APIOrder[] = (await res.json()).Results ?? [];
    return orders;
  } catch (error) {
    externalApiLogger.error({ error }, "Failed to fetch orders");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchOrdersWithRetryAndBackoff = async (
  page: number,
  limit: number,
  begin: string,
  type: "add" | "modified"
): Promise<APIOrder[]> => {
  return retryWithBackoff(() => fetchOrders(page, limit, begin, type));
};
