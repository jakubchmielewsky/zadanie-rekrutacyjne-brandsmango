import OrderModel from "./order.model";
import { APIOrder } from "../../types/APIOrder";
import { toApiDateFormat } from "../../utils/toApiDateFormat";

const fetchOrders = async (
  resultsPage: number,
  resultsLimit: number,
  dateBegin: string,
  dateType: "add" | "modified"
) => {
  const res = await fetch(
    "https://zooart6.yourtechnicaldomain.com/api/admin/v7/orders/orders/search",
    {
      method: "POST",
      headers: {
        "X-API-KEY":
          "YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP",
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
    }
  );

  const orders: APIOrder[] = (await res.json()).Results || [];

  return orders;
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

  await OrderModel.bulkWrite(bulkOps);
  console.log(`Synced ${orders.length} orders`);
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
      await fetchOrders(resultsPage, resultsLimit, fetchDateBegin, "modified")
    ).filter(
      (update) =>
        fetchDateBegin !== update.orderDetails.orderChangeDate ||
        update.orderId !== lastChangedOrder?._id
      //istnieje szansa że będzie więcej niż jeden update w tej samej sekundzie o tym samym id i je odfiltruje
    );

    if (missingOrdersUpdates.length === 0) break;

    await saveOrUpdateOrders(missingOrdersUpdates);
    updatesInTotal += missingOrdersUpdates.length;

    if (missingOrdersUpdates.length < resultsLimit) break;
    resultsPage++;
  }

  console.log(`✅ Synced (${updatesInTotal} orders updated in total)`);
};
