import * as OrderModelModule from "./order.model";
import { fetchOrdersWithRetryAndBackoff } from "./idosell.client";
import { externalApiLogger } from "../../config/logger";
import { syncOrders } from "./order.service";
import { toApiDateFormat } from "../../utils/toApiDateFormat";

const OrderModel = OrderModelModule.default as jest.Mocked<
  typeof OrderModelModule.default
>;

jest.mock("./order.model", () => ({
  findOne: jest.fn(),
  bulkWrite: jest.fn(),
}));

jest.mock("./idosell.client", () => ({
  fetchOrdersWithRetryAndBackoff: jest.fn(),
}));

jest.mock("../../config/logger", () => ({
  externalApiLogger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock("../../utils/toApiDateFormat", () => ({
  toApiDateFormat: jest.fn((date) => `formatted(${date.toISOString()})`),
}));

function mockFindOneReturning(value: any) {
  (OrderModel.findOne as jest.Mock).mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  });
}

describe("syncOrders - unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrder = (id: string, date: string) => ({
    orderId: id,
    orderDetails: {
      orderStatus: "confirmed",
      orderChangeDate: date,
      productsResults: [
        { productId: "P1", productQuantity: 1, productOrderPrice: 10 },
      ],
    },
  });

  test("syncs correctly when database is empty (initial import)", async () => {
    mockFindOneReturning(null);

    (fetchOrdersWithRetryAndBackoff as jest.Mock).mockResolvedValue([
      mockOrder("A", "2024-01-01 10:00:00"),
      mockOrder("B", "2024-01-01 11:00:00"),
    ]);

    await syncOrders();

    expect(OrderModel.bulkWrite).toHaveBeenCalledTimes(1);
    expect((OrderModel.bulkWrite as jest.Mock).mock.calls[0][0]).toHaveLength(
      2
    );

    expect(externalApiLogger.info).toHaveBeenCalledWith(
      "Synced (2 orders updated in total)"
    );
  });

  test("handles multi-page sync", async () => {
    mockFindOneReturning(null);

    const page0 = Array.from({ length: 100 }).map((_, i) =>
      mockOrder(`A${i}`, "2024-01-01 10:00:00")
    );
    const page1 = Array.from({ length: 100 }).map((_, i) =>
      mockOrder(`B${i}`, "2024-01-01 11:00:00")
    );

    (fetchOrdersWithRetryAndBackoff as jest.Mock)
      .mockResolvedValueOnce(page0)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce([]);

    await syncOrders();

    expect(fetchOrdersWithRetryAndBackoff).toHaveBeenCalledTimes(3);
    expect(OrderModel.bulkWrite).toHaveBeenCalledTimes(2);

    expect(externalApiLogger.info).toHaveBeenCalledWith(
      "Synced (200 orders updated in total)"
    );
  });

  test("stops loop when API returns empty list", async () => {
    mockFindOneReturning(null);

    (fetchOrdersWithRetryAndBackoff as jest.Mock).mockResolvedValue([]);

    await syncOrders();

    expect(OrderModel.bulkWrite).not.toHaveBeenCalled();
    expect(externalApiLogger.info).toHaveBeenCalledWith(
      "Synced (0 orders updated in total)"
    );
  });

  test("handles multi-page sync", async () => {
    mockFindOneReturning(null);

    const page0 = Array.from({ length: 100 }).map((_, i) =>
      mockOrder(`A${i}`, "2024-01-01 10:00:00")
    );
    const page1 = Array.from({ length: 100 }).map((_, i) =>
      mockOrder(`B${i}`, "2024-01-01 11:00:00")
    );

    (fetchOrdersWithRetryAndBackoff as jest.Mock)
      .mockResolvedValueOnce(page0)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce([]);

    await syncOrders();

    expect(fetchOrdersWithRetryAndBackoff).toHaveBeenCalledTimes(3);
    expect(OrderModel.bulkWrite).toHaveBeenCalledTimes(2);

    expect(externalApiLogger.info).toHaveBeenCalledWith(
      "Synced (200 orders updated in total)"
    );
  });
});
