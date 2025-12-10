import { env } from "../../config/env";
import { externalApiLogger } from "../../config/logger";
import { APIOrder, APIOrderListSchema } from "./order.types";
import { retryWithBackoff } from "../../utils/retryWithBackoff";

export const fetchOrders = async (
  resultsPage: number,
  resultsLimit: number,
  dateBegin: string,
  dateType: "add" | "modified",
  timeoutMs = 20000
): Promise<APIOrder[]> => {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

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
        signal: abortController.signal,
      }
    );

    if (!res.ok)
      throw new Error(`IdoSell returned error response: ${res.status}`);

    const rawJSON = await res.json();

    const parsed = APIOrderListSchema.parse(rawJSON);

    return parsed.Results ?? [];
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
