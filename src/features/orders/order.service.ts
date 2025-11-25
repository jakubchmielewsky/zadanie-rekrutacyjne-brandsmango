import OrderModel, { OrderDocument } from "./order.model";
import { APIOrder } from "../../types/APIOrder";
import { toApiDateFormat } from "../../utils/toApiDateFormat";
import { AsyncParser } from "@json2csv/node";
import { FilterQuery } from "mongoose";
import { env } from "../../config/env";
import AppError from "../../utils/AppError";

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 5
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const delay = Math.pow(2, i) * 1000;

      console.error("Fetch attempt failed");

      if (i === retries - 1) {
        console.error("All fetch retries failed");
        throw error;
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("Unexpected retry logic exit");
};

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
    console.error("Failed to fetch orders");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const fetchOrdersWithRetryAndBackoff = async (
  page: number,
  limit: number,
  begin: string,
  type: "add" | "modified"
): Promise<APIOrder[]> => {
  return retryWithBackoff(() => fetchOrders(page, limit, begin, type));
};

const saveOrUpdateOrders = async (orders: APIOrder[]) => {
  const bulkOps = orders.map((order) => ({
    updateOne: {
      filter: { _id: order.orderId },
      update: {
        $set: {
          _id: order.orderId,
          products: order.orderDetails.productsResults.map((p) => ({
            _id: p.productId,
            quantity: p.productQuantity,
          })),
          totalWorth: order.orderDetails.productsResults.reduce(
            (accumulator, currentProduct) =>
              accumulator + currentProduct.productOrderPrice,
            0
          ),
          orderStatus: order.orderDetails.orderStatus,
          orderChangeDate: new Date(order.orderDetails.orderChangeDate),
        },
      },
      upsert: true,
    },
  }));

  await OrderModel.bulkWrite(bulkOps, { ordered: false });
};

export const syncOrders = async () => {
  let resultsPage = 0;
  const resultsLimit = 100;
  let updatesInTotal = 0;

  const lastChangedOrder = await OrderModel.findOne()
    .sort("-orderChangeDate")
    .select("orderChangeDate _id")
    .lean();

  const fetchDateBegin = lastChangedOrder
    ? toApiDateFormat(lastChangedOrder.orderChangeDate)
    : "0001-01-01 00:00:00";

  while (true) {
    const missingOrdersUpdates = (
      await fetchOrdersWithRetryAndBackoff(
        resultsPage,
        resultsLimit,
        fetchDateBegin,
        "modified"
      )
    ).filter(
      (update) =>
        fetchDateBegin !== update.orderDetails.orderChangeDate ||
        update.orderId !== lastChangedOrder?._id
    );

    if (missingOrdersUpdates.length === 0) break;

    await saveOrUpdateOrders(missingOrdersUpdates);
    updatesInTotal += missingOrdersUpdates.length;

    if (missingOrdersUpdates.length < resultsLimit) break;
    resultsPage++;
  }

  console.log(`✅ Synced (${updatesInTotal} orders updated in total)`);
};

export const getOrders = async (filter: FilterQuery<OrderDocument>) => {
  return await OrderModel.find(filter).select("-orderChangeDate").lean();
};

export const getOrdersAsCSV = (filter: FilterQuery<OrderDocument>) => {
  const cursor = OrderModel.find(filter)
    .lean()
    .select("-orderChangeDate")
    .cursor();

  const parser = new AsyncParser({
    fields: [
      {
        label: "Order ID",
        value: (row: OrderDocument) => row._id,
      },
      {
        label: "Order Status",
        value: (row: OrderDocument) => row.orderStatus,
      },
      {
        label: "Total Worth",
        value: (row: OrderDocument) => row.totalWorth,
      },
      {
        label: "Products",
        value: (row: OrderDocument) =>
          row.products.map((p) => `${p._id}:${p.quantity}`).join("; "),
      },
    ],
  });

  return parser.parse(cursor);
};

export const getOrderById = async (orderId: string) => {
  const order = await OrderModel.findById(orderId)
    .select("-orderChangeDate")
    .lean();

  if (!order) throw new AppError("Order not found", 404);

  return order;
};
