import OrderModel, { OrderDocument } from "./order.model";
import { toApiDateFormat } from "../../utils/toApiDateFormat";
import { AsyncParser } from "@json2csv/node";
import { FilterQuery } from "mongoose";
import AppError from "../../utils/AppError";
import { externalApiLogger } from "../../config/logger";
import { fetchOrdersWithRetryAndBackoff } from "./idosell.client";
import { APIOrder } from "./order.types";

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

  externalApiLogger.info(`Synced (${updatesInTotal} orders updated in total)`);
};

export const findOrders = async (filter: FilterQuery<OrderDocument>) => {
  return await OrderModel.find(filter).select("-orderChangeDate").lean();
};

export const streamOrdersAsCSV = (filter: FilterQuery<OrderDocument>) => {
  const cursor = OrderModel.find(filter)
    .lean()
    .select("-orderChangeDate")
    .cursor();

  const CSVParser = new AsyncParser({
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

  return CSVParser.parse(cursor);
};

export const findOrderById = async (orderId: string) => {
  const order = await OrderModel.findById(orderId)
    .select("-orderChangeDate")
    .lean();

  if (!order) throw new AppError("Order not found", 404);

  return order;
};
